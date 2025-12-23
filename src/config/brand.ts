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
  // Note: In production, these should reference actual asset files
  // For now, using null - components should handle null gracefully
  logo: null,
  logoLight: null,
  logoDark: null,
  appIcon: null,
  splashImage: null,
  brandColors: {
    // Professional blue-teal scheme that works for all rescue organizations
    primary: '#0891B2', // Cyan 600 - professional, trustworthy
    primaryDark: '#0E7490', // Cyan 700 - deeper variant
    secondary: '#06B6D4', // Cyan 500 - lighter accent
    accent: '#22D3EE', // Cyan 400 - bright highlights
  },
  brandFonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
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

