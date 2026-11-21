# Meteo

App meteo per Android e iOS, scritta con Expo (SDK 58), React Native ed Expo Router.
Non richiede chiavi API: i dati arrivano da servizi gratuiti.

## Funzioni

- **Oggi:** temperatura, temperatura percepita, umidità, vento (con direzione), pioggia, alba, tramonto e durata del giorno.
- **Indice UV:** valore attuale con livello (Basso, Moderato, Alto, Molto alto, Estremo).
- **Qualità dell'aria:** indice europeo (EAQI) con giudizio da Buona a Pessima. Se il dato non è disponibile, il resto dell'app funziona comunque.
- **Fase lunare:** fase e percentuale di luna illuminata, calcolate sul telefono senza servizi esterni.
- **Avviso pioggia/neve:** indica se sta piovendo o nevicando e quando smette, oppure tra quanto inizia, in base alle ore delle prossime 24.
- **Prossime 24 ore:** grafico a curva della temperatura con, per ogni ora, icona, temperatura e probabilità di pioggia. Scorre in orizzontale.
- **Prossimi 7 giorni:** toccando un giorno si apre il dettaglio ora per ora.
- **Città:** ricerca per nome, preferiti (con la stella) e "La mia posizione" via GPS.
- **Impostazioni:**
  - tema Automatico / Chiaro / Scuro
  - temperatura °C / °F, vento km/h, m/s o mph, precipitazioni mm o pollici
  - formato orario 24 o 12 ore
  - città di partenza: posizione attuale, ultima vista o città fissa
  - fonte dei dati: Open-Meteo o MET Norway
- **Dati salvati:** l'app mostra subito gli ultimi dati scaricati e li aggiorna in rete (cache di 10 minuti).

## Download

Scarica l'ultima versione per **Android** dalla pagina [Releases](https://github.com/gdaloiso/MobileMeteo/releases/latest): nella sezione *Assets* trovi il file `.apk`.

Per installarlo:

1. Apri il file `.apk` dal telefono.
2. Se Android lo chiede, consenti l'installazione da questa fonte (*Installa app sconosciute*).
3. Se Google Play Protect segnala l'app come non verificata, scegli *Installa comunque*: l'app non è pubblicata sul Play Store.

Gli aggiornamenti non sono automatici: per passare a una nuova versione scarica il nuovo `.apk` e installalo sopra quello esistente. I dati e le impostazioni restano.

Per iPhone non c'è un pacchetto scaricabile: si può provare con Expo Go (vedi sotto).

## Fonti dei dati

| Servizio | Uso | Note |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com) | Previsioni (predefinito) e ricerca città | Include alba, tramonto, temperatura percepita e indice UV |
| [MET Norway](https://api.met.no) | Previsioni alternative | Richiede un contatto (email o sito) nelle impostazioni, che resta sul telefono e viene inviato solo a MET Norway |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Qualità dell'aria (EAQI, PM2.5) | Usata con entrambe le fonti meteo |
| Servizio di geocodifica del telefono, poi [Nominatim](https://nominatim.openstreetmap.org) | Nome della città dalla posizione GPS | |

## Struttura del progetto

```
src/
  app/             Schermate (Expo Router): (today), (cities), (settings)
  components/      Componenti riusabili (card, griglia statistiche, grafico orario, liste, selettori)
  providers/       Stato globale: luogo, meteo, preferiti, impostazioni
  lib/             Servizi meteo, cache, storage, unità di misura, fase lunare, grafici
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

- Android: `it.gdalo.meteo`
- iOS: `it.gdalo.meteo`

## Note

- Le cartelle `ios/` e `android/` non sono nel repository: vengono generate da Expo (Continuous Native Generation). Per cambiare la configurazione nativa modifica `app.json`.
- Le dipendenze si aggiungono con `npx expo install <pacchetto>`, che sceglie la versione compatibile con l'SDK.
- Licenza: vedi `LICENSE`.
