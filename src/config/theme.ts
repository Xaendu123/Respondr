/**
 * THEME SYSTEM
 * 
 * This file defines the theme system with semantic tokens.
 * Themes use semantic naming (primary, background, textPrimary) instead of color names (red, blue).
 * 
 * How to add a new theme:
 * 1. Create a new theme object following the ThemeColors interface
 * 2. Use semantic token names (primary, background, surface, etc.)
 * 3. Add the theme to the themes object with a unique key
 * 4. Update ThemeName type if using TypeScript unions
 * 
 * How to change colors:
 * 1. Update the color values in the theme objects below
 * 2. Do NOT change semantic token names (they define usage, not color)
 * 3. Ensure contrast ratios meet accessibility standards
 * 
 * Theme switching:
 * - Themes can be switched at runtime via ThemeProvider
 * - User preference is persisted via AsyncStorage
 * - System theme can be detected and used as default
 */

import { tokens } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary colors (brand colors)
  primary: string;
  primaryDark: string;
  primaryLight: string;
  onPrimary: string;
  
  // Gradient colors
  gradientStart: string;
  gradientEnd: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  
  // Glassmorphism
  glassBackground: string;
  glassBorder: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border and divider
  border: string;
  divider: string;
  
  // Semantic colors
  error: string;
  errorBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  info: string;
  infoBackground: string;
  
  // Interactive states
  pressed: string;
  disabled: string;
  disabledBackground: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: typeof tokens.spacing;
  typography: typeof tokens.typography;
  borderRadius: typeof tokens.borderRadius;
  shadows: typeof tokens.shadows;
  animation: typeof tokens.animation;
}

// Light theme - Soft slate backgrounds with Respondr Orange branding
const lightThemeColors: ThemeColors = {
  primary: '#f97316', // Respondr Orange (orange-500) - Main brand color
  primaryDark: '#ea580c', // Deep Orange (orange-600) - Gradient start
  primaryLight: '#fb923c', // Light Orange (orange-400) - Highlights
  onPrimary: '#FFFFFF',
  
  // Gradient colors for headers and accents - Orange to Red gradient
  gradientStart: '#f97316', // Respondr Orange (orange-500) - Vibrant orange start
  gradientEnd: '#dc2626', // Signal Red (red-600) - Deep red end
  
  // Background colors - White background, grey cards for elevation
  background: '#ffffff', // Main Background - White
  backgroundSecondary: '#f1f5f9', // Subtle Gray (slate-100) - Footer/Elements/Cards
  surface: '#f1f5f9', // Surface (slate-100) - Cards/Nav matching filter chips
  surfaceElevated: '#f1f5f9', // Surface (slate-100) - Elevated cards
  
  // Glassmorphism properties
  glassBackground: 'rgba(241, 245, 249, 0.8)', // Semi-transparent grey (slate-100) for glassmorphism
  glassBorder: 'rgba(226, 232, 240, 0.5)', // Subtle slate-200 border
  
  // Text colors - High contrast but softer than pure black
  textPrimary: '#0f172a', // Headings (slate-900) - Almost Black
  textSecondary: '#475569', // Body Text (slate-600) - Dark Gray
  textTertiary: '#64748b', // Meta Info (slate-500) - Medium Gray
  textInverse: '#ffffff', // White for inverse text
  
  // Border and divider - Soft slate borders
  border: '#e2e8f0', // Borders (slate-200) - Dividers
  divider: '#e2e8f0', // Borders (slate-200) - Dividers
  
  // Semantic colors - using brand colors
  error: '#dc2626', // Signal Red (red-600) - operations/emergencies
  errorBackground: '#fff7ed', // Soft Orange (orange-50) - Subtle error background
  success: '#2E7D32', // Green
  successBackground: '#E8F5E9',
  warning: '#f97316', // Respondr Orange - exercises/drills
  warningBackground: '#fff7ed', // Soft Orange (orange-50) - Subtle warning background
  info: '#fde047', // Spark Yellow (yellow-300) - training/education/flame tip
  infoBackground: '#fff7ed', // Soft Orange (orange-50) - Subtle info background
  
  pressed: 'rgba(249, 115, 22, 0.08)', // Respondr Orange with opacity
  disabled: '#64748b', // Meta Info (slate-500) - Medium Gray
  disabledBackground: '#f1f5f9', // Subtle Gray (slate-100)
};

