/**
 * APP PROVIDERS
 * 
 * Combines all providers into a single component.
 * This is the root provider that wraps the entire app.
 * 
 * Usage:
 * <AppProviders>
 *   <App />
 * </AppProviders>
 */

import React from 'react';
import { AuthProvider } from './AuthProvider';
import { BrandProvider } from './BrandProvider';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

interface AppProvidersProps {
  children: React.ReactNode;
  brandConfig?: Parameters<typeof BrandProvider>[0]['brandConfig'];
}

export function AppProviders({ children, brandConfig }: AppProvidersProps) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrandProvider brandConfig={brandConfig}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </BrandProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

