# Platform Configuration Guide

This document explains how the Respondr app is configured for different operating systems and device types.

## Supported Devices

The app is configured for:
- ✅ **iPhone** (all models running iOS 15.4+)
- ✅ **iPad** (all models running iOS 15.4+)
- ✅ **Android Phones** (all models running Android 6.0+ / API 23+)
- ❌ **Web** - Disabled

## Platform Details

### ✅ iOS (iPhone & iPad)
- **Minimum Version**: iOS 15.4+
- **Configuration**: `app.json` → `ios.deploymentTarget: "15.4"`
- **Bundle Identifier**: `ch.respondr.app`
- **Device Support**: 
  - iPhone: ✅ All models
  - iPad: ✅ All models (`supportsTablet: true`)
- **Build Profiles**: Configured in `eas.json` for development, preview, and production

### ✅ Android (Phones)
- **Minimum Version**: Android 6.0+ (API Level 23+)
- **Configuration**: 
  - `app.json` → `android.minSdkVersion: 23`
  - `app.json` → `android.targetSdkVersion: 34` (Android 14)
  - `app.json` → `android.compileSdkVersion: 34`
- **Package Name**: `ch.respondr.app`
- **Device Support**:
  - Android Phones: ✅ Optimized and targeted
  - Android Tablets: ⚠️ Compatible (same APK/AAB) but UI optimized for phones
- **Build Profiles**: Configured in `eas.json` for development (APK), preview (APK), and production (App Bundle)

### ❌ Web
- **Status**: Disabled
- **Note**: Web support has been removed from the app configuration

## Platform Requirements Summary

| Platform | Device Types | Minimum OS Version | Target OS Version | Status |
|----------|-------------|-------------------|-------------------|--------|
| iOS      | iPhone, iPad | iOS 15.4          | Latest            | ✅ Enabled |
| Android  | Phones (tablets compatible) | API 23 (Android 6.0) | API 34 (Android 14) | ✅ Enabled |
| Web      | Browsers     | N/A               | N/A               | ❌ Disabled |

## How to Modify Platform Support

### Disable a Platform

1. **To disable iOS builds:**
   - Remove `ios` sections from `eas.json` build profiles
   - Optionally remove `ios` section from `app.json` (prevents iOS config)

2. **To disable Android builds:**
   - Remove `android` sections from `eas.json` build profiles
   - Optionally remove `android` section from `app.json` (prevents Android config)

3. **To re-enable Web:**
   - Add `web` section back to `app.json` with output and favicon configuration

### Change Minimum OS Version

1. **iOS:**
   - Edit `app.json` → `ios.deploymentTarget`
   - Example: `"deploymentTarget": "16.0"` for iOS 16.0+

2. **Android:**
   - Edit `app.json` → `android.minSdkVersion`
   - Example: `"minSdkVersion": 26` for Android 8.0+ (API 26)

### Build Platform-Specific Versions

Use EAS CLI with platform flags:
```bash
# Build only iOS
eas build --platform ios --profile production

# Build only Android
eas build --platform android --profile production

# Build both (default)
eas build --profile production
```

## Platform-Specific Features

### iOS Features
- Universal Links via `associatedDomains`
- Camera and Photo Library permissions
- App Transport Security configured for Supabase
- Non-exempt encryption declaration

### Android Features
- Deep linking via `intentFilters` (https://respondr.ch and respondr://)
- Adaptive icon with monochrome variant
- Camera and storage permissions
- Edge-to-edge enabled
- Predictive back gesture disabled

### Web Features
- ❌ Web support disabled

## Notes

- All platforms share the same version number (`1.0.0`)
- iOS uses `buildNumber` for versioning
- Android uses `versionCode` for versioning
- EAS Build handles platform-specific build configurations automatically

