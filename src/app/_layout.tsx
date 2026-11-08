import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";
import { WeatherProvider } from "@/providers/weather-provider";

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* Icone della barra di stato scure sul tema chiaro e chiare sullo scuro, anche quando il tema è forzato */}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <WeatherProvider>
        <NativeTabs>
          <NativeTabs.Trigger name="(today)">
            <NativeTabs.Trigger.Icon sf={{ default: "cloud.sun", selected: "cloud.sun.fill" }} md="partly_cloudy_day" />
            <NativeTabs.Trigger.Label>Oggi</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="(cities)">
            <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
            <NativeTabs.Trigger.Label>Città</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="(settings)">
            <NativeTabs.Trigger.Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} md="settings" />
            <NativeTabs.Trigger.Label>Impostazioni</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </WeatherProvider>
    </ThemeProvider>
  );
}
