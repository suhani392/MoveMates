# Settings Implementation Guide

## Completed Features

### 1. Language Support (English & Hindi)
- ✅ Created `LanguageContext.tsx` with English and Hindi translations
- ✅ Updated `LanguageScreen.tsx` to show only English and Hindi options
- ✅ Language selection saves to AsyncStorage
- ✅ App-wide translation support via `useLanguage()` hook

### 2. Dark Mode Support
- ✅ Created `ThemeContext.tsx` with light and dark themes
- ✅ Theme toggle saves to AsyncStorage
- ✅ App-wide theme support via `useTheme()` hook

## Implementation Steps Required

### Step 1: Update App.tsx to include providers
```tsx
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Wrap your app with:
<ThemeProvider>
  <LanguageProvider>
    {/* Your existing app */}
  </LanguageProvider>
</ThemeProvider>
```

### Step 2: Update Preferences Screen
- Add dark mode toggle that calls `toggleTheme()`
- Add auto location toggle
- Add sound effects toggle
- Save all preferences to Firebase user document

### Step 3: Update Role Change Screen
- Check current user role
- If Wanderer → Walker: Send request to admin via Firebase
- Create `role_change_requests` collection in Firebase
- Admin receives notification
- On approval: Delete current account, require re-login with documents

### Step 4: Update Push/Email Notifications Screens
- Add toggles for different notification types
- Save preferences to Firebase user document
- Integrate with Firebase Cloud Messaging for push notifications
- Set up email notification service

### Step 5: Update Walk History Screen
- Query Firebase `walks` collection filtered by user ID
- Display walk details: date, walker/wanderer, duration, distance, status
- Add filters and search functionality

### Step 6: Apply Translations
Update all screens to use `t()` function from `useLanguage()`:
- WandererHomeScreen
- WalkerHomeScreen
- AdminDashboard
- SettingsScreen
- All sub-screens

### Step 7: Apply Theme
Update all screens to use `colors` from `useTheme()`:
- Replace hardcoded colors with theme colors
- Support both light and dark modes

## Firebase Collections Needed

### role_change_requests
```
{
  userId: string,
  currentRole: 'wanderer' | 'walker',
  requestedRole: 'walker' | 'wanderer',
  status: 'pending' | 'approved' | 'rejected',
  requestedAt: timestamp,
  processedAt: timestamp,
  processedBy: string (admin ID)
}
```

### walks (for history)
```
{
  id: string,
  walkerId: string,
  wandererId: string,
  pickupLocation: { latitude, longitude, address },
  destination: { latitude, longitude, address },
  startTime: timestamp,
  endTime: timestamp,
  duration: number (minutes),
  distance: number (km),
  status: 'completed' | 'cancelled' | 'in_progress',
  rating: number,
  feedback: string
}
```

### user preferences (add to users collection)
```
{
  preferences: {
    darkMode: boolean,
    autoLocation: boolean,
    soundEffects: boolean,
    notifications: {
      push: {
        walkRequests: boolean,
        messages: boolean,
        updates: boolean
      },
      email: {
        walkRequests: boolean,
        messages: boolean,
        updates: boolean
      }
    }
  }
}
```

## Next Steps
1. Add providers to App.tsx
2. Implement each screen with full functionality
3. Test language switching
4. Test dark mode
5. Test role change workflow
6. Test notification preferences
7. Test walk history display
