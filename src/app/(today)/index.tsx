import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Stack } from "expo-router/stack";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { DailyCard } from "@/components/daily-card";
import { HourlyCard } from "@/components/hourly-card";
import { StatGrid, StatItem } from "@/components/stat-grid";
import { WeatherIcon } from "@/components/weather-icon";
import { round, windFrom } from "@/lib/format";
import { formatDuration, moonInfo } from "@/lib/moon";
import { providerInfo } from "@/lib/providers";
import { samePlace } from "@/lib/storage";
import { useUnits } from "@/lib/units";
import { aqiLabel, describeCode, rainSoonText, uvLabel } from "@/lib/weather";
import { useWeather } from "@/providers/weather-provider";
import { useColors } from "@/theme/colors";

export default function TodayScreen() {
  const colors = useColors();
  const sectionTitle = {
    color: colors.secondaryLabel,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    marginLeft: 4,
    marginTop: 4,
  };
  const w = useWeather();
  const units = useUnits();
  const { place, usingGps, weather, loading, error, stale, updatedAt, favorites, settings } = w;
  // La data di riferimento è l'ultimo aggiornamento: la fase lunare cambia lentamente
  const moon = updatedAt ? moonInfo(new Date(updatedAt)) : null;

  // Dettagli in un'unica griglia, una riga per tema: tempo (umidità, vento, pioggia), sole, aria e luna
  const details: StatItem[] = [];
  if (weather) {
    details.push(
      { key: "hum", label: "Umidità", value: `${round(weather.current.humidity)}%` },
      {
        key: "wind",
        label: "Vento",
        value: units.wind(weather.current.windSpeed),
        sub: weather.current.windDir != null ? windFrom(weather.current.windDir) : undefined,
      },
      { key: "rain", label: "Pioggia oggi", value: units.rainStat(weather.daily[0].precipProb, weather.daily[0].precipMm) }
    );
    // seconda riga: il sole
    if (weather.sunrise && weather.sunset) {
      details.push(
        { key: "sunrise", label: "Alba", value: units.time(weather.sunrise) },
        { key: "sunset", label: "Tramonto", value: units.time(weather.sunset) },
        { key: "daylen", label: "Durata del giorno", value: formatDuration(weather.sunset.getTime() - weather.sunrise.getTime()) }
      );
    }
    // terza riga: UV, aria e luna
    if (weather.uv != null) {
      details.push({ key: "uv", label: "Indice UV", value: String(round(weather.uv)), sub: uvLabel(weather.uv) });
    }
    if (weather.airQuality) {
      details.push({ key: "aqi", label: "Qualità aria", value: String(round(weather.airQuality.aqi)), sub: aqiLabel(weather.airQuality.aqi) });
    }
    if (moon) details.push({ key: "moon", label: "Fase lunare", value: `${moon.icon} ${moon.illumination}%`, sub: moon.name });
  }

  const favorite = place && !usingGps ? w.isFavorite(place) : false;
  const cur = weather ? describeCode(weather.current.code, weather.current.isDay) : null;

  const onToggleFavorite = () => {
    if (!place) return;
    if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
    w.toggleFavorite(place);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: place?.name ?? "Meteo",
          headerRight:
            place && !usingGps
              ? () => (
                  <Pressable
                    onPress={onToggleFavorite}
                    hitSlop={8}
                    accessibilityLabel={favorite ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
                  >
                    <SymbolView
                      name={favorite ? "star.fill" : "star"}
                      tintColor={favorite ? colors.star : colors.tint}
                      size={22}
                      fallback={<Text style={{ fontSize: 22, color: colors.tint as string }}>{favorite ? "★" : "☆"}</Text>}
                    />
                  </Pressable>
                )
              : undefined,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={w.refreshing} onRefresh={() => void w.refresh()} />}
      >
        {favorites.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginHorizontal: -16 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            <Chip label="Qui" active={usingGps} onPress={() => void w.goToMyLocation()} />
            {favorites.map((f) => (
              <Chip
                key={`${f.latitude},${f.longitude}`}
                label={f.name}
                active={!usingGps && !!place && samePlace(f, place)}
                onPress={() => void w.choosePlace(f)}
              />
            ))}
          </ScrollView>
        )}

        {!weather ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
            {loading && !error ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                <Text selectable style={{ color: colors.label, fontSize: 16, textAlign: "center" }}>
                  {error ?? "Nessun dato disponibile."}
                </Text>
                <Pressable
                  onPress={() => void w.refresh()}
                  style={{ backgroundColor: colors.tint, borderRadius: 12, borderCurve: "continuous", paddingHorizontal: 20, paddingVertical: 12 }}
                >
                  <Text style={{ color: "#ffffff", fontWeight: "700" }}>Riprova</Text>
                </Pressable>
                <Pressable onPress={() => router.navigate("/settings")} hitSlop={8}>
                  <Text style={{ color: colors.tint, fontWeight: "600" }}>Apri impostazioni</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <>
            {(stale || error) && updatedAt ? (
              <Card>
                <Text selectable style={{ color: colors.secondaryLabel, fontSize: 13 }}>
                  Dati salvati alle {units.time(new Date(updatedAt))}. {error ?? "Non riesco ad aggiornarli."}
                </Text>
              </Card>
            ) : null}

            <View style={{ alignItems: "center", gap: 2, marginVertical: 8 }}>
              {usingGps ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <SymbolView
                    name="location.fill"
                    tintColor={colors.tint}
                    size={12}
                    fallback={<Text style={{ fontSize: 11 }}>📍</Text>}
                  />
                  <Text style={{ color: colors.secondaryLabel, fontSize: 13 }}>Posizione attuale</Text>
                </View>
              ) : null}
              <WeatherIcon code={weather.current.code} isDay={weather.current.isDay} size={60} />
              <Text
                selectable
                style={{ color: colors.label, fontSize: 80, fontWeight: "200", lineHeight: 88, fontVariant: ["tabular-nums"] }}
              >
                {units.temp(weather.current.temperature)}
              </Text>
              <Text style={{ color: colors.label, fontSize: 20, fontWeight: "600" }}>{cur?.label}</Text>
              <Text style={{ color: colors.secondaryLabel, fontSize: 14 }}>
                {weather.current.feelsLike != null ? `Percepita ${units.temp(weather.current.feelsLike)} · ` : ""}
                Max {units.temp(weather.daily[0].max)} · Min {units.temp(weather.daily[0].min)}
              </Text>
            </View>

            {weather.rainSoon && !stale ? (
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <SymbolView
                  name={weather.rainSoon.state === "none" ? "cloud.sun" : "cloud.rain.fill"}
                  tintColor={weather.rainSoon.state === "none" ? colors.secondaryLabel : colors.tint}
                  size={22}
                  fallback={<Text style={{ fontSize: 20 }}>{weather.rainSoon.state === "none" ? "🌤️" : "🌧️"}</Text>}
                />
                <Text style={{ flex: 1, color: colors.label, fontSize: 15, fontWeight: "600" }}>
                  {rainSoonText(weather.rainSoon)}
                </Text>
              </Card>
            ) : null}

            <Text style={sectionTitle}>PROSSIME 24 ORE</Text>
            <HourlyCard hourly={weather.hourly} />

            <Pressable
              onPress={() => {
                if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
                void w.applySettings({ ...settings, detailsOpen: !settings.detailsOpen });
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: settings.detailsOpen }}
              accessibilityLabel={settings.detailsOpen ? "Nascondi i dettagli" : "Mostra i dettagli"}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={sectionTitle}>DETTAGLI</Text>
              <SymbolView
                name={settings.detailsOpen ? "chevron.up" : "chevron.down"}
                tintColor={colors.secondaryLabel}
                size={11}
                fallback={<Text style={{ color: colors.secondaryLabel as string, fontSize: 11 }}>{settings.detailsOpen ? "▲" : "▼"}</Text>}
              />
            </Pressable>
            {settings.detailsOpen ? <StatGrid items={details} /> : null}

            <Text style={sectionTitle}>PROSSIMI 7 GIORNI</Text>
            <DailyCard daily={weather.daily} hourlyAll={weather.hourlyAll} />

            <Text style={{ color: colors.secondaryLabel, fontSize: 12, textAlign: "center", marginTop: 8 }}>
              {updatedAt && !stale ? `Aggiornato alle ${units.time(new Date(updatedAt))} · ` : ""}
              Dati: {providerInfo(settings.provider).attribution}
            </Text>
          </>
        )}
      </ScrollView>
    </>
  );
}
