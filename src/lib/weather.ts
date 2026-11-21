// Tipi comuni, geocoding e utilità di formattazione.
// I fornitori di dati meteo (Open-Meteo, MET Norway) stanno in providers.ts.

import * as Location from "expo-location";

export type Place = {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type Hour = {
  time: Date;
  temperature: number;
  precipProb?: number;
  precipMm?: number;
  code: number;
  isDay: boolean;
};

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export type Weather = {
  current: {
    temperature: number;
    feelsLike?: number;
    humidity: number;
    windSpeed: number;
    /** Gradi da cui soffia il vento (0 = nord). */
    windDir?: number;
    code: number;
    isDay: boolean;
  };
  // Prossime 24 ore
  hourly: Hour[];
  // Tutte le ore dei 7 giorni, per il dettaglio di un singolo giorno
  hourlyAll: Hour[];
  daily: {
    date: Date;
    min: number;
    max: number;
    precipProb?: number;
    precipMm?: number;
    code: number;
  }[];
  sunrise?: Date;
  sunset?: Date;
  /** Indice UV adesso e massimo di oggi (non disponibile con tutte le fonti). */
  uv?: number;
  uvMax?: number;
  airQuality?: AirQuality;
  rainSoon?: RainSoon;
};

/** Qualità dell'aria: indice europeo (EAQI) e polveri PM2.5. */
export type AirQuality = { aqi: number; pm25?: number };

/** Pioggia o neve imminente, calcolata sulle stesse ore mostrate in "Prossime 24 ore". */
export type RainSoon = {
  state: "now" | "soon" | "none";
  /** true se la precipitazione è neve. */
  snow?: boolean;
  /** Minuti all'inizio della precipitazione (state "soon"). */
  inMin?: number;
  /** Minuti alla fine (state "now"); assente se continua oltre l'orizzonte. */
  endsInMin?: number;
  /** Quanto in avanti guardano i dati, in minuti. */
  horizonMin: number;
};

// Codici WMO con precipitazione: pioggerella, pioggia, neve, rovesci, temporali
export const isPrecipCode = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 71 && code <= 77) || (code >= 80 && code <= 86) || code >= 95;
const isSnowCode = (code: number) => (code >= 71 && code <= 77) || code === 85 || code === 86;

// Una voce per ora; startMin è relativo ad adesso (la prima ora contiene "adesso").
// Usa i codici meteo orari, gli stessi delle icone mostrate, così alert e ore non si contraddicono.
export function summarizeRain(hours: { startMin: number; code: number }[]): RainSoon | undefined {
  if (hours.length === 0) return undefined;
  const horizonMin = Math.round(hours[hours.length - 1].startMin + 60);
  const wet = (h: { code: number }) => isPrecipCode(h.code);
  if (wet(hours[0])) {
    const dry = hours.find((h) => !wet(h));
    return {
      state: "now",
      snow: isSnowCode(hours[0].code),
      endsInMin: dry ? Math.max(0, Math.round(dry.startMin)) : undefined,
      horizonMin,
    };
  }
  const next = hours.find(wet);
  if (next) return { state: "soon", snow: isSnowCode(next.code), inMin: Math.max(0, Math.round(next.startMin)), horizonMin };
  return { state: "none", horizonMin };
}

const fmtMin = (m: number) => {
  if (m < 60) return `${Math.max(5, Math.round(m / 5) * 5)} min`;
  const h = Math.round((m / 60) * 2) / 2;
  return h === 1 ? "1 ora" : `${String(h).replace(".", ",")} ore`;
};

export function rainSoonText(r: RainSoon): string {
  const noun = r.snow ? "Neve" : "Pioggia";
  if (r.state === "now") {
    const verb = r.snow ? "Nevica ora" : "Piove ora";
    return r.endsInMin != null
      ? `${verb} · smette tra circa ${fmtMin(r.endsInMin)}`
      : `${verb} · continua nelle prossime ${fmtMin(r.horizonMin)}`;
  }
  if (r.state === "soon") return `${noun} in arrivo tra circa ${fmtMin(r.inMin ?? 0)}`;
  return `Nessuna precipitazione nelle prossime ${fmtMin(r.horizonMin)}`;
}

