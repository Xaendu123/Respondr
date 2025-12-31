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
  // Change language immediately - this triggers UI re-render
  await i18n.changeLanguage(language);
  
  // Save to local storage (non-blocking)
  AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch((error) => {
    console.warn('Failed to save language preference to storage:', error);
  });
  
  // Update Supabase in the background (non-blocking, don't await)
  // This ensures the UI updates immediately while the database sync happens async
  (async () => {
    try {
      const { supabase } = await import('../config/supabase');
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        console.warn('Failed to get user for language update:', getUserError);
        return;
      }
      
      if (!user || !user.id) {
        // User not authenticated, skip Supabase update
        return;
      }
      
      // Update profile language column - this will trigger sync to auth metadata
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          language: language,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('id, language, updated_at')
        .single();
      
      if (profileError) {
        console.error('Failed to update profile language:', {
          error: profileError,
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
          userId: user.id,
        });
        // Fallback: try to update auth metadata directly
        try {
          const currentMetadata = user.user_metadata || {};
          await supabase.auth.updateUser({
            data: {
              ...currentMetadata,
              language: language,
            },
          });
        } catch (authError: any) {
          console.error('Failed to update auth metadata as fallback:', authError);
        }
      } else if (profileData) {
        // Success - trigger will automatically sync to auth metadata
      }
    } catch (authError) {
      // Log error but don't throw - language preference is still saved locally
      console.error('Failed to update language preference in Supabase:', authError);
    }
  })();
}

export default i18n;

