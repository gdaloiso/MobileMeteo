import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { ReactNode, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Card } from "@/components/card";
import { FixedPlacePicker } from "@/components/fixed-place-picker";
import { Segmented } from "@/components/segmented";
import {
  PROVIDERS,
  PrecipUnit,
  ProviderId,
  StartMode,
  TempUnit,
  ThemeMode,
  TimeFormat,
  WindUnit,
  isValidContact,
  providerInfo,
} from "@/lib/providers";
import { useWeather } from "@/providers/weather-provider";
import { useColors } from "@/theme/colors";

function Section({ title, footer, children }: { title: string; footer?: ReactNode; children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.secondaryLabel, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, marginLeft: 4 }}>
        {title.toUpperCase()}
      </Text>
      {children}
      {footer ? <View style={{ marginHorizontal: 4 }}>{footer}</View> : null}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const footerText = { color: colors.secondaryLabel, fontSize: 13 };
  const { settings, applySettings } = useWeather();
  const [provider, setProvider] = useState<ProviderId>(settings.provider);
  const [contact, setContact] = useState(settings.metContact);

  const info = providerInfo(provider);

  // Fonte e contatto si applicano da soli, dopo una breve pausa mentre si scrive.
  useEffect(() => {
    const trimmed = contact.trim();
    if (provider === settings.provider && trimmed === settings.metContact) return;
    const timer = setTimeout(() => void applySettings({ ...settings, provider, metContact: trimmed }), 700);
    return () => clearTimeout(timer);
  }, [provider, contact, settings, applySettings]);

  const choose = (id: ProviderId) => {
    if (id === provider) return;
    if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync();
    setProvider(id);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 40 }}
    >
      <Section title="Aspetto">
        <Card>
          <Segmented<ThemeMode>
            value={settings.theme}
            onChange={(theme) => void applySettings({ ...settings, theme })}
            options={[
              { value: "auto", label: "Automatico" },
              { value: "light", label: "Chiaro" },
              { value: "dark", label: "Scuro" },
            ]}
          />
        </Card>
      </Section>

      <Section title="Unità e formato">
        <Card style={{ gap: 12 }}>
          <Text style={{ color: colors.label, fontSize: 15, fontWeight: "600" }}>Temperatura</Text>
          <Segmented<TempUnit>
            value={settings.tempUnit}
            onChange={(tempUnit) => void applySettings({ ...settings, tempUnit })}
            options={[
              { value: "c", label: "°C" },
              { value: "f", label: "°F" },
            ]}
          />
          <Text style={{ color: colors.label, fontSize: 15, fontWeight: "600", marginTop: 4 }}>Vento</Text>
          <Segmented<WindUnit>
            value={settings.windUnit}
            onChange={(windUnit) => void applySettings({ ...settings, windUnit })}
            options={[
              { value: "kmh", label: "km/h" },
              { value: "ms", label: "m/s" },
              { value: "mph", label: "mph" },
            ]}
          />
          <Text style={{ color: colors.label, fontSize: 15, fontWeight: "600", marginTop: 4 }}>Precipitazioni</Text>
          <Segmented<PrecipUnit>
            value={settings.precipUnit}
            onChange={(precipUnit) => void applySettings({ ...settings, precipUnit })}
            options={[
              { value: "mm", label: "mm" },
              { value: "in", label: "pollici" },
            ]}
          />
          <Text style={{ color: colors.label, fontSize: 15, fontWeight: "600", marginTop: 4 }}>Formato orario</Text>
          <Segmented<TimeFormat>
            value={settings.timeFormat}
            onChange={(timeFormat) => void applySettings({ ...settings, timeFormat })}
            options={[
              { value: "24", label: "24 ore" },
              { value: "12", label: "12 ore" },
            ]}
          />
        </Card>
      </Section>

      <Section
        title="All'avvio"
        footer={
          <Text style={footerText}>
            {settings.startMode === "gps"
              ? "L'app si apre sulla città in cui ti trovi."
              : settings.startMode === "last"
                ? "L'app si apre sull'ultima città che hai guardato."
                : "L'app si apre sempre sulla città scelta qui sotto."}
          </Text>
        }
      >
        <Card>
          <Segmented<StartMode>
            value={settings.startMode}
            onChange={(startMode) => void applySettings({ ...settings, startMode })}
            options={[
              { value: "gps", label: "La mia posizione" },
              { value: "last", label: "Ultima vista" },
              { value: "fixed", label: "Città fissa" },
            ]}
          />
        </Card>
        {settings.startMode === "fixed" ? (
          <FixedPlacePicker
            place={settings.fixedPlace}
            onPick={(fixedPlace) => void applySettings({ ...settings, fixedPlace })}
          />
        ) : null}
      </Section>

      <Section title="Fonte dei dati meteo" footer={<Text style={footerText}>{info.description}</Text>}>
        <View style={{ gap: 8 }}>
          {PROVIDERS.map((p) => {
            const active = p.id === provider;
            return (
              <Pressable
                key={p.id}
                onPress={() => choose(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Card
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderWidth: 2,
                    borderColor: active ? colors.tint : "transparent",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.label, fontSize: 17, fontWeight: "600" }}>{p.name}</Text>
                    <Text style={{ color: colors.secondaryLabel, fontSize: 13, marginTop: 2 }}>{p.attribution}</Text>
                  </View>
                  {active ? (
                    <SymbolView
                      name="checkmark.circle.fill"
                      tintColor={colors.tint}
                      size={24}
                      fallback={<Text style={{ color: colors.tint as string, fontSize: 22 }}>✓</Text>}
                    />
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {info.needsContact ? (
        <Section
          title="Contatto per MET Norway"
          footer={
            <Text style={[footerText, !isValidContact(contact) && { color: colors.danger }]}>
              {isValidContact(contact)
                ? "MET Norway chiede di identificare chi usa il servizio. Il contatto resta sul telefono e viene inviato solo a loro."
                : "Inserisci un'email o l'indirizzo di un sito: senza, MET Norway rifiuta le richieste."}
            </Text>
          }
        >
          <Card style={{ paddingVertical: 4 }}>
            <TextInput
              value={contact}
              onChangeText={setContact}
              placeholder="nome@dominio.it"
              placeholderTextColor={colors.secondaryLabel}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ color: colors.label, fontSize: 17, paddingVertical: 10 }}
            />
          </Card>
        </Section>
      ) : null}
    </ScrollView>
  );
}
