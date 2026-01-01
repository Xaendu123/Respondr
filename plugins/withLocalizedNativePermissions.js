/**
 * EXPO CONFIG PLUGIN: Native Localized Permissions
 * 
 * Creates iOS InfoPlist.strings and Android strings.xml files
 * with localized permission descriptions.
 * 
 * Why withDangerousMod?
 * ---------------------
 * "Dangerous" means it directly modifies native files using file system operations,
 * which can be risky because:
 * 1. Not idempotent - running multiple times may have unexpected results
 * 2. Can break if Expo's native templates change
 * 3. Requires careful error handling
 * 
 * We use it here because:
 * - Expo doesn't have a built-in mod for localization files (InfoPlist.strings, strings.xml)
 * - We need to create new files, not just modify existing ones
 * - This is the only way to add iOS/Android localization files via config plugins
 * 
 * Alternative approaches:
 * - Manual file creation after `npx expo prebuild` (more maintenance)
 * - Using a simpler plugin that only updates app.json (limited to default language)
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Robust path resolution - works in both local and EAS builds
function getTranslationsPath() {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(__dirname, '../src/i18n/locales'),
    path.join(process.cwd(), 'src/i18n/locales'),
    path.resolve('src/i18n/locales'),
  ];
  
  for (const translationsPath of possiblePaths) {
    const dePath = path.join(translationsPath, 'de.json');
    const enPath = path.join(translationsPath, 'en.json');
    
    if (fs.existsSync(dePath) && fs.existsSync(enPath)) {
      return translationsPath;
    }
  }
  
  // If no path found, return the first one (will fail gracefully with error handling)
  return possiblePaths[0];
}

function getTranslations() {
  const translationsPath = getTranslationsPath();
  const dePath = path.join(translationsPath, 'de.json');
  const enPath = path.join(translationsPath, 'en.json');
  
  // Default fallback translations
  const defaultTranslations = {
    de: {
      camera: 'Wir benötigen Zugriff auf die Kamera, um ein Profilbild aufzunehmen',
      photoLibrary: 'Wir benötigen Zugriff auf deine Fotos, um ein Profilbild auszuwählen',
    },
    en: {
      camera: 'We need access to your camera to take a profile picture',
      photoLibrary: 'We need access to your photos to select a profile picture',
    },
  };
  
  let de = {};
  let en = {};
  
  try {
    if (fs.existsSync(dePath)) {
      de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
    } else {
      console.warn(`⚠️ Translation file not found: ${dePath}, using defaults`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to read German translations: ${error.message}, using defaults`);
  }
  
  try {
    if (fs.existsSync(enPath)) {
      en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    } else {
      console.warn(`⚠️ Translation file not found: ${enPath}, using defaults`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to read English translations: ${error.message}, using defaults`);
  }
  
  return {
    de: {
      camera: de.profile?.cameraPermissionRequired || defaultTranslations.de.camera,
      photoLibrary: de.profile?.photoPermissionRequired || defaultTranslations.de.photoLibrary,
    },
    en: {
      camera: en.profile?.cameraPermissionRequired || defaultTranslations.en.camera,
      photoLibrary: en.profile?.photoPermissionRequired || defaultTranslations.en.photoLibrary,
    },
  };
}

function withLocalizedNativePermissions(config) {
  // iOS: Create InfoPlist.strings files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      try {
        if (process.env.EAS_BUILD) {
          console.log('🔧 [Plugin] Running in EAS build environment');
          console.log(`🔧 [Plugin] Working directory: ${process.cwd()}`);
          console.log(`🔧 [Plugin] __dirname: ${__dirname}`);
        }
        
        const translations = getTranslations();
        
        // Only create files if native project exists (after prebuild)
        if (!config.modRequest?.platformProjectRoot || !fs.existsSync(config.modRequest.platformProjectRoot)) {
          if (process.env.EAS_BUILD) {
            console.log(`⚠️ [Plugin] iOS platformProjectRoot not available: ${config.modRequest?.platformProjectRoot || 'undefined'}`);
          }
          return config;
        }
        
        const iosPath = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName);
        
        if (process.env.EAS_BUILD) {
          console.log(`🔧 [Plugin] iOS path: ${iosPath}`);
        }
        
        // Create de.lproj directory and InfoPlist.strings
        const deLprojPath = path.join(iosPath, 'de.lproj');
        if (!fs.existsSync(deLprojPath)) {
          fs.mkdirSync(deLprojPath, { recursive: true });
        }
        
        const deInfoPlistStrings = path.join(deLprojPath, 'InfoPlist.strings');
        const deContent = `/* Localized permission descriptions - German */
