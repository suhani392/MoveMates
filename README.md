## MoveMates

A React Native app built with Expo and Firebase. This README walks you through setup from zero to running on real devices and emulators, plus how to connect multiple devices at once for team demos and testing.

### What’s inside
- **Framework**: Expo (managed)
- **Runtime**: React Native
- **Language**: TypeScript
- **Navigation**: `@react-navigation/*`
- **State/Auth/Data**: Firebase Auth, Firestore, Realtime Database

### Repo tour
- `App.tsx` and `index.ts`: App entry
- `app.json`: Expo app config (icons, splash, platform settings)
- `firebaseConfig.ts`: Firebase initialization (Auth persistence, Firestore, Realtime DB)
- `components/`, `screens/`, `contexts/`, `services/`: UI, flows, context, and API helpers

---

## Prerequisites
Install these first:

- Node.js LTS (and npm). Check with: `node -v` and `npm -v`
- Expo CLI: `npm i -g expo`
- Android Studio (Android SDK + emulator) or Xcode (iOS simulator, macOS only)
- Expo Go app on your phone (Android/iOS) for quick device testing

Optional but handy:
- A physical Android device with USB debugging enabled (Developer Options)
- A physical iPhone (requires Apple setup; for development via Expo Go you don’t need a dev cert)

---

## Install and run
1) Install dependencies

```bash
npm install
```

2) Start the dev server (Metro via Expo)

```bash
npm run start
# or run a specific target
npm run android
npm run ios
npm run web
```

3) Open on a device
- Scan the QR in the terminal/Expo Dev Tools with the Expo Go app
- Or click “Run on Android device/emulator” / “Run on iOS simulator” in Dev Tools

Notes:
- First run can take a minute to bundle. Subsequent edits hot reload.
- If your network blocks LAN, switch the connection mode to “Tunnel” in Dev Tools.

---

## Firebase setup
Firebase is already initialized in `firebaseConfig.ts`:

```startLine:endLine:firebaseConfig.ts
// See file for full configuration and initialization
```

What you should know:
- The project currently uses Auth (with persistent session via AsyncStorage), Firestore, and Realtime Database.
- The config values are public web keys by design for Firebase Web/React Native. Still, restrict API key usage in the Firebase console (App Check, domain restrictions if using web, database security rules, etc.).
- To point to a different Firebase project, replace the config in `firebaseConfig.ts` with your project’s values from Firebase Console > Project settings > General > Your apps.

Security tips (strongly recommended):
- Set Firestore and Realtime Database Rules appropriately for your data model.
- Enable App Check if feasible.
- Lock down Storage rules if you add Storage later.

---

## Connecting a single device

You have three common options; pick the one that fits your setup.

### A) Expo Go over LAN (fastest)
1) Ensure your computer and phone are on the same Wi‑Fi network
2) Start the project: `npm run start`
3) In Dev Tools, set connection to “LAN”
4) Open Expo Go on your phone and scan the QR

If the bundle never loads, your network may block peer traffic. Switch to Tunnel.

### B) Expo Go over Tunnel (works anywhere)
1) Start the project: `npm run start`
2) In Dev Tools, set connection to “Tunnel”
3) Scan the QR with Expo Go

This routes through Expo’s servers. It’s slower than LAN but reliable across networks.

### C) Emulator/Simulator (no phone needed)
- Android: Open Android Studio > Virtual Device, then `npm run android`
- iOS (macOS): `npm run ios` to boot the simulator and install the app

---

## Connecting many devices at once (team demos/testing)
Expo supports multiple clients simultaneously. You can have several phones and emulators connected and receiving hot reloads.

Recommended patterns:

### Option 1: LAN for everyone on the same Wi‑Fi
1) Everyone joins the same Wi‑Fi
2) Start the project: `npm run start`
3) Set connection to “LAN”
4) Each tester opens Expo Go and scans the same QR

Pros: Fast reloads. Cons: Requires a permissive network; corporate Wi‑Fi may block it.

### Option 2: Tunnel when people are remote or on different networks
1) Start the project: `npm run start`
2) Set connection to “Tunnel`
3) Share the QR or the “exp+...” URL with your team
4) Each person opens the link in Expo Go

Pros: Works anywhere. Cons: Slower bundles and reloads.

### Option 3: Mix and match (USB + LAN)
- Android devices on-site: connect via USB and run `npm run android` to install directly; they’ll still reload from Metro
- Others remote: connect via Tunnel

Tips for smooth multi-device sessions:
- Keep the Metro terminal visible to spot errors quickly
- If a device desyncs, kill the app on that device and reopen from Expo Go
- Avoid large image assets in dev; they slow down reloads across all clients

---

## Useful scripts

```bash
npm run start    # Expo Dev Tools + Metro bundler
npm run android  # Launch Android emulator or install on connected device
npm run ios      # Launch iOS simulator (macOS only)
npm run web      # Run in the browser
```

---

## Troubleshooting
- Metro stuck “Loading…”: Stop it and run `expo start -c` (clear cache)
- Device can’t load on LAN: Switch Dev Tools to “Tunnel”
- Android device not detected: Confirm USB debugging is on; run `adb devices`
- iOS simulator won’t boot: Open Xcode > Settings > Platforms and install a simulator
- Red screen error after install: Fully close Expo Go on the device, reopen, and re-scan the QR

---

## Contributing
Simple flow:
1) Create a feature branch
2) Make changes
3) Test on at least one physical device (Expo Go) and one emulator/simulator
4) Open a PR

---

## License
See `package.json` for license info.


