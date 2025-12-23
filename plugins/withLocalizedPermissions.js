/**
 * EXPO CONFIG PLUGIN: Localized Permissions
 * 
 * This plugin adds localized permission descriptions for iOS and Android
 * by reading from the i18n translation files.
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_PATH = path.join(__dirname, '../src/i18n/locales');

function getTranslations() {
  const de = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_PATH, 'de.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_PATH, 'en.json'), 'utf8'));
  
  return {
    de: {
      camera: de.profile?.cameraPermissionRequired || 'Wir benötigen Zugriff auf die Kamera, um ein Profilbild aufzunehmen',
      photoLibrary: de.profile?.photoPermissionRequired || 'Wir benötigen Zugriff auf deine Fotos, um ein Profilbild auszuwählen',
    },
    en: {
      camera: en.profile?.cameraPermissionRequired || 'We need access to your camera to take a profile picture',
      photoLibrary: en.profile?.photoPermissionRequired || 'We need access to your photos to select a profile picture',
    },
  };
}

function withLocalizedPermissions(config) {
  const translations = getTranslations();
  
  // Update iOS infoPlist with default (German) descriptions
  if (config.ios && config.ios.infoPlist) {
    config.ios.infoPlist.NSCameraUsageDescription = translations.de.camera;
    config.ios.infoPlist.NSPhotoLibraryUsageDescription = translations.de.photoLibrary;
  }
  
  // Update expo-image-picker plugin config
  if (config.plugins) {
    const imagePickerPluginIndex = config.plugins.findIndex(
      plugin => Array.isArray(plugin) && plugin[0] === 'expo-image-picker'
    );
    
    if (imagePickerPluginIndex !== -1) {
      config.plugins[imagePickerPluginIndex][1] = {
        photosPermission: translations.de.photoLibrary,
        cameraPermission: translations.de.camera,
      };
    }
  }
  
  return config;
}

module.exports = withLocalizedPermissions;