// Dark theme - Slate-based color scheme with Respondr Orange branding
const darkThemeColors: ThemeColors = {
  primary: '#f97316', // Respondr Orange (orange-500) - Main brand color
  primaryDark: '#ea580c', // Deep Orange (orange-600) - Gradient start
  primaryLight: '#fb923c', // Light Orange (orange-400) - Highlights
  onPrimary: '#FFFFFF',
  
  // Gradient colors for headers and accents - Orange to Red gradient (matching promotional banner)
  gradientStart: '#f97316', // Respondr Orange (orange-500) - Vibrant orange start
  gradientEnd: '#ef4444', // Signal Red (red-500) - Deep red end
  
  // Background colors - Slate-based
  background: '#020617', // Deepest Night (slate-950) - Main background
  backgroundSecondary: '#0f172a', // Dark Surface (slate-900) - Secondary background
  surface: '#0f172a', // Dark Surface (slate-900) - Cards/Nav
  surfaceElevated: '#1e293b', // Lighter Surface (slate-800) - Elevated cards
  
  // Glassmorphism properties - using slate colors
  glassBackground: 'rgba(15, 23, 42, 0.7)', // Semi-transparent slate-900
  glassBorder: 'rgba(51, 65, 85, 0.3)', // Subtle slate-700 border
  
  // Text colors - Slate-based
  textPrimary: '#f8fafc', // Headlines (slate-50) - Fast Weiß
  textSecondary: '#94a3b8', // Body Text (slate-400) - Lesbares Grau
  textTertiary: '#64748b', // Subtle Text (slate-500) - Details
  textInverse: '#020617', // Inverse text (darkest background)
  
  // Border and divider - Slate-based
  border: '#1e293b', // Lighter Surface (slate-800) - Borders/Hovers
  divider: '#334155', // UI Elements (slate-700) - Dividers/Inputs
  
  // Semantic colors - using Respondr brand colors with slate backgrounds
  error: '#ef4444', // Signal Red (red-500) - operations/emergencies
  errorBackground: 'rgba(239, 68, 68, 0.1)', // Subtle error background
  success: '#66BB6A', // Light green
  successBackground: 'rgba(102, 187, 106, 0.1)', // Subtle success background
  warning: '#f97316', // Respondr Orange - exercises/drills
  warningBackground: 'rgba(249, 115, 22, 0.1)', // Subtle warning background
  info: '#fde047', // Spark Yellow (yellow-300) - training/education/flame tip
  infoBackground: 'rgba(253, 224, 71, 0.1)', // Subtle info background
  
  pressed: 'rgba(249, 115, 22, 0.12)', // Respondr Orange with opacity
  disabled: '#64748b', // Subtle Text (slate-500)
  disabledBackground: '#1e293b', // Lighter Surface (slate-800)
};

/**
 * Create a complete theme object
 */
function createTheme(colors: ThemeColors): Theme {
  return {
    colors,
    spacing: tokens.spacing,
    typography: tokens.typography,
    borderRadius: tokens.borderRadius,
    shadows: tokens.shadows,
    animation: tokens.animation,
  };
}

// Available themes
export const themes = {
  light: createTheme(lightThemeColors),
  dark: createTheme(darkThemeColors),
} as const;

export type ThemeName = keyof typeof themes;

/**
 * Get theme by name
 */
export function getTheme(themeName: ThemeName): Theme {
  return themes[themeName];
}

/**
 * Get system theme (light or dark based on device preference)
 * This is a placeholder - in production, use expo-system-ui or similar
 */
export function getSystemTheme(): ThemeName {
  // In production, detect system preference
  // For now, defaulting to light
  return 'light';
}

