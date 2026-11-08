import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card } from "@/components/card";
import { Place, placeSubtitle, searchPlaces } from "@/lib/weather";
import { useColors } from "@/theme/colors";

// Scelta della città di partenza: mostra quella scelta e permette di cercarne un'altra.
export function FixedPlacePicker({ place, onPick }: { place: Place | null; onPick: (p: Place) => void }) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const searching = query.trim().length >= 2;

  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      setFailed(false);
      try {
        const found = await searchPlaces(query);
        if (!cancelled) setResults(found.slice(0, 5));
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

  const change = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setFailed(false);
      setBusy(false);
    }
  };

  const pick = (p: Place) => {
    onPick(p);
    change("");
  };

  return (
    <Card style={{ gap: 4 }}>
      <View style={{ paddingVertical: 4 }}>
        <Text style={{ color: colors.secondaryLabel, fontSize: 13 }}>Città scelta</Text>
        <Text style={{ color: colors.label, fontSize: 17, fontWeight: "600", marginTop: 2 }}>
          {place ? place.name : "Nessuna: userò l'ultima città vista"}
        </Text>
        {place && placeSubtitle(place) ? (
          <Text style={{ color: colors.secondaryLabel, fontSize: 13 }}>{placeSubtitle(place)}</Text>
        ) : null}
      </View>

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 4 }} />

      <TextInput
        value={query}
        onChangeText={change}
        placeholder="Cerca la città di partenza"
        placeholderTextColor={colors.secondaryLabel}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="search"
        style={{ color: colors.label, fontSize: 17, paddingVertical: 10 }}
      />

      {busy ? <ActivityIndicator style={{ marginVertical: 8 }} /> : null}
      {searching && !busy && failed ? (
        <Text style={{ color: colors.secondaryLabel, paddingVertical: 8 }}>Ricerca non riuscita. Controlla la connessione.</Text>
      ) : null}
      {searching && !busy && !failed && results.length === 0 ? (
        <Text style={{ color: colors.secondaryLabel, paddingVertical: 8 }}>Nessun risultato.</Text>
      ) : null}
      {searching
        ? results.map((r) => (
            <Pressable
              key={`${r.latitude},${r.longitude}`}
              onPress={() => pick(r)}
              style={{ paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }}
            >
              <Text style={{ color: colors.label, fontSize: 16 }}>{r.name}</Text>
              {placeSubtitle(r) ? (
                <Text style={{ color: colors.secondaryLabel, fontSize: 13 }}>{placeSubtitle(r)}</Text>
              ) : null}
            </Pressable>
          ))
        : null}
    </Card>
  );
}
