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
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Apply localized permissions plugins
  let updatedConfig = {
    ...config,
    extra: {
      ...config.extra,
      // Expose Supabase config to app via Constants.expoConfig.extra
      supabaseUrl,
      supabaseAnonKey,
      // OAuth configuration (optional)
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      appleServiceId: process.env.EXPO_PUBLIC_APPLE_SERVICE_ID,
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

