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
};

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

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
    const data = await getJson<{ address?: Record<string, string> }>(url);
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
