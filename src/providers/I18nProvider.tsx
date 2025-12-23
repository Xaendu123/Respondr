/**
 * I18N PROVIDER
 * 
 * Wraps the app with i18n support.
 * This is mainly for consistency - i18next handles most of the work.
 * Additional i18n-related context can be added here if needed.
 */

import React from 'react';
import '../i18n/config'; // Initialize i18n

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // i18n is initialized via the config import
  // Additional i18n context can be added here if needed
  return <>{children}</>;
}

