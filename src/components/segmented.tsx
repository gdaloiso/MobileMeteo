import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import { useColors } from "@/theme/colors";

type Option<T extends string> = { value: T; label: string };

// Selettore a segmenti: le opzioni sono tutte visibili e si sceglie con un tocco.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 3,
        gap: 3,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: colors.background,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 9,
              borderRadius: 10,
              borderCurve: "continuous",
              backgroundColor: active ? colors.tint : "transparent",
            }}
          >
            <Text style={{ color: active ? "#ffffff" : colors.label, fontWeight: "600", fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
