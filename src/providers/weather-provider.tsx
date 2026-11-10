import * as Location from "expo-location";
import { Appearance } from "react-native";
import { ReactNode, createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRESH_MS, getCached, setCached, trimStale } from "@/lib/cache";
import { DEFAULT_SETTINGS, Settings, fetchWeather } from "@/lib/providers";
import { loadFavorites, loadLast, loadSettings, saveFavorites, saveLast, saveSettings, samePlace } from "@/lib/storage";
import { Place, UNKNOWN_PLACE, Weather, reverseGeocode } from "@/lib/weather";

type WeatherContext = {
  place: Place | null;
  usingGps: boolean;
  weather: Weather | null;
  /** Quando sono stati scaricati i dati mostrati (millisecondi). */
  updatedAt: number | null;
  /** true se l'ultimo aggiornamento è fallito e si vedono dati salvati. */
  stale: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  favorites: Place[];
  settings: Settings;
  isFavorite: (p: Place) => boolean;
  toggleFavorite: (p: Place) => void;
  choosePlace: (p: Place) => Promise<void>;
  goToMyLocation: () => Promise<void>;
  refresh: () => Promise<void>;
  applySettings: (s: Settings) => Promise<void>;
};

// "auto" segue il tema del telefono; chiaro/scuro lo forzano per tutta l'app.
function applyTheme(mode: Settings["theme"]) {
  Appearance.setColorScheme(mode === "auto" ? "unspecified" : mode);
}

const Ctx = createContext<WeatherContext | null>(null);

