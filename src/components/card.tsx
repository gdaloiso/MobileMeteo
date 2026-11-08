import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { useColors } from "@/theme/colors";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: 16, borderCurve: "continuous", padding: 14 }, style]}>
      {children}
    </View>
  );
}
