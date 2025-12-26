/**
 * INTERNATIONALIZATION (i18n) CONFIGURATION
 * 
 * This file sets up the i18n system using i18next.
 * 
 * How to add a new language:
 * 1. Create a new language file in src/i18n/locales/[locale].json
 * 2. Copy the structure from an existing language file (e.g., de.json)
 * 3. Translate all string values
 * 4. The locale will be automatically available
 * 5. No component code changes needed
 * 
 * Default language: English (en)
 * Device language detection: German if device is German, otherwise English
 * 
 * Usage in components:
 * import { useTranslation } from 'react-i18next';
 * const { t } = useTranslation();
 * <Text>{t('home.title')}</Text>
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';

const LANGUAGE_STORAGE_KEY = '@respondr:language';

// Get saved language preference or detect from device
async function getInitialLanguage(): Promise<string> {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn('Failed to load saved language preference:', error);
  }
  
  // Detect from device: German if device is German, otherwise default to English
  const locales = Localization.getLocales();
  const deviceLanguage = locales?.[0]?.languageCode || 'en';
  return deviceLanguage === 'de' ? 'de' : 'en';
}

// Initialize i18n (non-blocking - app will load even if this fails)
const initI18n = async () => {
  try {
    const initialLanguage = await getInitialLanguage();
    
    await i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v4',
        resources: {
          de: { translation: de },
          en: { translation: en },
        },
        lng: initialLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    // Initialize with fallback to prevent app crash
    i18n.use(initReactI18next).init({
      compatibilityJSON: 'v4',
      resources: {
        de: { translation: de },
        en: { translation: en },
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  }
};

// Initialize asynchronously (don't block app loading)
initI18n().catch((error) => {
  console.error('i18n initialization error:', error);
});

// Helper to change language and persist preference
export async function changeLanguage(language: string): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to save language preference:', error);
  }
}

export default i18n;

