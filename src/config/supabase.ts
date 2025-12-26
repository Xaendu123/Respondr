/**
 * SUPABASE CLIENT CONFIGURATION
 * 
 * Configures and exports the Supabase client for use throughout the app.
 * Uses environment variables from app.config.js (via Constants) or process.env as fallback.
 * 
 * Note: This client is untyped. To add type safety, generate types from your
 * Supabase instance using: `npx supabase gen types typescript --local > src/types/supabase.ts`
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Try to get from app.config.js (via Constants) first, fallback to process.env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// For Expo Go, allow missing env vars with a warning (they'll be undefined)
// This prevents the app from crashing during development
if (!supabaseUrl || !supabaseAnonKey) {
  if (__DEV__) {
    console.warn(
      '⚠️ Missing Supabase environment variables. ' +
      'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
    );
  } else {
    // In production builds, throw an error
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
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
 */
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
  }
);

