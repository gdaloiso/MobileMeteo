import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Stack } from "expo-router/stack";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Card } from "@/components/card";
import { Chip } from "@/components/chip";
import { DailyCard } from "@/components/daily-card";
import { HourlyCard } from "@/components/hourly-card";
import { Stat } from "@/components/stat";
import { WeatherIcon } from "@/components/weather-icon";
import { round } from "@/lib/format";
import { providerInfo } from "@/lib/providers";
import { samePlace } from "@/lib/storage";
import { useUnits } from "@/lib/units";
import { describeCode } from "@/lib/weather";
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
              <WeatherIcon code={weather.current.code} isDay={weather.current.isDay} size={72} />
              <Text
                selectable
                style={{ color: colors.label, fontSize: 88, fontWeight: "200", lineHeight: 96, fontVariant: ["tabular-nums"] }}
              >
                {units.temp(weather.current.temperature)}
              </Text>
              <Text style={{ color: colors.label, fontSize: 20, fontWeight: "600" }}>{cur?.label}</Text>
              <Text style={{ color: colors.secondaryLabel, fontSize: 14 }}>
                {weather.current.feelsLike != null ? `Percepita ${units.temp(weather.current.feelsLike)} · ` : ""}
                Max {units.temp(weather.daily[0].max)} · Min {units.temp(weather.daily[0].min)}
              </Text>
            </View>

            <Card style={{ flexDirection: "row" }}>
              <Stat label="Umidità" value={`${round(weather.current.humidity)}%`} />
              <Stat label="Vento" value={units.wind(weather.current.windSpeed)} />
              <Stat label="Pioggia oggi" value={units.rainStat(weather.daily[0].precipProb, weather.daily[0].precipMm)} />
            </Card>

            {weather.sunrise && weather.sunset ? (
              <Card style={{ flexDirection: "row" }}>
                <Stat label="Alba" value={units.time(weather.sunrise)} />
                <Stat label="Tramonto" value={units.time(weather.sunset)} />
              </Card>
            ) : null}

            <Text style={sectionTitle}>PROSSIME 24 ORE</Text>
            <HourlyCard hourly={weather.hourly} />

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
