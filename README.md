# MoveMates

MoveMates is a companion walking service app that connects people who need walking assistance with trained walkers. Whether you need help getting to a destination, want company for a garden walk, or are looking for wellness walks, MoveMates makes it easy to find the right companion.

## Tech Stack

Built with React Native and Expo for cross-platform mobile development. We're using TypeScript throughout the codebase, Firebase for authentication and real-time data, and React Navigation for screen transitions.

**Core Technologies:**
- React Native with Expo
- TypeScript
- Firebase (Auth, Firestore, Realtime Database)
- React Navigation

## Project Structure

The codebase is organized into logical folders:
- **screens/** - All app screens (login, home, booking, etc.)
- **components/** - Reusable UI components and navigation setup
- **contexts/** - React contexts for auth, theme, and language
- **services/** - API calls and Firebase interactions
- **firebaseConfig.ts** - Firebase initialization and config

## Getting Started

### What You'll Need

Before diving in, make sure you have these installed:

- **Node.js** (LTS version recommended) - Check by running `node -v`
- **Expo CLI** - Install globally with `npm install -g expo`
- **Expo Go app** on your phone (available on App Store and Play Store)
- **Android Studio** (for Android development) or **Xcode** (for iOS, macOS only)

### Installation

Clone the repo and install dependencies:

```bash
git clone <your-repo-url>
cd MoveMates
npm install
```

### Running the App

Start the development server:

```bash
npm start
```

This opens Expo Dev Tools in your browser. From here you can:
- Scan the QR code with Expo Go on your phone
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Press `w` to open in web browser

**First time running?** The initial bundle might take a minute. After that, changes will hot reload instantly.

**Can't connect?** If you're on a restricted network, switch to Tunnel mode in the Expo Dev Tools.

## Firebase Configuration

The app uses Firebase for user authentication and data storage. The configuration is already set up in `firebaseConfig.ts`, but here's what you should know:

**Current Setup:**
- Firebase Authentication (with AsyncStorage for session persistence)
- Firestore for user data and walk requests
- Realtime Database for live updates

**Using Your Own Firebase Project:**

If you want to connect to a different Firebase project:

1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" and copy the config
3. Replace the config object in `firebaseConfig.ts`

**Security Note:** The Firebase config keys are safe to commit (they're meant for client apps), but make sure to set up proper Firestore security rules in your Firebase console to protect user data.

## Available Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator (macOS only)
npm run web        # Run in browser
```

## Common Issues

**App won't load on phone?**
- Make sure your phone and computer are on the same WiFi
- Try switching to Tunnel mode in Expo Dev Tools
- Restart the Expo Go app

**Metro bundler stuck?**
- Clear the cache: `expo start -c`

**Android device not showing up?**
- Enable USB debugging in Developer Options
- Run `adb devices` to check connection

**Changes not reflecting?**
- Shake your device and press "Reload"
- Or press `r` in the terminal

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repo and create a new branch
2. Make your changes
3. Test on both iOS and Android if possible
4. Submit a pull request

Please make sure your code follows the existing style and includes appropriate comments.

## License

This project is licensed under the terms specified in `package.json`.
