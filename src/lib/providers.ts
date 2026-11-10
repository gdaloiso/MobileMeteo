import { AirQuality, HttpError, Place, Weather, getJson, summarizeRain } from "./weather";

export type ProviderId = "open-meteo" | "met-no";

export type Settings = {
  provider: ProviderId;
  // Contatto (email o sito) richiesto da MET Norway nello User-Agent.
  // Resta sul telefono e viene inviato solo a MET Norway.
  metContact: string;
  theme: ThemeMode;
  tempUnit: TempUnit;
  windUnit: WindUnit;
  precipUnit: PrecipUnit;
  timeFormat: TimeFormat;
  startMode: StartMode;
  // Città usata all'avvio quando startMode è "fixed"
  fixedPlace: Place | null;
  // Sezione "Dettagli" della schermata Oggi aperta o nascosta
  detailsOpen: boolean;
};

export type ThemeMode = "auto" | "light" | "dark";
export type TempUnit = "c" | "f";
export type WindUnit = "kmh" | "ms" | "mph";
export type PrecipUnit = "mm" | "in";
export type TimeFormat = "24" | "12";
// gps: sempre la posizione attuale; last: l'ultima vista; fixed: una città scelta
export type StartMode = "gps" | "last" | "fixed";

export const DEFAULT_SETTINGS: Settings = {
  provider: "open-meteo",
  metContact: "",
  theme: "auto",
  tempUnit: "c",
  windUnit: "kmh",
  precipUnit: "mm",
  timeFormat: "24",
  startMode: "last",
  fixedPlace: null,
  detailsOpen: true,
};

export const PROVIDERS: {
  id: ProviderId;
  name: string;
  description: string;
  attribution: string;
  needsContact: boolean;
}[] = [
  {
    id: "open-meteo",
    name: "Open-Meteo",
    description:
      "Combina più modelli (ICON, Météo-France, ECMWF) e sceglie il migliore per la zona. Include alba, tramonto e temperatura percepita.",
    attribution: "Open-Meteo.com (CC BY 4.0)",
    needsContact: false,
  },
  {
    id: "met-no",
    name: "MET Norway",
    description:
      "Servizio meteorologico norvegese. Nessuna chiave, ma serve un tuo contatto. Niente alba, tramonto e temperatura percepita.",
    attribution: "MET Norway (CC BY 4.0)",
    needsContact: true,
  },
];

export function providerInfo(id: ProviderId) {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

export function isValidContact(s: string): boolean {
  const v = s.trim();
  return v.length >= 5 && (v.includes("@") || v.startsWith("http"));
}

export async function fetchWeather(settings: Settings, lat: number, lon: number): Promise<Weather> {
  // La qualità dell'aria arriva da Open-Meteo con entrambe le fonti; se manca, il resto funziona.
  const [weather, airQuality] = await Promise.all([
    settings.provider === "met-no" ? fetchMetNo(lat, lon, settings.metContact) : fetchOpenMeteo(lat, lon),
    fetchAirQuality(lat, lon),
  ]);
  return airQuality ? { ...weather, airQuality } : weather;
}

async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality | undefined> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "european_aqi,pm2_5",
    // Il valore "attuale" a volte manca: in quel caso uso l'ultima ora disponibile
    hourly: "european_aqi,pm2_5",
    past_hours: "3",
    forecast_hours: "1",
    timezone: "auto",
  });
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const lastNumber = (arr: unknown): number | undefined => {
    if (!Array.isArray(arr)) return undefined;
    for (let i = arr.length - 1; i >= 0; i--) if (typeof arr[i] === "number") return arr[i] as number;
    return undefined;
  };

  // Un secondo tentativo copre i brevi errori di rete
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const d = await getJson<any>(url);
      const aqi = typeof d?.current?.european_aqi === "number" ? d.current.european_aqi : lastNumber(d?.hourly?.european_aqi);
      if (aqi == null) return undefined;
      const pm25 = typeof d?.current?.pm2_5 === "number" ? d.current.pm2_5 : lastNumber(d?.hourly?.pm2_5);
      return { aqi, pm25 };
    } catch {
      // riprovo
    }
  }
  return undefined;
}

/* ------------------------------ Open-Meteo ------------------------------ */

