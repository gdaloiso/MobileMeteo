import { StyleSheet, View } from "react-native";
import { Card } from "@/components/card";
import { Stat } from "@/components/stat";
import { useColors } from "@/theme/colors";

export type StatItem = { key: string; label: string; value: string; sub?: string };

// Dettagli raccolti in un'unica card a griglia di 3 colonne, per non allungare la pagina.
export function StatGrid({ items }: { items: StatItem[] }) {
  const colors = useColors();
  const rows: StatItem[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));

  return (
    <Card style={{ paddingVertical: 4 }}>
      {rows.map((row, r) => (
        <View
          key={r}
          style={{
            flexDirection: "row",
            // una riga incompleta resta centrata, ogni voce ha comunque la larghezza di una colonna
            justifyContent: "center",
            paddingVertical: 12,
            borderTopWidth: r > 0 ? StyleSheet.hairlineWidth : 0,
            borderTopColor: colors.separator,
          }}
        >
          {row.map((it) => (
            <View key={it.key} style={{ width: `${100 / 3}%` }}>
              <Stat label={it.label} value={it.value} sub={it.sub} />
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}
