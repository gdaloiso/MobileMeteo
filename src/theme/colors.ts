import { useColorScheme } from "react-native";

// Palette esplicita per tema chiaro e scuro. Non uso i colori di sistema nativi
// perché non seguono il tema forzato dalle impostazioni (chiaro/scuro).
const light = {
  label: "#000000",
  secondaryLabel: "rgba(60,60,67,0.6)",
  separator: "rgba(60,60,67,0.29)",
  background: "#f2f2f7",
  card: "#ffffff",
  tint: "#007aff",
  danger: "#ff3b30",
  star: "#ffcc00",
};

const dark: typeof light = {
  label: "#ffffff",
  secondaryLabel: "rgba(235,235,245,0.6)",
  separator: "rgba(84,84,88,0.65)",
  background: "#000000",
  card: "#1c1c1e",
  tint: "#0a84ff",
  danger: "#ff453a",
  star: "#ffd60a",
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}
