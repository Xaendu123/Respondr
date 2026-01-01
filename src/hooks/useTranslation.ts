/**
 * TRANSLATION HOOK
 * 
 * Re-exports useTranslation from react-i18next for convenience.
 * Additional translation utilities can be added here.
 */

import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18n, { changeLanguage } from '../i18n/config';

export function useTranslation() {
  const { t, i18n: i18nInstance } = useI18nTranslation();
  
  return {
    t,
    currentLanguage: i18nInstance.language,
    changeLanguage: async (lang: string) => {
      await changeLanguage(lang);
    },
  };
}

/**
 * Safe translation hook with fallback
 * Returns a fallback translation function if i18n is not available or not initialized
 * Always calls the hook (React requirement) but validates the return values
 */
export function useTranslationSafe() {
  // Always call the hook (React requirement)
  let translationResult: ReturnType<typeof useI18nTranslation>;
  
  try {
    translationResult = useI18nTranslation();
  } catch (error) {
    // If hook throws, create a fallback result
    translationResult = {
      t: (key: string) => key,
      i18n: i18n as any,
    };
  }
  
  const { t: originalT, i18n: i18nInstance } = translationResult;
  
  // Check if we have a valid translation function
  const hasValidT = originalT && typeof originalT === 'function';
  const hasValidI18n = i18nInstance && 
                       (i18nInstance.isInitialized !== false) && 
                       typeof i18nInstance.language === 'string';
  
  // Create a safe translation function
  const safeT = (key: string, options?: any): string => {
    // Try to use the hook's translation function first
    if (hasValidT) {
      try {
        const result = originalT(key, options);
        // i18next returns the key if translation not found, which is fine
        return result || key;
      } catch (err) {
        // Translation function threw an error
        console.warn('Translation function error:', err);
      }
    }
    
    // Fallback: try to use i18n directly
    if (i18n && i18n.isInitialized && typeof i18n.t === 'function') {
      try {
        const result = i18n.t(key, options);
        return result || key;
      } catch (err) {
        // i18n.t also failed
      }
    }
    
    // Ultimate fallback: return the key
    return key;
  };
  
  return {
    t: safeT,
    currentLanguage: (hasValidI18n ? i18nInstance.language : i18n?.language) || 'en',
    changeLanguage: async (lang: string) => {
      try {
        await changeLanguage(lang);
      } catch (err) {
        console.warn('Failed to change language:', err);
      }
    },
  };
}