async function fetchOpenMeteo(lat: number, lon: number): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,uv_index,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "kmh",
  });
  const d = await getJson<any>(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  // Gli orari sono "ora del luogo" senza fuso: li confronto come stringhe ISO
  // con l'ora corrente del luogo, così funziona anche per città in altri fusi.
  const nowHour = String(d.current.time).slice(0, 13) + ":00";
  const allWithKey = (d.hourly.time as string[]).map((t, i) => ({
    key: t,
    time: new Date(t),
    temperature: d.hourly.temperature_2m[i] as number,
    precipProb: (d.hourly.precipitation_probability[i] ?? undefined) as number | undefined,
    code: d.hourly.weather_code[i] as number,
    isDay: d.hourly.is_day[i] === 1,
  }));
  const hourlyAll = allWithKey.map(({ key, ...rest }) => rest);
  const hourly = allWithKey
    .filter((h) => h.key >= nowHour)
    .slice(0, 24)
    .map(({ key, ...rest }) => rest);

  const daily = (d.daily.time as string[]).map((t, i) => ({
    date: new Date(`${t}T00:00:00`),
    min: d.daily.temperature_2m_min[i] as number,
    max: d.daily.temperature_2m_max[i] as number,
    precipProb: (d.daily.precipitation_probability_max[i] ?? undefined) as number | undefined,
    code: d.daily.weather_code[i] as number,
  }));

  // Pioggia nelle prossime 6 ore, dalle stesse ore mostrate nell'app
  const nowMin = Number(String(d.current.time).slice(14, 16)) || 0;
  const rainHours = hourly.slice(0, 6).map((h, i) => ({ startMin: Math.max(0, i * 60 - nowMin), code: h.code }));

  return {
    uv: typeof d.current.uv_index === "number" ? d.current.uv_index : undefined,
    uvMax: typeof d.daily.uv_index_max?.[0] === "number" ? d.daily.uv_index_max[0] : undefined,
    rainSoon: summarizeRain(rainHours),
    current: {
      temperature: d.current.temperature_2m,
      feelsLike: d.current.apparent_temperature,
      humidity: d.current.relative_humidity_2m,
      windSpeed: d.current.wind_speed_10m,
      windDir: typeof d.current.wind_direction_10m === "number" ? d.current.wind_direction_10m : undefined,
      code: d.current.weather_code,
      isDay: d.current.is_day === 1,
    },
    hourly,
    hourlyAll,
    daily,
    sunrise: d.daily.sunrise?.[0] ? new Date(d.daily.sunrise[0]) : undefined,
    sunset: d.daily.sunset?.[0] ? new Date(d.daily.sunset[0]) : undefined,
  };
}

/* ------------------------------ MET Norway ------------------------------ */

