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

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

/**
 * Supabase client instance with AsyncStorage for session persistence
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

