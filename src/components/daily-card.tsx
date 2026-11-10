import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/card";
import { HourlyStrip } from "@/components/hourly-strip";
import { WeatherIcon } from "@/components/weather-icon";
import { weekday } from "@/lib/format";
import { useUnits } from "@/lib/units";
import { Weather, sameDay } from "@/lib/weather";
import { useColors } from "@/theme/colors";

export function DailyCard({ daily, hourlyAll }: { daily: Weather["daily"]; hourlyAll: Weather["hourlyAll"] }) {
  const colors = useColors();
  const units = useUnits();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
    setOpenIndex((cur) => (cur === i ? null : i));
  };

  return (
    <Card style={{ paddingVertical: 4 }}>
      {daily.map((d, i) => {
        const hours = hourlyAll.filter((h) => sameDay(h.time, d.date));
        const open = openIndex === i;
        return (
          <View
            key={d.date.toISOString()}
            style={{
              borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0,
              borderTopColor: colors.separator,
            }}
          >
            <Pressable
              onPress={() => toggle(i)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${weekday(d.date, i)}, dettaglio orario`}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 }}
            >
              <Text style={{ flex: 1, color: colors.label, fontSize: 16 }}>{weekday(d.date, i)}</Text>
              <WeatherIcon code={d.code} size={24} />
              <Text style={{ width: 56, textAlign: "right", color: colors.tint, fontSize: 12 }}>
                {units.rain(d.precipProb, d.precipMm)}
              </Text>
              <Text style={{ width: 36, textAlign: "right", color: colors.secondaryLabel, fontSize: 16, fontVariant: ["tabular-nums"] }}>
                {units.temp(d.min)}
              </Text>
              <Text style={{ width: 36, textAlign: "right", color: colors.label, fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                {units.temp(d.max)}
              </Text>
              <SymbolView
                name={open ? "chevron.up" : "chevron.down"}
                tintColor={colors.secondaryLabel}
                size={12}
                fallback={<Text style={{ color: colors.secondaryLabel as string, fontSize: 12 }}>{open ? "▲" : "▼"}</Text>}
              />
            </Pressable>

            {open ? (
              <View style={{ paddingBottom: 8 }}>
                {hours.length === 0 ? (
                  <Text style={{ color: colors.secondaryLabel, fontSize: 13, paddingVertical: 8 }}>
                    Dettaglio orario non disponibile. Trascina verso il basso per aggiornare.
                  </Text>
                ) : (
                  <HourlyStrip hours={hours} />
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}