// Converte i "symbol_code" di MET Norway (es. "partlycloudy_day") nei codici WMO usati dall'app.
function metSymbol(sym?: string): { code: number; isDay: boolean } {
  if (!sym) return { code: 3, isDay: true };
  const isDay = !sym.endsWith("_night");
  const base = sym.replace(/_(day|night|polartwilight)$/, "");
  if (base.includes("thunder")) return { code: 95, isDay };
  const map: Record<string, number> = {
    clearsky: 0,
    fair: 1,
    partlycloudy: 2,
    cloudy: 3,
    fog: 45,
    lightrain: 61,
    rain: 63,
    heavyrain: 65,
    lightrainshowers: 80,
    rainshowers: 81,
    heavyrainshowers: 82,
    lightsleet: 66,
    sleet: 67,
    heavysleet: 67,
    lightsleetshowers: 66,
    sleetshowers: 67,
    heavysleetshowers: 67,
    lightsnow: 71,
    snow: 73,
    heavysnow: 75,
    lightsnowshowers: 85,
    snowshowers: 85,
    heavysnowshowers: 86,
  };
  return { code: map[base] ?? 3, isDay };
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

async function fetchMetNo(lat: number, lon: number, contact: string): Promise<Weather> {
  if (!isValidContact(contact)) {
    throw new Error("Per usare MET Norway inserisci un contatto (email o sito) nelle impostazioni.");
  }
  // MET Norway accetta al massimo 4 decimali
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  let d: any;
  try {
    d = await getJson<any>(url, { "User-Agent": `MeteoPersonale/1.0 ${contact.trim()}` });
  } catch (e) {
    if (e instanceof HttpError && (e.status === 403 || e.status === 429)) {
      throw new Error("MET Norway ha rifiutato la richiesta. Controlla il contatto nelle impostazioni e riprova.");
    }
    throw e;
  }

  const entries = ((d.properties?.timeseries ?? []) as any[]).map((e) => ({
    time: new Date(e.time),
    t: e.data?.instant?.details ?? {},
    h1: e.data?.next_1_hours,
    h6: e.data?.next_6_hours,
    h12: e.data?.next_12_hours,
  }));
  if (entries.length === 0) throw new Error("MET Norway non ha restituito dati per questo luogo.");

  const first = entries[0];
  const nowSym = metSymbol(first.h1?.summary?.symbol_code ?? first.h6?.summary?.symbol_code);

  const now = Date.now();
  // MET Norway dà dati orari solo per i primi giorni, poi ogni 6 ore
  const hourlyAll = entries
    .filter((e) => e.h1)
    .map((e) => {
      const s = metSymbol(e.h1?.summary?.symbol_code);
      return {
        time: e.time,
        temperature: e.t.air_temperature as number,
        precipProb: e.h1?.details?.probability_of_precipitation as number | undefined,
        precipMm: e.h1?.details?.precipitation_amount as number | undefined,
        code: s.code,
        isDay: s.isDay,
      };
    });
  const hourly = hourlyAll.filter((h) => h.time.getTime() > now - 60 * 60 * 1000).slice(0, 24);

  // Pioggia nelle prossime 6 ore, dalle stesse ore mostrate nell'app
  const rainHours = hourly.slice(0, 6).map((h) => ({
    startMin: Math.max(0, (h.time.getTime() - now) / 60000),
    code: h.code,
  }));

  // Raggruppo per giorno (fuso del telefono) e ricavo min/max e pioggia
  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const k = dayKey(e.time);
    const g = groups.get(k);
    if (g) g.push(e);
    else groups.set(k, [e]);
  }
  const daily = Array.from(groups.values())
    .slice(0, 7)
    .map((g) => {
      const temps = g.map((e) => e.t.air_temperature).filter((x: any) => typeof x === "number") as number[];
      const mm = g.reduce(
        (sum, e) => sum + (e.h1?.details?.precipitation_amount ?? e.h6?.details?.precipitation_amount ?? 0),
        0
      );
      const probs = g
        .map((e) => e.h6?.details?.probability_of_precipitation ?? e.h1?.details?.probability_of_precipitation)
        .filter((x: any) => typeof x === "number") as number[];
      // simbolo del giorno: la rilevazione più vicina alle 13
      const withSymbol = g.filter((e) => e.h6?.summary?.symbol_code || e.h1?.summary?.symbol_code);
      const pick = (withSymbol.length ? withSymbol : g).reduce((best, e) =>
        Math.abs(e.time.getHours() - 13) < Math.abs(best.time.getHours() - 13) ? e : best
      );
      const sym = metSymbol(
        pick.h6?.summary?.symbol_code ?? pick.h1?.summary?.symbol_code ?? pick.h12?.summary?.symbol_code
      );
      const t0 = g[0].time;
      return {
        date: new Date(t0.getFullYear(), t0.getMonth(), t0.getDate()),
        min: temps.length ? Math.min(...temps) : 0,
        max: temps.length ? Math.max(...temps) : 0,
        precipProb: probs.length ? Math.max(...probs) : undefined,
        precipMm: mm,
        code: sym.code,
      };
    });

  return {
    current: {
      temperature: first.t.air_temperature,
      humidity: first.t.relative_humidity ?? 0,
      windSpeed: (first.t.wind_speed ?? 0) * 3.6, // m/s -> km/h
      windDir: typeof first.t.wind_from_direction === "number" ? first.t.wind_from_direction : undefined,
      code: nowSym.code,
      isDay: nowSym.isDay,
    },
    hourly,
    hourlyAll,
    daily,
    rainSoon: summarizeRain(rainHours),
  };
}
