import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Card } from "@/components/card";
import { PlaceRow } from "@/components/place-row";
import { Place, searchPlaces } from "@/lib/weather";
import { useWeather } from "@/providers/weather-provider";
import { useColors } from "@/theme/colors";

export default function CitiesScreen() {
  const colors = useColors();
  const { favorites, isFavorite, toggleFavorite, choosePlace, goToMyLocation } = useWeather();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const searching = query.trim().length >= 2;

  // Ricerca con una piccola attesa, per non interrogare il servizio a ogni lettera
  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      setFailed(false);
      try {
        const found = await searchPlaces(query);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) {
          setResults([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searching]);

  const changeQuery = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setFailed(false);
      setBusy(false);
    }
  };

  const open = (p: Place) => {
    if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
    void choosePlace(p);
    router.navigate("/");
  };

  const openMyLocation = () => {
    if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
    void goToMyLocation();
    router.navigate("/");
  };

  const data = searching ? results : favorites;

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(p) => `${p.latitude},${p.longitude}`}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
              <SymbolView
                name="magnifyingglass"
                tintColor={colors.secondaryLabel}
                size={18}
                fallback={<Text style={{ fontSize: 16 }}>🔍</Text>}
              />
              <TextInput
                value={query}
                onChangeText={changeQuery}
                placeholder="Cerca una città"
                placeholderTextColor={colors.secondaryLabel}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                style={{ flex: 1, color: colors.label, fontSize: 17, paddingVertical: 10 }}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => changeQuery("")} hitSlop={8} accessibilityLabel="Cancella ricerca">
                  <Text style={{ color: colors.secondaryLabel as string, fontSize: 18 }}>✕</Text>
                </Pressable>
              ) : null}
            </Card>
            {searching ? null : (
              <>
              <Pressable onPress={openMyLocation}>
                <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <SymbolView
                    name="location.fill"
                    tintColor={colors.tint}
                    size={20}
                    fallback={<Text style={{ fontSize: 18 }}>📍</Text>}
                  />
                  <Text style={{ color: colors.label, fontSize: 17, fontWeight: "600" }}>La mia posizione</Text>
                </Card>
              </Pressable>
              {favorites.length > 0 ? (
                <Text style={{ color: colors.secondaryLabel, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, marginLeft: 4 }}>
                  PREFERITI
                </Text>
              ) : null}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PlaceRow
            place={item}
            favorite={isFavorite(item)}
            onPress={() => open(item)}
            onToggleFavorite={() => toggleFavorite(item)}
          />
        )}
        ListEmptyComponent={
          busy ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : searching ? (
            <Text style={{ color: colors.secondaryLabel, textAlign: "center", marginTop: 24 }}>
              {failed ? "Ricerca non riuscita. Controlla la connessione." : "Nessun risultato."}
            </Text>
          ) : (
            <Text style={{ color: colors.secondaryLabel, textAlign: "center", marginTop: 16, paddingHorizontal: 24 }}>
              Cerca una città e tocca la stella per aggiungerla ai preferiti.
            </Text>
          )
        }
      />
    </>
  );
}
