import { Text, View } from "react-native";
import { useColors } from "@/theme/colors";

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", flex: 1, gap: 2 }}>
      <Text selectable style={{ color: colors.label, fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
      {sub ? <Text style={{ color: colors.label, fontSize: 13, fontWeight: "600" }}>{sub}</Text> : null}
      <Text style={{ color: colors.secondaryLabel, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
