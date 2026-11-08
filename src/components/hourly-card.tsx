import { FlatList, Text, View } from "react-native";
import { Card } from "@/components/card";
import { WeatherIcon } from "@/components/weather-icon";
import { useUnits } from "@/lib/units";
import { Weather } from "@/lib/weather";
import { useColors } from "@/theme/colors";

export function HourlyCard({ hourly }: { hourly: Weather["hourly"] }) {
  const colors = useColors();
  const units = useUnits();
  return (
    <Card style={{ paddingHorizontal: 4 }}>
      <FlatList
        horizontal
        data={hourly}
        keyExtractor={(h) => h.time.toISOString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        renderItem={({ item, index }) => (
          <View style={{ alignItems: "center", width: 56, gap: 6 }}>
            <Text style={{ color: colors.secondaryLabel, fontSize: 12 }}>{index === 0 ? "Ora" : units.time(item.time)}</Text>
            <WeatherIcon code={item.code} isDay={item.isDay} size={26} />
            <Text style={{ color: colors.label, fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] }}>
              {units.temp(item.temperature)}
            </Text>
            <Text style={{ color: colors.tint, fontSize: 11, height: 14 }}>
              {units.rain(item.precipProb, item.precipMm) || " "}
            </Text>
          </View>
        )}
      />
    </Card>
  );
}
