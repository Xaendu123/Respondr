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
// Ensure we always have strings (not null/undefined) to prevent .trim() errors
// Note: app.config.js sets these to null when missing, so we need to handle null explicitly
const rawSupabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                     (__DEV__ ? process.env.EXPO_PUBLIC_SUPABASE_URL : undefined);
const rawSupabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        (__DEV__ ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined);

// Convert to strings, handling null/undefined cases
const supabaseUrl = (rawSupabaseUrl && typeof rawSupabaseUrl === 'string') ? rawSupabaseUrl : '';
const supabaseAnonKey = (rawSupabaseAnonKey && typeof rawSupabaseAnonKey === 'string') ? rawSupabaseAnonKey : '';

// For Expo Go, allow missing env vars with a warning (they'll be empty strings)
// This prevents the app from crashing during development
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
  // Helper to safely get string preview
  const safeStringPreview = (value: any, maxLength: number = 20): string => {
    if (!value) return 'null/undefined';
    if (typeof value !== 'string') return `[${typeof value}]`;
    return value.substring(0, maxLength) + '...';
  };
  
  const errorMsg = `Missing Supabase environment variables.
  URL: ${supabaseUrl ? 'SET (' + safeStringPreview(supabaseUrl, 30) + ')' : 'MISSING'}
  Key: ${supabaseAnonKey ? 'SET (' + safeStringPreview(supabaseAnonKey, 20) + ')' : 'MISSING'}
  Raw URL type: ${typeof rawSupabaseUrl}, value: ${safeStringPreview(rawSupabaseUrl, 30)}
  Raw Key type: ${typeof rawSupabaseAnonKey}, value: ${safeStringPreview(rawSupabaseAnonKey, 20)}
  Constants.expoConfig?.extra: ${JSON.stringify(Constants.expoConfig?.extra || {})}
  process.env.EXPO_PUBLIC_SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}
  __DEV__: ${__DEV__}`;
  
  if (__DEV__) {
    console.warn('⚠️ Missing Supabase environment variables:', errorMsg);
    console.warn('💡 Tip: For local development, create a .env file or set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your shell');
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

// Ensure we always pass valid strings to createClient (Supabase library calls .trim() on these)
// These are defined here so they're available to customFetch
const finalSupabaseUrl = (supabaseUrl && supabaseUrl.trim()) || 'https://placeholder.supabase.co';
const finalSupabaseAnonKey = (supabaseAnonKey && supabaseAnonKey.trim()) || 'placeholder-key';

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
    
    // Log error details for debugging (only in dev)
    if (__DEV__) {
      console.debug('Custom fetch error:', {
        name: error?.name,
        message: error?.message,
        type: typeof error,
        error: error,
        url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : 'unknown',
      });
    }
    
    // Handle different error types
    // Check for AbortError (timeout)
    if (error?.name === 'AbortError' || error?.code === 'ECONNABORTED') {
      throw new Error('Network request timeout. Please check your internet connection.');
    }
    
    // Check for network errors
    const errorMessage = error?.message || String(error || '');
    const errorString = errorMessage.toLowerCase();
    
    if (errorString.includes('network request failed') || 
        errorString.includes('failed to fetch') ||
        errorString.includes('networkerror') ||
        errorString.includes('err_network') ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ECONNREFUSED') {
      
      // Check if we're using placeholder values
      if (finalSupabaseUrl === 'https://placeholder.supabase.co' || finalSupabaseAnonKey === 'placeholder-key') {
        throw new Error('Supabase configuration is missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.');
      }
      
      throw new Error('Network request failed. Please check your internet connection and try again.');
    }
    
    // Re-throw original error if we can't categorize it
    throw error;
  }
};

export const supabase = createClient(
  finalSupabaseUrl,
  finalSupabaseAnonKey,
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
        'apikey': finalSupabaseAnonKey,
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
  // Test connection silently in background if we have valid config (not placeholders)
  if (finalSupabaseUrl && finalSupabaseAnonKey && 
      finalSupabaseUrl !== 'https://placeholder.supabase.co' && 
      finalSupabaseAnonKey !== 'placeholder-key') {
    supabase.auth.getSession().catch((error) => {
      console.error('Supabase connection test failed:', {
        error: error.message,
        url: finalSupabaseUrl.substring(0, 40) + '...',
        timestamp: new Date().toISOString(),
      });
    });
  }
}

