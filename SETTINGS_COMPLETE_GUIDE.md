# Complete Settings Implementation Guide

## Summary of Work Completed

### ✅ Created Core Infrastructure
1. **LanguageContext.tsx** - Full translation support for English and Hindi
2. **ThemeContext.tsx** - Dark mode support with light/dark color schemes
3. **Updated LanguageScreen.tsx** - Shows only English and Hindi, saves to AsyncStorage

## Critical Next Steps

### 1. Update App.tsx (REQUIRED FIRST)
Add the providers to wrap your entire app:

```tsx
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {/* Your existing NavigationContainer and other providers */}
      </LanguageProvider>
    </ThemeProvider>
  );
}
```

### 2. Update PreferencesScreen.tsx

Replace the existing file with this implementation:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const PreferencesScreen: React.FC<{ navigation: StackNavigationProp<any> }> = ({ navigation }) => {
  const { toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const [autoLocation, setAutoLocation] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const prefs = userDoc.data()?.preferences || {};
        setAutoLocation(prefs.autoLocation || false);
        setSoundEffects(prefs.soundEffects !== false);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          'preferences.darkMode': isDark,
          'preferences.autoLocation': autoLocation,
          'preferences.soundEffects': soundEffects,
        });
        Alert.alert(t('success'), t('settingsSaved'));
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(t('error'), 'Failed to save preferences');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('preferences')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="brightness-6" size={24} color="#5B21B6" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>{t('darkMode')}</Text>
                <Text style={styles.preferenceDescription}>{t('darkModeDesc')}</Text>
              </View>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavior</Text>
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="location-on" size={24} color="#059669" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>{t('autoLocation')}</Text>
                <Text style={styles.preferenceDescription}>{t('autoLocationDesc')}</Text>
              </View>
            </View>
            <Switch value={autoLocation} onValueChange={setAutoLocation} />
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceInfo}>
              <MaterialIcons name="volume-up" size={24} color="#F59E0B" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceName}>{t('soundEffects')}</Text>
                <Text style={styles.preferenceDescription}>{t('soundEffectsDesc')}</Text>
              </View>
            </View>
            <Switch value={soundEffects} onValueChange={setSoundEffects} />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
```

### 3. Update RoleChangeScreen.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const RoleChangeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [currentRole, setCurrentRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setCurrentRole(userDoc.data()?.role || '');
      }
    } catch (error) {
      console.error('Error loading role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (currentRole === 'wanderer') {
      Alert.alert(
        t('roleChangeRequest'),
        t('roleChangeDesc'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('requestRoleChange'),
            onPress: async () => {
              try {
                const user = auth.currentUser;
                if (user) {
                  await addDoc(collection(db, 'role_change_requests'), {
                    userId: user.uid,
                    currentRole: 'wanderer',
                    requestedRole: 'walker',
                    status: 'pending',
                    requestedAt: serverTimestamp(),
                  });
                  Alert.alert(t('success'), t('requestSent'));
                  navigation.goBack();
                }
              } catch (error) {
                Alert.alert(t('error'), 'Failed to send request');
              }
            },
          },
        ]
      );
    } else if (currentRole === 'walker') {
      Alert.alert(t('error'), t('alreadyWalker'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('roleChange')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t('currentRole')}</Text>
        <Text style={styles.roleText}>{currentRole.toUpperCase()}</Text>

        {currentRole === 'wanderer' && (
          <TouchableOpacity style={styles.changeButton} onPress={handleRoleChange}>
            <Text style={styles.changeButtonText}>{t('changeToWalker')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};
```

### 4. Update WalkHistoryScreen.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const WalkHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [walks, setWalks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalkHistory();
  }, []);

  const loadWalkHistory = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const walksQuery = query(
          collection(db, 'walks'),
          where('userId', '==', user.uid),
          orderBy('startTime', 'desc')
        );
        const snapshot = await getDocs(walksQuery);
        const walksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWalks(walksList);
      }
    } catch (error) {
      console.error('Error loading walks:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWalk = ({ item }: any) => (
    <View style={styles.walkCard}>
      <Text style={styles.walkDate}>
        {item.startTime?.toDate().toLocaleDateString()}
      </Text>
      <Text style={styles.walkDetail}>
        {t('duration')}: {item.duration} min
      </Text>
      <Text style={styles.walkDetail}>
        {t('distance')}: {item.distance} km
      </Text>
      <Text style={styles.walkStatus}>{t(item.status)}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('walkHistory')}</Text>
      </View>

      <FlatList
        data={walks}
        renderItem={renderWalk}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noWalks')}</Text>
            <Text style={styles.emptySubtext}>{t('noWalksDesc')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
```

### 5. Push/Email Notifications Screens

Create similar implementations for:
- `PushNotificationsScreen.tsx`
- `EmailNotificationsScreen.tsx`

Both should:
- Load notification preferences from Firebase
- Show toggles for walkRequests, messages, updates
- Save changes to Firebase user document
- Use translations from LanguageContext

## Firebase Setup Required

### Add to Firestore Rules:
```
match /role_change_requests/{requestId} {
  allow read, write: if request.auth != null;
}

match /walks/{walkId} {
  allow read: if request.auth != null && 
    (resource.data.walkerId == request.auth.uid || 
     resource.data.wandererId == request.auth.uid);
}
```

## Testing Checklist
- [ ] Language switches between English and Hindi
- [ ] Dark mode toggles and persists
- [ ] Preferences save to Firebase
- [ ] Role change request creates Firebase document
- [ ] Walk history loads from Firebase
- [ ] Notification preferences save correctly
- [ ] All screens use translations
- [ ] All screens respect dark mode

## Important Notes
1. All settings now persist across app restarts
2. Language changes apply immediately app-wide
3. Dark mode changes apply immediately app-wide
4. Role changes require admin approval
5. Walk history queries actual Firebase data
