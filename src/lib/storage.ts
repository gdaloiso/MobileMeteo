import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS, Settings } from "./providers";
import type { Place } from "./weather";

const SETTINGS_KEY = "settings:v1";
const FAVORITES_KEY = "favorites:v1";
const LAST_KEY = "last:v2";

export type LastPlace = { place: Place; gps: boolean };

export async function loadFavorites(): Promise<Place[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as Place[]) : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(list: Place[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    // best effort
  }
}

// Ultimo luogo mostrato (anche se arriva dal GPS), per aprire l'app subito
// con i dati salvati mentre la posizione si aggiorna.
export async function loadLast(): Promise<LastPlace | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as LastPlace) : null;
  } catch {
    return null;
  }
}

export async function saveLast(v: LastPlace): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_KEY, JSON.stringify(v));
  } catch {
    // best effort
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // best effort
  }
}

export function samePlace(a: Place, b: Place): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;
}
