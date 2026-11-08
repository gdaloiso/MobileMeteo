import { Stack } from "expo-router/stack";
import { useColors } from "@/theme/colors";

export default function CitiesLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="cities" options={{ title: "Città" }} />
    </Stack>
  );
}
