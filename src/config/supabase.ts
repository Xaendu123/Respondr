/**
 * SUPABASE CLIENT CONFIGURATION
 * 
 * Configures and exports the Supabase client for use throughout the app.
 * Uses environment variables from app.config.js (via Constants) or process.env as fallback.
 * 
 * Region: EU Central 2 (eu-central-2)
 * The region is determined by your Supabase project settings. Ensure your project
 * URL points to a project hosted in EU Central 2.
 * 
 * Note: This client is untyped. To add type safety, generate types from your
 * Supabase instance using: `npx supabase gen types typescript --local > src/types/supabase.ts`
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// In EAS builds, environment variables are only available via Constants.expoConfig.extra
// process.env is NOT available at runtime in production builds
// Priority: Constants.expoConfig.extra (from app.config.js) > process.env (dev only)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                     (__DEV__ ? process.env.EXPO_PUBLIC_SUPABASE_URL : undefined);
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        (__DEV__ ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined);

// For Expo Go, allow missing env vars with a warning (they'll be undefined)
// This prevents the app from crashing during development
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase environment variables.
  URL: ${supabaseUrl ? 'SET' : 'MISSING'}
  Key: ${supabaseAnonKey ? 'SET' : 'MISSING'}
  Constants.expoConfig?.extra: ${JSON.stringify(Constants.expoConfig?.extra || {})}
  process.env.EXPO_PUBLIC_SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`;
  
  if (__DEV__) {
    console.warn('⚠️ Missing Supabase environment variables:', errorMsg);
  } else {
    // In production builds, log detailed error but don't crash immediately
    // This helps diagnose the issue in TestFlight
    console.error('❌ CRITICAL: Missing Supabase environment variables in production!', errorMsg);
    // Still throw to prevent app from running with invalid config
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in eas.json for production builds.'
    );
  }
}

/**
 * Supabase client instance with AsyncStorage for session persistence
 * Uses placeholder values if env vars are missing (for Expo Go development)
 * 
 * Configuration:
 * - flowType: 'pkce' - Uses PKCE flow for better security on mobile
 * - detectSessionInUrl: false - We handle URL detection manually for better control
 * - storage: AsyncStorage - Persists sessions in device storage
 * - global: { fetch } - Uses React Native's fetch for better compatibility
 */
// Custom fetch with timeout for better reliability
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // If it's a network error, provide more context
    if (error.name === 'AbortError') {
      throw new Error('Network request timeout. Please check your internet connection.');
    }
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('Network request failed. Please check your internet connection and try again.');
    }
    throw error;
  }
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // We handle this manually in _layout.tsx
      flowType: 'pkce', // Use PKCE flow for mobile security (recommended)
    },
    global: {
      // Use custom fetch with timeout for better network compatibility
      fetch: customFetch,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey || '',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// In production, test connection
if (!__DEV__) {
  // Test connection silently in background if we have config
  if (supabaseUrl && supabaseAnonKey) {
    supabase.auth.getSession().catch((error) => {
      console.error('Supabase connection test failed:', {
        error: error.message,
        url: supabaseUrl.substring(0, 40) + '...',
        timestamp: new Date().toISOString(),
      });
    });
  }
}

