import { SymbolView } from "expo-symbols";
import { Text } from "react-native";
import { describeCode } from "@/lib/weather";

// Codice WMO -> simbolo di sistema (SF Symbols su iOS).
// Dove i simboli non esistono (Android, web) resta l'emoji di prima.
function symbolFor(code: number, isDay: boolean) {
  if (code === 0) return isDay ? "sun.max.fill" : "moon.stars.fill";
  if (code === 1 || code === 2) return isDay ? "cloud.sun.fill" : "cloud.moon.fill";
  if (code === 3) return "cloud.fill";
  if (code === 45 || code === 48) return "cloud.fog.fill";
  if (code >= 51 && code <= 57) return "cloud.drizzle.fill";
  if (code === 66 || code === 67) return "cloud.sleet.fill";
  if (code >= 61 && code <= 65) return "cloud.rain.fill";
  if (code >= 71 && code <= 77) return "cloud.snow.fill";
  if (code >= 80 && code <= 82) return isDay ? "cloud.sun.rain.fill" : "cloud.heavyrain.fill";
  if (code === 85 || code === 86) return "cloud.snow.fill";
  if (code >= 95) return "cloud.bolt.rain.fill";
  return "questionmark.circle";
}

export function WeatherIcon({ code, isDay = true, size = 24 }: { code: number; isDay?: boolean; size?: number }) {
  const emoji = describeCode(code, isDay).icon;
  return (
    <SymbolView
      name={symbolFor(code, isDay)}
      type="multicolor"
      size={size}
      fallback={<Text style={{ fontSize: size * 0.9, textAlign: "center" }}>{emoji}</Text>}
    />
  );
}
