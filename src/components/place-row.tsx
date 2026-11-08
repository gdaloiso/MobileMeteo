import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import { Card } from "@/components/card";
import { Place, placeSubtitle } from "@/lib/weather";
import { useColors } from "@/theme/colors";

type Props = {
  place: Place;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function PlaceRow({ place, favorite, onPress, onToggleFavorite }: Props) {
  const colors = useColors();
  const subtitle = placeSubtitle(place);
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 0, paddingRight: 4 }}>
      <Pressable onPress={onPress} style={{ flex: 1, paddingVertical: 12, gap: 2 }}>
        <Text style={{ color: colors.label, fontSize: 17, fontWeight: "600" }}>{place.name}</Text>
        {subtitle ? <Text style={{ color: colors.secondaryLabel, fontSize: 14 }}>{subtitle}</Text> : null}
      </Pressable>
      <Pressable
        onPress={() => {
          if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
          onToggleFavorite();
        }}
        hitSlop={8}
        accessibilityLabel={favorite ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <SymbolView
          name={favorite ? "star.fill" : "star"}
          tintColor={favorite ? colors.star : colors.secondaryLabel}
          size={22}
          fallback={
            <View>
              <Text style={{ fontSize: 22, color: favorite ? "#f5b301" : "#8e8e93" }}>{favorite ? "★" : "☆"}</Text>
            </View>
          }
        />
      </Pressable>
    </Card>
  );
}
