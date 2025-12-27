/**
 * EXPO APP CONFIGURATION
 * 
 * Dynamic configuration file that loads environment variables.
 * This file extends app.json and allows for environment-specific configuration.
 */

const withLocalizedPermissions = require('./plugins/withLocalizedPermissions');
const withLocalizedNativePermissions = require('./plugins/withLocalizedNativePermissions');

module.exports = ({ config }) => {
  // Load environment variables
  // In EAS builds, these come from eas.json env section
  // CRITICAL: These MUST be passed to extra for runtime access via Constants.expoConfig.extra
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Log in build-time to help debug (only visible during build)
  if (process.env.EAS_BUILD) {
    console.log('Build-time environment variables:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseAnonKey,
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      keyLength: supabaseAnonKey?.length || 0,
    });
  }

  // Validate that required variables are present
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ WARNING: Supabase environment variables are missing!');
    console.warn('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in eas.json');
  }

  // Apply localized permissions plugins
  let updatedConfig = {
    ...config,
    extra: {
      ...config.extra,
      // CRITICAL: Expose Supabase config to app via Constants.expoConfig.extra
      // This is the ONLY way to pass env vars to the app at runtime in EAS builds
      // process.env is NOT available at runtime in production builds
      supabaseUrl: supabaseUrl || null,
      supabaseAnonKey: supabaseAnonKey || null,
      // OAuth configuration (optional)
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || null,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || null,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || null,
      appleServiceId: process.env.EXPO_PUBLIC_APPLE_SERVICE_ID || null,
      // Environment
      env: process.env.NODE_ENV || 'development',
    },
  };

  // Apply localization plugins
  updatedConfig = withLocalizedPermissions(updatedConfig);
  
  return updatedConfig;
};

// Note: withLocalizedNativePermissions is applied via plugins array in app.json
// because it needs to run during prebuild to create native files

