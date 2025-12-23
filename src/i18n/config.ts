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
 * Default language: German (de)
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
  
  // Default to German, or detect from device
  const locales = Localization.getLocales();
  const deviceLanguage = locales?.[0]?.languageCode || 'de';
  return deviceLanguage === 'de' || deviceLanguage === 'en' ? deviceLanguage : 'de';
}

// Initialize i18n
const initI18n = async () => {
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
      fallbackLng: 'de',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

initI18n();

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

