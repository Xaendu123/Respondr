/**
 * TRANSLATION HOOK
 * 
 * Re-exports useTranslation from react-i18next for convenience.
 * Additional translation utilities can be added here.
 */

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n/config';

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();
  
  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage: async (lang: string) => {
      await changeLanguage(lang);
    },
  };
}

