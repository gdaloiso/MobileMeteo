import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ProviderId } from "./providers";
import type { Weather } from "./weather";

// Dati più recenti di così non vengono richiesti di nuovo.
export const FRESH_MS = 10 * 60 * 1000;

const INDEX_KEY = "wx:index:v1";
const MAX_ENTRIES = 15;

type Stored = { savedAt: number; data: unknown };

// Arrotondo a 2 decimali (circa 1 km): posizioni molto vicine usano la stessa voce.
const keyFor = (provider: ProviderId, lat: number, lon: number) =>
  `wx:v1:${provider}:${lat.toFixed(2)},${lon.toFixed(2)}`;

// JSON trasforma le date in testo: le riconverto.
function revive(raw: any): Weather {
  const d = (v: unknown) => (v ? new Date(v as string) : undefined);
  return {
    current: raw.current,
    hourly: (raw.hourly ?? []).map((h: any) => ({ ...h, time: new Date(h.time) })),
    hourlyAll: (raw.hourlyAll ?? []).map((h: any) => ({ ...h, time: new Date(h.time) })),
    daily: (raw.daily ?? []).map((x: any) => ({ ...x, date: new Date(x.date) })),
    sunrise: d(raw.sunrise),
    sunset: d(raw.sunset),
    uv: raw.uv,
    uvMax: raw.uvMax,
    airQuality: raw.airQuality,
    rainSoon: raw.rainSoon,
  };
}

// Se i dati sono vecchi, tolgo le ore e i giorni già passati.
export function trimStale(w: Weather, now = Date.now(), savedAt = now): Weather {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const hourly = w.hourly.filter((h) => h.time.getTime() > now - 60 * 60 * 1000);
  const daily = w.daily.filter((x) => x.date.getTime() >= startOfToday.getTime());
  // La pioggia imminente vale pochi minuti: se i dati sono vecchi non la mostro
  const rainSoon = now - savedAt <= 30 * 60 * 1000 ? w.rainSoon : undefined;
  return {
    ...w,
    rainSoon,
    hourly: hourly.length ? hourly : w.hourly,
    daily: daily.length ? daily : w.daily,
  };
}

export async function getCached(
  provider: ProviderId,
  lat: number,
  lon: number
): Promise<{ weather: Weather; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(provider, lat, lon));
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    return { weather: revive(stored.data), savedAt: stored.savedAt };
  } catch {
    return null;
  }
}

export async function setCached(provider: ProviderId, lat: number, lon: number, weather: Weather): Promise<void> {
  try {
    const key = keyFor(provider, lat, lon);
    const stored: Stored = { savedAt: Date.now(), data: weather };
    await AsyncStorage.setItem(key, JSON.stringify(stored));

    // tengo solo le ultime MAX_ENTRIES voci
    const rawIndex = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
    const next = [key, ...index.filter((k) => k !== key)];
    const evicted = next.slice(MAX_ENTRIES);
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)));
    if (evicted.length) await AsyncStorage.multiRemove(evicted);
  } catch {
    // la cache è un aiuto: se fallisce non è un problema
  }
}
