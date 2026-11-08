import { Stack } from "expo-router/stack";
import { useColors } from "@/theme/colors";

export default function SettingsLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="settings" options={{ title: "Impostazioni" }} />
    </Stack>
  );
}
