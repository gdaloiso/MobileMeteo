import { Pressable, Text } from "react-native";
import { useColors } from "@/theme/colors";

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: active ? colors.tint : colors.card,
      }}
    >
      <Text style={{ color: active ? "#ffffff" : colors.label, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
