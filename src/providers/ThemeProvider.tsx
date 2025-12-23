/**
 * THEME PROVIDER
 * 
 * Provides theme context to the entire application.
 * Handles theme switching, persistence, and system theme detection.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode, ThemeName, getTheme } from '../config/theme';

const THEME_STORAGE_KEY = '@respondr:theme';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme('light'));

  // Determine the actual theme based on mode
  useEffect(() => {
    let themeName: ThemeName;
    
    if (themeMode === 'system') {
      themeName = systemColorScheme === 'dark' ? 'dark' : 'light';
    } else {
      themeName = themeMode;
    }
    
    setCurrentTheme(getTheme(themeName));
  }, [themeMode, systemColorScheme]);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };
    
    loadTheme();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  const value: ThemeContextValue = {
    theme: currentTheme,
    themeMode,
    setThemeMode,
    isDark: currentTheme.colors.background === getTheme('dark').colors.background,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * Must be used within ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

