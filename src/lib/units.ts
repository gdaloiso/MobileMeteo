import { useMemo } from "react";
import { useWeather } from "@/providers/weather-provider";
import { hh } from "./format";
import type { TempUnit, WindUnit } from "./providers";
import { rainLabel, rainStat } from "./weather";

// I dati arrivano sempre in °C e km/h: si convertono solo al momento di mostrarli.
export const formatTemp = (celsius: number, unit: TempUnit) =>
  `${Math.round(unit === "f" ? (celsius * 9) / 5 + 32 : celsius)}°`;

export const formatWind = (kmh: number, unit: WindUnit) => {
  if (unit === "ms") return `${Math.round(kmh / 3.6)} m/s`;
  if (unit === "mph") return `${Math.round(kmh / 1.609344)} mph`;
  return `${Math.round(kmh)} km/h`;
};

export function useUnits() {
  const { tempUnit, windUnit, precipUnit, timeFormat } = useWeather().settings;
  return useMemo(
    () => ({
      temp: (c: number) => formatTemp(c, tempUnit),
      wind: (kmh: number) => formatWind(kmh, windUnit),
      time: (d: Date) => hh(d, timeFormat === "12"),
      rain: (prob?: number, mm?: number) => rainLabel(prob, mm, precipUnit),
      rainStat: (prob?: number, mm?: number) => rainStat(prob, mm, precipUnit),
    }),
    [tempUnit, windUnit, precipUnit, timeFormat]
  );
}
