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

// Light theme - Modern, clean design matching RESQ aesthetics
const lightThemeColors: ThemeColors = {
  primary: '#C62828', // Deep Red - primary brand color
  primaryDark: '#8E0000', // Darker red
  primaryLight: '#FF6659', // Lighter red
  onPrimary: '#FFFFFF',
  
  // Gradient colors for headers and accents
  gradientStart: '#C62828', // Deep Red
  gradientEnd: '#FF6F00', // Orange
  
  background: '#F5F5F5', // Light gray background
  backgroundSecondary: '#EEEEEE', // Slightly darker gray
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Glassmorphism properties
  glassBackground: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white
  glassBorder: 'rgba(255, 255, 255, 0.3)', // Subtle border
  
  textPrimary: '#212121', // Almost black - strong contrast
  textSecondary: '#757575', // Gray - readable secondary
  textTertiary: '#BDBDBD', // Light gray
  textInverse: '#FFFFFF',
  
  border: '#E0E0E0', // Light gray border
  divider: '#F5F5F5', // Very light divider
  
  error: '#C62828', // Red - operations/emergencies (matching primary)
  errorBackground: '#FFEBEE',
  success: '#2E7D32', // Green
  successBackground: '#E8F5E9',
  warning: '#F57C00', // Orange - exercises/drills
  warningBackground: '#FFF3E0',
  info: '#FBC02D', // Yellow - training/education
  infoBackground: '#FFFDE7',
  
  pressed: 'rgba(198, 40, 40, 0.08)',
  disabled: '#BDBDBD',
  disabledBackground: '#F5F5F5',
};

// Dark theme - Modern, clean design matching RESQ aesthetics
const darkThemeColors: ThemeColors = {
  primary: '#EF5350', // Lighter red for dark mode
  primaryDark: '#C62828', // Deep red
  primaryLight: '#FF8A80', // Very light red
  onPrimary: '#FFFFFF',
  
  // Gradient colors for headers and accents
  gradientStart: '#C62828', // Deep Red
  gradientEnd: '#FF6F00', // Orange
  
  background: '#121212', // Dark background
  backgroundSecondary: '#1E1E1E', // Slightly lighter dark
  surface: '#1E1E1E', // Card surface
  surfaceElevated: '#2C2C2C', // Elevated surface
  
  // Glassmorphism properties
  glassBackground: 'rgba(30, 30, 30, 0.7)', // Semi-transparent dark
  glassBorder: 'rgba(255, 255, 255, 0.1)', // Subtle light border
  
  textPrimary: '#FFFFFF', // White - high contrast
  textSecondary: '#B0B0B0', // Light gray - clear secondary
  textTertiary: '#707070', // Medium gray
  textInverse: '#121212',
  
  border: '#333333', // Dark border
  divider: '#2C2C2C', // Dark divider
  
  error: '#EF5350', // Light red - operations/emergencies
  errorBackground: '#3E1F1F',
  success: '#66BB6A', // Light green
  successBackground: '#1F3E1F',
  warning: '#FFA726', // Light orange
  warningBackground: '#3E2F1F',
  info: '#FFD54F', // Light yellow - training/education
  infoBackground: '#3E3A1F',
  
  pressed: 'rgba(239, 83, 80, 0.12)',
  disabled: '#707070',
  disabledBackground: '#2C2C2C',
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