"NSCameraUsageDescription" = "${translations.de.camera.replace(/"/g, '\\"')}";
"NSPhotoLibraryUsageDescription" = "${translations.de.photoLibrary.replace(/"/g, '\\"')}";
`;
        fs.writeFileSync(deInfoPlistStrings, deContent);
        
        // Create en.lproj directory and InfoPlist.strings
        const enLprojPath = path.join(iosPath, 'en.lproj');
        if (!fs.existsSync(enLprojPath)) {
          fs.mkdirSync(enLprojPath, { recursive: true });
        }
        
        const enInfoPlistStrings = path.join(enLprojPath, 'InfoPlist.strings');
        const enContent = `/* Localized permission descriptions - English */
"NSCameraUsageDescription" = "${translations.en.camera.replace(/"/g, '\\"')}";
"NSPhotoLibraryUsageDescription" = "${translations.en.photoLibrary.replace(/"/g, '\\"')}";
`;
        fs.writeFileSync(enInfoPlistStrings, enContent);
        
        if (process.env.EAS_BUILD) {
          console.log('✅ [Plugin] iOS localization files created successfully');
        }
      } catch (error) {
        console.error('❌ [Plugin] Failed to create iOS localization files:', error.message);
        if (process.env.EAS_BUILD) {
          console.error('❌ [Plugin] Error stack:', error.stack);
        }
      }
      
      return config;
    },
  ]);
  
  // Android: Create strings.xml files
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      try {
        if (process.env.EAS_BUILD) {
          console.log('🔧 [Plugin] Running Android mod in EAS build environment');
        }
        
        const translations = getTranslations();
        
        // Only create files if native project exists (after prebuild)
        if (!config.modRequest?.platformProjectRoot || !fs.existsSync(config.modRequest.platformProjectRoot)) {
          if (process.env.EAS_BUILD) {
            console.log(`⚠️ [Plugin] Android platformProjectRoot not available: ${config.modRequest?.platformProjectRoot || 'undefined'}`);
          }
          return config;
        }
        
        const androidPath = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      
      // Create values-de/strings.xml (German)
      const valuesDePath = path.join(androidPath, 'values-de');
      if (!fs.existsSync(valuesDePath)) {
        fs.mkdirSync(valuesDePath, { recursive: true });
      }
      
      const deStringsXml = path.join(valuesDePath, 'strings.xml');
      const deContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Localized permission descriptions - German -->
    <string name="expo_camera_permission_rationale">${translations.de.camera.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>
    <string name="expo_imagepicker_photolibrary_permission_rationale">${translations.de.photoLibrary.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>
</resources>
`;
      fs.writeFileSync(deStringsXml, deContent);
      
      // Create values-en/strings.xml (English)
      const valuesEnPath = path.join(androidPath, 'values-en');
      if (!fs.existsSync(valuesEnPath)) {
        fs.mkdirSync(valuesEnPath, { recursive: true });
      }
      
      const enStringsXml = path.join(valuesEnPath, 'strings.xml');
      const enContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Localized permission descriptions - English -->
    <string name="expo_camera_permission_rationale">${translations.en.camera.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>
    <string name="expo_imagepicker_photolibrary_permission_rationale">${translations.en.photoLibrary.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>
</resources>
`;
      fs.writeFileSync(enStringsXml, enContent);
      
      if (process.env.EAS_BUILD) {
        console.log('✅ [Plugin] Android localization files created successfully');
      }
      } catch (error) {
        console.error('❌ [Plugin] Failed to create Android localization files:', error.message);
        if (process.env.EAS_BUILD) {
          console.error('❌ [Plugin] Error stack:', error.stack);
        }
      }
      
      return config;
    },
  ]);
  
  return config;
}

module.exports = withLocalizedNativePermissions;

