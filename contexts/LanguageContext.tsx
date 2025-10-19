import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'save': 'Save Changes',
    'cancel': 'Cancel',
    'back': 'Back',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    
    // Navigation
    'home': 'Home',
    'notifications': 'Notifications',
    'profile': 'Profile',
    'settings': 'Settings',
    'about': 'About',
    'contactUs': 'Contact Us',
    'helpPolicy': 'Help & Policy',
    'logout': 'Logout',
    
    // Settings
    'general': 'General',
    'language': 'Language',
    'roleChange': 'Role Change',
    'preferences': 'Preferences',
    'pushNotifications': 'Push Notifications',
    'emailNotifications': 'Email Notifications',
    'privacy': 'Privacy',
    'locationSharing': 'Location Sharing',
    'contactsSharing': 'Contacts Sharing',
    'dataUsage': 'Data Usage',
    'history': 'History',
    'walkHistory': 'Walk History',
    
    // Language Screen
    'selectLanguage': 'Select Language',
    'english': 'English',
    'hindi': 'Hindi',
    'languageUpdated': 'Language updated successfully',
    
    // Role Change
    'currentRole': 'Current Role',
    'requestRoleChange': 'Request Role Change',
    'changeToWalker': 'Change to Walker',
    'changeToWanderer': 'Change to Wanderer',
    'roleChangeRequest': 'Role Change Request',
    'roleChangeDesc': 'Changing from Wanderer to Walker requires admin approval. Your current account will be converted and you will need to provide documents for verification.',
    'requestSent': 'Request sent to admin',
    'alreadyWalker': 'You are already a Walker',
    'alreadyWanderer': 'You are already a Wanderer',
    
    // Preferences
    'darkMode': 'Dark Mode',
    'darkModeDesc': 'Switch to dark theme',
    'autoLocation': 'Auto Location',
    'autoLocationDesc': 'Automatically detect your location',
    'soundEffects': 'Sound Effects',
    'soundEffectsDesc': 'Play sounds for notifications',
    
    // Notifications
    'walkRequests': 'Walk Requests',
    'walkRequestsDesc': 'Notifications for new walk requests',
    'messages': 'Messages',
    'messagesDesc': 'Notifications for new messages',
    'updates': 'Updates',
    'updatesDesc': 'App updates and announcements',
    'notificationSettings': 'Notification Settings',
    'settingsSaved': 'Settings saved successfully',
    
    // Walk History
    'noWalks': 'No walks yet',
    'noWalksDesc': 'Your walk history will appear here',
    'walker': 'Walker',
    'wanderer': 'Wanderer',
    'date': 'Date',
    'duration': 'Duration',
    'distance': 'Distance',
    'status': 'Status',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'inProgress': 'In Progress',
    
    // Wanderer Home
    'availableWalkers': 'Available Walkers',
    'findWalker': 'Find a Walker',
    'pickup': 'Pickup Location',
    'destination': 'Destination',
    'requestWalk': 'Request Walk',
    'enterPickup': 'Enter pickup location',
    'enterDestination': 'Enter destination',
    
    // Walker Home
    'availableForWalk': 'Available for a walk?',
    'youreReady': "You're ready to accept walks",
    'youreUnavailable': "You're currently unavailable",
    'walkRequestsHome': 'Walk Requests',
    'noRequests': 'No walk requests at the moment',
    'accept': 'Accept',
    'reject': 'Reject',
  },
  hi: {
    // Common
    'save': 'परिवर्तन सहेजें',
    'cancel': 'रद्द करें',
    'back': 'वापस',
    'loading': 'लोड हो रहा है...',
    'error': 'त्रुटि',
    'success': 'सफलता',
    
    // Navigation
    'home': 'होम',
    'notifications': 'सूचनाएं',
    'profile': 'प्रोफ़ाइल',
    'settings': 'सेटिंग्स',
    'about': 'के बारे में',
    'contactUs': 'संपर्क करें',
    'helpPolicy': 'सहायता और नीति',
    'logout': 'लॉगआउट',
    
    // Settings
    'general': 'सामान्य',
    'language': 'भाषा',
    'roleChange': 'भूमिका परिवर्तन',
    'preferences': 'प्राथमिकताएं',
    'pushNotifications': 'पुश सूचनाएं',
    'emailNotifications': 'ईमेल सूचनाएं',
    'privacy': 'गोपनीयता',
    'locationSharing': 'स्थान साझाकरण',
    'contactsSharing': 'संपर्क साझाकरण',
    'dataUsage': 'डेटा उपयोग',
    'history': 'इतिहास',
    'walkHistory': 'वॉक इतिहास',
    
    // Language Screen
    'selectLanguage': 'भाषा चुनें',
    'english': 'अंग्रेज़ी',
    'hindi': 'हिंदी',
    'languageUpdated': 'भाषा सफलतापूर्वक अपडेट की गई',
    
    // Role Change
    'currentRole': 'वर्तमान भूमिका',
    'requestRoleChange': 'भूमिका परिवर्तन का अनुरोध करें',
    'changeToWalker': 'वॉकर में बदलें',
    'changeToWanderer': 'वांडरर में बदलें',
    'roleChangeRequest': 'भूमिका परिवर्तन अनुरोध',
    'roleChangeDesc': 'वांडरर से वॉकर में बदलने के लिए व्यवस्थापक की स्वीकृति आवश्यक है। आपका वर्तमान खाता परिवर्तित हो जाएगा और आपको सत्यापन के लिए दस्तावेज़ प्रदान करने होंगे।',
    'requestSent': 'व्यवस्थापक को अनुरोध भेजा गया',
    'alreadyWalker': 'आप पहले से ही एक वॉकर हैं',
    'alreadyWanderer': 'आप पहले से ही एक वांडरर हैं',
    
    // Preferences
    'darkMode': 'डार्क मोड',
    'darkModeDesc': 'डार्क थीम पर स्विच करें',
    'autoLocation': 'स्वचालित स्थान',
    'autoLocationDesc': 'अपने स्थान का स्वचालित रूप से पता लगाएं',
    'soundEffects': 'ध्वनि प्रभाव',
    'soundEffectsDesc': 'सूचनाओं के लिए ध्वनि बजाएं',
    
    // Notifications
    'walkRequests': 'वॉक अनुरोध',
    'walkRequestsDesc': 'नए वॉक अनुरोधों के लिए सूचनाएं',
    'messages': 'संदेश',
    'messagesDesc': 'नए संदेशों के लिए सूचनाएं',
    'updates': 'अपडेट',
    'updatesDesc': 'ऐप अपडेट और घोषणाएं',
    'notificationSettings': 'सूचना सेटिंग्स',
    'settingsSaved': 'सेटिंग्स सफलतापूर्वक सहेजी गईं',
    
    // Walk History
    'noWalks': 'अभी तक कोई वॉक नहीं',
    'noWalksDesc': 'आपका वॉक इतिहास यहां दिखाई देगा',
    'walker': 'वॉकर',
    'wanderer': 'वांडरर',
    'date': 'तारीख',
    'duration': 'अवधि',
    'distance': 'दूरी',
    'status': 'स्थिति',
    'completed': 'पूर्ण',
    'cancelled': 'रद्द',
    'inProgress': 'प्रगति में',
    
    // Wanderer Home
    'availableWalkers': 'उपलब्ध वॉकर',
    'findWalker': 'वॉकर खोजें',
    'pickup': 'पिकअप स्थान',
    'destination': 'गंतव्य',
    'requestWalk': 'वॉक का अनुरोध करें',
    'enterPickup': 'पिकअप स्थान दर्ज करें',
    'enterDestination': 'गंतव्य दर्ज करें',
    
    // Walker Home
    'availableForWalk': 'वॉक के लिए उपलब्ध?',
    'youreReady': 'आप वॉक स्वीकार करने के लिए तैयार हैं',
    'youreUnavailable': 'आप वर्तमान में अनुपलब्ध हैं',
    'walkRequestsHome': 'वॉक अनुरोध',
    'noRequests': 'इस समय कोई वॉक अनुरोध नहीं',
    'accept': 'स्वीकार करें',
    'reject': 'अस्वीकार करें',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage === 'en' || savedLanguage === 'hi') {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
