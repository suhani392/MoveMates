# MoveMates - Your Walking Companion App

*Connecting Walkers and Wanderers for Safe and Enjoyable Walks*

## Quick Start for Judges

1. **Prerequisites**
   - Node.js v16+
   - npm 
   - Expo Go app (for physical device) 

2. **Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/suhani392/MoveMates.git
   
   # Navigate to project directory
   cd MoveMates
   
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your Firebase credentials
   
   # Start the development server
   npx expo start --tunnel
   (or) npm run
   (or) npm start
   ```

3. **Admin Account Credentials**
   - Email: movematesofficial@gmail.com
   - Password: Admin@07
   For Wanderer and Walker you can create account and sign in with email and password


## About MoveMates

MoveMates is a revolutionary companion walking service app that connects people who need walking assistance (Wanderers) with trained and trusted walking companions (Walkers). Whether you need help getting to a destination, want company for a garden walk, or are looking for wellness walks, MoveMates makes it easy to find the right companion for your needs.

## Key Features of MoveMates App

### 1. Multi-User System
- Three distinct user types with separate dashboards:
  - **Walker**: Verified walking companions who provide walking assistance
  - **Wanderer**: Users seeking walking assistance
  - **Admin**: Platform administrator with full control

### 2. User Onboarding & Registration
- **For Walkers**:
  - Detailed profile creation with personal information
  - Government ID and address verification
  - Mandatory qualification test (QUIZ)
  - Admin approval required before activation
  - "Waiting for approval" screen during verification
  - Age verification and background checks

- **For Wanderers**:
  - Simple signup process with email/password
  - Profile customization options
  - Immediate access to book walks

### 3. Walk Booking System
Five specialized walk types:
1. **Need a Helping Hand** - For daily assistance like going to market, grocery shopping, etc.
2. **Garden Walk Companion** - Leisurely outdoor walks in society park or garden
3. **Travel Companion** - Pickup to destination walking assistance
4. **Area Exploration** - Discovering new places
5. **Local Discovery Guide** - Finding best local spots or restaurants, etc.

### 4. Advanced Walk Customization & Scheduling
When booking a walk, Wanderers can specify:
- Date and time selection
- Walking speed preference
- Preferred language
- Purpose of the walk
- Walk type (Solo/Pet)
- Pickup location with map integration
- Optional drop point selection
- Current location detection

### 5. Walker Selection & Matching
- Browse available Walkers with detailed profiles
- View Walker ratings and reviews
- Send walk requests to preferred Walkers
- Real-time request status updates
- Notification system for request acceptance/updates

### 6. Real-time Walk Experience
- Live GPS tracking during walks
- Interactive map showing route and progress
- Real-time ETA and distance covered
- In-app chat and additional call features
- Safety features including live location sharing

### 7. Payment System
- QR Scanning or Cash Payment methods
- Payment will be recieved by MoveMates
- Walkers will be paid monthly according to their earnings
  
**Fare Calculation:**
```plaintext
Base Fare: ₹50
+ Time Charge: ₹5/minute × duration
+ Distance Charge: ₹8/km × distance
= Subtotal

Platform Commission: 25% of subtotal
Tip: Optional (₹10, ₹20, ₹50, or custom)

Total to Pay = Subtotal + Tip
Walker Earnings = Subtotal - Commission + Tip
```

**Example for ₹50 payment:**
- Base Fare: ₹50
- Time Charge: ₹5 × 0 min = ₹0
- Distance Charge: ₹8 × 0 km = ₹0
- Subtotal: ₹50
- Commission: ₹50 × 25% = ₹12.50
- Tip: ₹0
- **Total to Pay:** ₹50
- **Walker Earnings:** ₹37.50

### 8. Admin Dashboard
- **User Management**
  - View all users (Walkers and Wanderers)
  - Approve/Reject Walker applications
  - Remove users with reason tracking
  - View and restore banned users

- **Analytics & Reporting**
  - User activity graphs
  - Platform usage statistics
  - Financial reports
  - Audit logs of all admin actions

- **Payment Tracking**
  - View all transactions
  - Download payment history
  - Monitor Walker earnings
  - Track platform commission

### 9. User Settings & Customization
- Profile management and picture upload
- Notification settings
- Help & Support access
- Privacy Policy and Terms of Service
- Contact Us and About features

## Tech Stack

- **Frontend:** React Native with Expo
- **Backend:** Firebase (Auth, Firestore, Realtime Database)
- **State Management:** React Context API
- **Navigation:** React Navigation
- **Maps & Location:** React Native Maps, Expo Location
- **UI Components:** React Native Paper
- **Type Safety:** TypeScript

## Project Structure

```plaintext
MoveMates/
├── assets/            # Images, fonts, and other static files
├── components/        # Reusable UI components
├── constants/         # App constants and theme
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── navigation/        # Navigation configuration
├── screens/           # App screens
│   ├── auth/          # Authentication screens
│   ├── walker/        # Walker-specific screens
│   ├── wanderer/      # Wanderer-specific screens
│   └── admin/         # Admin screens
├── services/          # API and service layer
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── App.tsx            # Main application component
```

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm 
- Expo CLI (install with `npm install -g expo-cli`)
- Expo Go app (for physical device)

### Installation

1. **Clone the repository**
   ```bash
   # Clone the repository
   git clone https://github.com/suhani392/MoveMates.git
   
   # Navigate to project directory
   cd MoveMates
   ```

2. **Install dependencies**
   ```bash
   # Install all required dependencies
   npm install
   
   # Install Expo CLI globally (if not already installed)
   npm install -g expo-cli
   ```

3. **Start the development server**
   ```bash
   # Start the Expo development server
   npx expo start --tunnel
   ```
   
   After running the above command:
   - The Metro bundler will start and provide a QR code
   - **iOS**: Scan the QR code with your device's camera
   - **Android**: Scan the QR code with the Expo Go app
   - The app will automatically load on your device

## Configuration

### Firebase Configuration
The app uses Firebase for user authentication and data storage. The configuration is already set up in firebaseConfig.ts.

**Using Your Own Firebase Project:**
1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" and copy the config
3. Replace the config object in firebaseConfig.ts

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate test coverage report
npm test -- --coverage
```

## Troubleshooting

### Common Issues

### Common Issues

<details>
<summary><b>1. Android device not showing up?</b></summary>

```bash
# Check if device is detected
adb devices

# If not detected, try restarting ADB server
adb kill-server && adb start-server

# Enable USB debugging if not already enabled
# 1. Go to Settings > About Phone
# 2. Tap 'Build Number' 7 times to enable Developer Options
# 3. Go to Developer Options and enable 'USB Debugging'
```
</details>

<details>
<summary><b>2. Changes not reflecting?</b></summary>

```bash
# Try these in order:

# 1. Reload the app on your device:
#    - Shake device → Press "Reload"
#    - OR press 'r' in the terminal

# 2. Clear Metro bundler cache
npx expo start -c

# 3. Clear watchman watches
watchman watch-del-all
```
</details>

<details>
<summary><b>3. Firebase connection issues?</b></summary>

1. Check your Firebase configuration in `.env`:
   ```env
   # Example .env file
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ```

2. In Firebase Console, ensure these services are enabled:
   - Authentication
   - Firestore Database
   - Realtime Database
   - Storage

3. Check Firebase project settings for any restrictions
</details>


## License

This project is licensed under the terms specified in `package.json`.

## Privacy & Security

- End-to-end encryption for all communications
- Secure payment processing
- Regular security audits
- Data protection compliance
