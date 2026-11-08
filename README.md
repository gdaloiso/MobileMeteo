# Meteo

App meteo per Android e iOS, scritta con Expo (SDK 58), React Native ed Expo Router.
Non richiede chiavi API: i dati arrivano da servizi gratuiti.

## Funzioni

- **Oggi:** temperatura, temperatura percepita, umidità, vento, pioggia, alba e tramonto.
- **Prossime 24 ore:** riga orizzontale con ora, icona, temperatura e probabilità di pioggia.
- **Prossimi 7 giorni:** toccando un giorno si apre il dettaglio ora per ora.
- **Città:** ricerca per nome, preferiti (con la stella) e "La mia posizione" via GPS.
- **Impostazioni:**
  - tema Automatico / Chiaro / Scuro
  - temperatura °C / °F, vento km/h, m/s o mph, precipitazioni mm o pollici
  - formato orario 24 o 12 ore
  - città di partenza: posizione attuale, ultima vista o città fissa
  - fonte dei dati: Open-Meteo o MET Norway
- **Dati salvati:** l'app mostra subito gli ultimi dati scaricati e li aggiorna in rete (cache di 10 minuti).

## Fonti dei dati

| Servizio | Uso | Note |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com) | Previsioni (predefinito) e ricerca città | Include alba, tramonto e temperatura percepita |
| [MET Norway](https://api.met.no) | Previsioni alternative | Richiede un contatto (email o sito) nelle impostazioni, che resta sul telefono e viene inviato solo a MET Norway |
| Servizio di geocodifica del telefono, poi [Nominatim](https://nominatim.openstreetmap.org) | Nome della città dalla posizione GPS | |

## Struttura del progetto

```
src/
  app/             Schermate (Expo Router): (today), (cities), (settings)
  components/      Componenti riusabili (card, liste, selettori)
  providers/       Stato globale: luogo, meteo, preferiti, impostazioni
  lib/             Servizi meteo, cache, storage, unità di misura
  theme/           Palette colori chiaro/scuro
assets/            Icone e splash
```

## Requisiti

- [Node.js](https://nodejs.org) LTS e npm
- Un telefono con **Expo Go** (App Store / Play Store) per provare l'app senza build
- Un account gratuito su [expo.dev](https://expo.dev) per generare le build con EAS

## Installazione

```bash
npm install
```

## Avviare l'app con Expo Go

```bash
npx expo start
```

Poi scansiona il QR code:

- **Android:** apri Expo Go e scegli "Scan QR code".
- **iPhone:** usa l'app Fotocamera e apri il link in Expo Go.

Telefono e computer devono essere sulla stessa rete Wi-Fi. Se non si connettono (rete aziendale o ospiti):

```bash
npx expo start --tunnel
```

Per svuotare la cache di Metro:

```bash
npx expo start --clear
```

## Controlli di qualità

```bash
npx tsc --noEmit    # typecheck
npx expo lint       # lint
```

## Build con EAS

Le build si fanno nel cloud di Expo: non servono Android Studio né Xcode.
La configurazione è in `eas.json`.

### Preparazione (solo la prima volta)

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

### Android: APK da installare sul telefono

```bash
npx eas-cli@latest build --platform android --profile preview
```

Alla domanda sul keystore rispondi di sì, così lo gestisce EAS. A fine build compare un link con QR code: aprilo dal telefono, scarica l'APK e installalo (Android chiede di consentire l'installazione da fonti sconosciute).

### Android: AAB per il Play Store

```bash
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest submit --platform android
```

### iOS

Serve un account Apple Developer a pagamento.

```bash
# Build per testare su iPhone registrati (distribuzione interna)
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview

# Build per App Store / TestFlight
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

### Windows, macOS e Linux

I comandi sono gli stessi su tutti i sistemi, perché la build gira sui server Expo.
Su Windows usa PowerShell, Prompt dei comandi o Git Bash.

## Identificativi dell'app

- Android: `it.giuseppe.meteo`
- iOS: `it.giuseppe.meteo`

## Note

- Le cartelle `ios/` e `android/` non sono nel repository: vengono generate da Expo (Continuous Native Generation). Per cambiare la configurazione nativa modifica `app.json`.
- Le dipendenze si aggiungono con `npx expo install <pacchetto>`, che sceglie la versione compatibile con l'SDK.
- Licenza: vedi `LICENSE`.