export function useWeather(): WeatherContext {
  const v = use(Ctx);
  if (!v) throw new Error("useWeather va usato dentro WeatherProvider");
  return v;
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [place, setPlace] = useState<Place | null>(null);
  const [usingGps, setUsingGps] = useState(true);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Place[]>([]);

  // I ref evitano valori vecchi dentro le funzioni asincrone.
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const placeRef = useRef<Place | null>(null);
  const gpsRef = useRef(true);
  const lastGpsRef = useRef<Place | null>(null);
  // Ogni caricamento ha un numero: se ne parte uno nuovo, il vecchio viene ignorato.
  const seq = useRef(0);

  const applyPlace = useCallback((p: Place | null, gps: boolean) => {
    placeRef.current = p;
    gpsRef.current = gps;
    setPlace(p);
    setUsingGps(gps);
    if (p) {
      if (gps) lastGpsRef.current = p;
      void saveLast({ place: p, gps });
    }
  }, []);

  const load = useCallback(async (p: Place, force = false) => {
    const s = settingsRef.current;
    const mySeq = ++seq.current;
    setError(null);

    // 1. mostro subito i dati salvati, se ci sono
    const cached = await getCached(s.provider, p.latitude, p.longitude);
    if (mySeq !== seq.current) return;
    if (cached) {
      setWeather(trimStale(cached.weather, Date.now(), cached.savedAt));
      setUpdatedAt(cached.savedAt);
    } else {
      setWeather(null);
      setUpdatedAt(null);
    }
    setStale(false);

    // 2. se sono abbastanza recenti non serve la rete
    if (cached && !force && Date.now() - cached.savedAt < FRESH_MS) {
      setLoading(false);
      return;
    }

    // 3. aggiorno dalla rete
    setLoading(!cached);
    try {
      const w = await fetchWeather(s, p.latitude, p.longitude);
      if (mySeq !== seq.current) return;
      setWeather(w);
      setUpdatedAt(Date.now());
      setStale(false);
      void setCached(s.provider, p.latitude, p.longitude, w);
    } catch (e: any) {
      if (mySeq !== seq.current) return;
      setError(e?.message ?? "Impossibile caricare il meteo");
      if (cached) setStale(true);
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, []);

  // Ottiene la posizione GPS e carica il meteo. Ritorna false se non riesce.
  const locate = useCallback(
    async (silent: boolean, force = false): Promise<boolean> => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== "granted") {
          if (!silent) {
            setError("Permesso di posizione negato. Cerca una città nella scheda Città.");
            setLoading(false);
          }
          return false;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;
        const prev = lastGpsRef.current;
        const near =
          prev &&
          prev.name !== UNKNOWN_PLACE &&
          Math.abs(prev.latitude - latitude) < 0.01 &&
          Math.abs(prev.longitude - longitude) < 0.01;
        // se non mi sono mosso riuso il nome, senza interrogare di nuovo il servizio
        const name = near ? prev.name : (await reverseGeocode(latitude, longitude)) ?? UNKNOWN_PLACE;
        const p: Place = { name, latitude, longitude };
        applyPlace(p, true);
        await load(p, force);
        return true;
      } catch (e: any) {
        if (!silent) {
          setError(e?.message ?? "Impossibile ottenere la posizione");
          setLoading(false);
        }
        return false;
      }
    },
    [applyPlace, load]
  );

  const choosePlace = useCallback(
    async (p: Place) => {
      applyPlace(p, false);
      await load(p);
    },
    [applyPlace, load]
  );

  const goToMyLocation = useCallback(async () => {
    const known = lastGpsRef.current;
    if (known) {
      // mostro subito l'ultima posizione nota, poi la aggiorno
      applyPlace(known, true);
      await load(known);
      await locate(true);
    } else {
      applyPlace(null, true);
      setWeather(null);
      setUpdatedAt(null);
      setError(null);
      setLoading(true);
      await locate(false);
    }
  }, [applyPlace, load, locate]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (gpsRef.current) {
        const ok = await locate(true, true);
        if (!ok && placeRef.current) await load(placeRef.current, true);
      } else if (placeRef.current) {
        await load(placeRef.current, true);
      }
    } finally {
      setRefreshing(false);
    }
  }, [load, locate]);

  const applySettings = useCallback(
    async (next: Settings) => {
      const prev = settingsRef.current;
      const changed =
        next.provider !== prev.provider || (next.provider === "met-no" && next.metContact !== prev.metContact);
      settingsRef.current = next;
      setSettings(next);
      applyTheme(next.theme);
      await saveSettings(next);
      if (changed && placeRef.current) await load(placeRef.current);
    },
    [load]
  );

  const toggleFavorite = useCallback((p: Place) => {
    setFavorites((cur) => {
      const next = cur.some((f) => samePlace(f, p)) ? cur.filter((f) => !samePlace(f, p)) : [...cur, p];
      void saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((p: Place) => favorites.some((f) => samePlace(f, p)), [favorites]);

  // Avvio: impostazioni, preferiti e ultimo luogo. I dati salvati compaiono subito.
  useEffect(() => {
    (async () => {
      const [s, favs, last] = await Promise.all([loadSettings(), loadFavorites(), loadLast()]);
      settingsRef.current = s;
      setSettings(s);
      applyTheme(s.theme);
      setFavorites(favs);
      const fixed = s.startMode === "fixed" ? s.fixedPlace : null;
      if (fixed) {
        // città scelta nelle impostazioni
        applyPlace(fixed, false);
        await load(fixed);
      } else if (last && !(s.startMode === "gps" && !last.gps)) {
        applyPlace(last.place, last.gps);
        const loading = load(last.place);
        if (last.gps) await locate(true);
        await loading;
      } else {
        setLoading(true);
        await locate(false);
      }
    })();
  }, [applyPlace, load, locate]);

  const value = useMemo<WeatherContext>(
    () => ({
      place,
      usingGps,
      weather,
      updatedAt,
      stale,
      loading,
      refreshing,
      error,
      favorites,
      settings,
      isFavorite,
      toggleFavorite,
      choosePlace,
      goToMyLocation,
      refresh,
      applySettings,
    }),
    [
      place,
      usingGps,
      weather,
      updatedAt,
      stale,
      loading,
      refreshing,
      error,
      favorites,
      settings,
      isFavorite,
      toggleFavorite,
      choosePlace,
      goToMyLocation,
      refresh,
      applySettings,
    ]
  );

  return <Ctx value={value}>{children}</Ctx>;
}
