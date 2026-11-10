import { useId } from "react";
import { ScrollView, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { WeatherIcon } from "@/components/weather-icon";
import { smoothPath } from "@/lib/chart";
import { useUnits } from "@/lib/units";
import type { Hour } from "@/lib/weather";
import { useColors } from "@/theme/colors";

const COL = 56; // larghezza di ogni ora
const CHART_H = 64;
const PAD = 12;

// Ore in orizzontale con la curva della temperatura sopra: il grafico e le colonne
// stanno nello stesso contenuto scorrevole, quindi restano allineati.
export function HourlyStrip({ hours, firstIsNow = false }: { hours: Hour[]; firstIsNow?: boolean }) {
  const colors = useColors();
  const units = useUnits();
  const gradId = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (hours.length === 0) return null;

  const temps = hours.map((h) => h.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;
  const width = hours.length * COL;
  const pts = hours.map((h, i) => ({
    x: i * COL + COL / 2,
    y: PAD + (1 - (h.temperature - min) / range) * (CHART_H - 2 * PAD),
  }));
  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1].x},${CHART_H} L${pts[0].x},${CHART_H} Z`;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
      <View style={{ width }}>
        <Svg width={width} height={CHART_H}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.tint} stopOpacity={0.28} />
              <Stop offset="1" stopColor={colors.tint} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${gradId})`} />
          <Path d={line} stroke={colors.tint} strokeWidth={2.5} strokeLinecap="round" fill="none" />
          {pts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.card} stroke={colors.tint} strokeWidth={2} />
          ))}
        </Svg>
        <View style={{ flexDirection: "row" }}>
          {hours.map((h, i) => (
            <View key={h.time.toISOString()} style={{ alignItems: "center", width: COL, gap: 6 }}>
              <Text style={{ color: colors.secondaryLabel, fontSize: 12 }}>
                {firstIsNow && i === 0 ? "Ora" : units.time(h.time)}
              </Text>
              <WeatherIcon code={h.code} isDay={h.isDay} size={26} />
              <Text style={{ color: colors.label, fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] }}>
                {units.temp(h.temperature)}
              </Text>
              <Text style={{ color: colors.tint, fontSize: 11, height: 14 }}>
                {units.rain(h.precipProb, h.precipMm) || " "}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