export function uvLabel(uv: number): string {
  if (uv < 3) return "Basso";
  if (uv < 6) return "Moderato";
  if (uv < 8) return "Alto";
  if (uv < 11) return "Molto alto";
  return "Estremo";
}

// Indice europeo della qualità dell'aria (EAQI)
export function aqiLabel(aqi: number): string {
  if (aqi <= 20) return "Buona";
  if (aqi <= 40) return "Discreta";
  if (aqi <= 60) return "Moderata";
  if (aqi <= 80) return "Scadente";
  if (aqi <= 100) return "Molto scadente";
  return "Pessima";
}

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
// Nominatim richiede che l'app si identifichi (https://operations.osmfoundation.org/policies/nominatim/)
const NOMINATIM_USER_AGENT = "MeteoPersonale/1.0 (+https://github.com/gdaloiso/MobileMeteo)";

export async function getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, headers ? { headers } : undefined);
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as T;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`Errore di rete (${status})`);
    this.status = status;
  }
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=8&language=it&format=json`;
  const data = await getJson<{ results?: any[] }>(url);
  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export const UNKNOWN_PLACE = "Posizione attuale";

export async function reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
  // Prima il servizio del telefono (non richiede rete esterna né identificazione)
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    const name = a?.city ?? a?.subregion ?? a?.district ?? a?.region;
    if (name) return name;
  } catch {
    // passo al servizio online
  }
  try {
    const url = `${REVERSE_URL}?lat=${lat}&lon=${lon}&format=jsonv2&zoom=10&accept-language=it`;
    const data = await getJson<{ address?: Record<string, string> }>(url, {
      "User-Agent": NOMINATIM_USER_AGENT,
    });
    const a = data.address ?? {};
    return a.city ?? a.town ?? a.village ?? a.municipality ?? a.county;
  } catch {
    return undefined;
  }
}

// Codici WMO -> descrizione italiana + emoji
export function describeCode(code: number, isDay = true): { label: string; icon: string } {
  if (code === 0) return { label: "Sereno", icon: isDay ? "☀️" : "🌙" };
  if (code === 1) return { label: "Prevalentemente sereno", icon: isDay ? "🌤️" : "🌙" };
  if (code === 2) return { label: "Parzialmente nuvoloso", icon: "⛅" };
  if (code === 3) return { label: "Coperto", icon: "☁️" };
  if (code === 45 || code === 48) return { label: "Nebbia", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { label: "Pioggerella", icon: "🌦️" };
  if (code >= 61 && code <= 65) return { label: "Pioggia", icon: "🌧️" };
  if (code === 66 || code === 67) return { label: "Pioggia gelata", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { label: "Neve", icon: "🌨️" };
  if (code >= 80 && code <= 82) return { label: "Rovesci", icon: "🌦️" };
  if (code === 85 || code === 86) return { label: "Rovesci di neve", icon: "🌨️" };
  if (code === 95) return { label: "Temporale", icon: "⛈️" };
  if (code === 96 || code === 99) return { label: "Temporale con grandine", icon: "⛈️" };
  return { label: "—", icon: "❔" };
}

// Pioggia: probabilità se il fornitore la dà, altrimenti millimetri
export function rainLabel(prob?: number, mm?: number, unit: "mm" | "in" = "mm"): string {
  if (prob != null) return prob >= 10 ? `${Math.round(prob)}%` : "";
  if (mm != null && mm >= 0.1) {
    if (unit === "in") return `${(mm / 25.4).toFixed(2)} in`;
    return `${mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm`;
  }
  return "";
}

export function rainStat(prob?: number, mm?: number, unit: "mm" | "in" = "mm"): string {
  return rainLabel(prob, mm, unit) || (prob != null ? "0%" : unit === "in" ? "0 in" : "0 mm");
}

export function placeSubtitle(p: Place): string {
  return [p.region, p.country].filter(Boolean).join(", ");
}
