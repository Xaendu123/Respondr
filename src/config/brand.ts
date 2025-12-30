/**
 * BRAND CONFIGURATION
 * 
 * This file contains all brand-specific configuration that can be changed to white-label the app.
 * Changing values here should allow complete rebranding without touching component code.
 * 
 * How to rebrand:
 * 1. Update appName, appTagline with your brand name
 * 2. Replace logo assets in assets/brand/ directory
 * 3. Update brandColors to match your brand palette
 * 4. Optionally update brandFonts if using custom fonts
 * 5. Update metadata as needed
 * 
 * All components should reference these values via useBrand() hook, never hardcode brand values.
 */

import { ImageSourcePropType } from 'react-native';

// Import brand assets
const wordmarkDark = require('../../assets/brand/logos/wordmark-dark.png');
const wordmarkLight = require('../../assets/brand/logos/wordmark-light.png');
const appIcon = require('../../assets/brand/icons/icon.png');
const splashIcon = require('../../assets/brand/splash/splash-icon.png');

export interface BrandConfig {
  appName: string;
  appTagline: string;
  logo: ImageSourcePropType | null;
  logoLight: ImageSourcePropType | null;
  logoDark: ImageSourcePropType | null;
  appIcon: ImageSourcePropType | null;
  splashImage: ImageSourcePropType | null;
  brandColors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
  };
  brandFonts: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  metadata: {
    supportEmail: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    websiteUrl: string;
  };
}

// Default brand configuration for Respondr
export const defaultBrandConfig: BrandConfig = {
  appName: 'Respondr',
  appTagline: 'Für die Helden im Einsatz',
  // Brand logo assets
  logo: wordmarkDark, // Default logo (dark version)
  logoLight: wordmarkLight, // Light version for dark backgrounds
  logoDark: wordmarkDark, // Dark version for light backgrounds
  appIcon: appIcon, // App icon
  splashImage: splashIcon, // Splash screen icon
  brandColors: {
    // Professional blue-teal scheme that works for all rescue organizations
    primary: '#0891B2', // Cyan 600 - professional, trustworthy
    primaryDark: '#0E7490', // Cyan 700 - deeper variant
    secondary: '#06B6D4', // Cyan 500 - lighter accent
    accent: '#22D3EE', // Cyan 400 - bright highlights
  },
  brandFonts: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  metadata: {
    supportEmail: 'info@respondr.ch',
    privacyPolicyUrl: 'https://respondr.ch/privacy',
    termsOfServiceUrl: 'https://respondr.ch/terms',
    websiteUrl: 'https://respondr.ch',
  },
};

/**
 * Brand configuration provider value type
 */
export type BrandConfigValue = BrandConfig;

