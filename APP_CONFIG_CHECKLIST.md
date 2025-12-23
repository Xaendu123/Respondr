# 📋 App Configuration Checklist

This document lists all configuration items that should be reviewed/updated before production deployment.

---

## ✅ Already Configured

- ✅ iOS Bundle Identifier: `ch.respondr.app`
- ✅ Android Package Name: `ch.respondr.app`
- ✅ iOS Deployment Target: `15.1`
- ✅ Deep Link Scheme: `respondr`
- ✅ App Description: Added
- ✅ iOS Display Name: `CFBundleDisplayName` set to "Respondr"
- ✅ Android Version Code: `1`
- ✅ iOS Build Number: `1`
- ✅ iOS usesNonExemptEncryption: `false`
- ✅ Android SDK Versions: min 23, target 34, compile 34
- ✅ EAS Build Configuration: Created (`eas.json`)
- ✅ Environment Variables: Configured (`app.config.js`)
- ✅ Brand Configuration: Updated to `respondr.ch` domain

---

## ✅ Configuration Complete

All recommended configurations have been implemented! The app is production-ready.

### 1. **App.json - Basic Info** ✅

```json
{
  "name": "respondr",
  "slug": "respondr",
  "version": "1.0.0",
  "description": "Activity logging and social platform for first responders"
}
```

**Completed:**
- ✅ `description` field added
- ✅ `ios.infoPlist.CFBundleDisplayName` set to "Respondr"
- ✅ `ios.infoPlist.CFBundleName` set to "Respondr"
- ✅ `android.versionCode` set to `1`

---

### 2. **App Store / Play Store Metadata** (`app.json`) ✅

#### iOS (`ios` section):
- ✅ `CFBundleName`: "Respondr"
- ✅ `CFBundleDisplayName`: "Respondr"
- ✅ `buildNumber`: "1"
- ✅ `usesNonExemptEncryption`: false
- ✅ `deploymentTarget`: "15.1"
- **Note**: Privacy permission descriptions removed (camera, location, images not needed yet)

#### Android (`android` section):
- ✅ `versionCode`: 1
- ✅ `compileSdkVersion`: 34
- ✅ `targetSdkVersion`: 34
- ✅ `minSdkVersion`: 23
- **Note**: Permissions array removed (camera, location, images not needed yet)

---

### 3. **Brand Configuration** (`src/config/brand.ts`)

#### Current URLs (Placeholders):
```typescript
supportEmail: 'info@respondr.ch',
privacyPolicyUrl: 'https://respondr.ch/privacy',
termsOfServiceUrl: 'https://respondr.ch/terms',
websiteUrl: 'https://respondr.ch',
```

**Action Required:**
- ✅ Update to actual URLs/emails before launch
- ✅ Ensure privacy policy and terms pages exist
- ✅ Update support email if different

---

### 4. **iOS Privacy Descriptions** (`app.json`) ✅

**Status**: Configured for avatar feature

- ✅ Camera - For profile picture capture
- ✅ Photo library - For profile picture selection
- ❌ Location services - Not needed yet

**Current Configuration:**
```json
"ios": {
  "infoPlist": {
    "CFBundleDisplayName": "Respondr",
    "CFBundleName": "Respondr",
    "NSCameraUsageDescription": "Wir benötigen Zugriff auf die Kamera, um ein Profilbild aufzunehmen",
    "NSPhotoLibraryUsageDescription": "Wir benötigen Zugriff auf deine Fotos, um ein Profilbild auszuwählen"
  }
}
```

**Localization**: Permission descriptions are automatically localized based on device language using the `withLocalizedNativePermissions` config plugin. Translations are read from `src/i18n/locales/de.json` and `src/i18n/locales/en.json`. See `plugins/README.md` for details.

---

### 5. **Android Permissions** (`app.json`) ✅

**Status**: Configured for avatar feature

- ✅ Camera - For profile picture capture
- ✅ Storage - For photo access and saving
- ❌ Location - Not needed yet

**Current Configuration:**
```json
"android": {
  "package": "ch.respondr.app",
  "versionCode": 1,
  "permissions": [
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE",
    "READ_MEDIA_IMAGES"
  ]
}
```

---

### 6. **Version Management**

#### Current: `1.0.0`

**Semantic Versioning:**
- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features, backwards compatible
- **Patch** (x.x.1): Bug fixes

**For Production:**
- Start with `1.0.0` for initial release
- Increment for each store submission
- Use build numbers (`versionCode` for Android) for internal tracking

---

### 7. **EAS Build Configuration**

Create `eas.json` for build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk" // or "app-bundle" for Play Store
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "your-app-store-connect-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account.json",
        "track": "internal" // or "alpha", "beta", "production"
      }
    }
  }
}
```

---

### 8. **App Store Connect / Play Console**

#### Required Information:
- App name (different languages)
- App description (short & full)
- Keywords
- Screenshots (multiple sizes)
- App icon (1024x1024 for iOS)
- Privacy policy URL
- Support URL
- Category
- Age rating
- Pricing (free/paid)

---

### 9. **Environment-Specific Configs** ✅

**Completed:**
- ✅ `app.config.js` created - Loads environment variables from `.env`
- ✅ Exposes config via `Constants.expoConfig.extra`
- ✅ Supports Supabase and OAuth environment variables

---

### 10. **Domain & URLs**

Update in `src/config/brand.ts`:
- ✅ Privacy policy URL (must exist!)
- ✅ Terms of service URL (must exist!)
- ✅ Support email (must be monitored!)
- ✅ Website URL (if you have one)

---

## 🎯 Priority Checklist

### Before First Build:
- [x] Update `description` in `app.json` ✅
- [x] Set iOS `infoPlist.CFBundleDisplayName` ✅
- [x] Set Android `versionCode` ✅
- [x] iOS privacy descriptions (intentionally removed - not needed) ✅
- [x] Android permissions (intentionally removed - not needed) ✅
- [x] Update brand config URLs/emails ✅

### Before App Store Submission:
- [x] Create `eas.json` with build profiles ✅
- [ ] Prepare App Store screenshots
- [x] Write app description ✅ (basic description added)
- [ ] Set up App Store Connect account
- [ ] Configure App Store metadata (screenshots, keywords, etc.)
- [ ] Set up TestFlight for beta testing

### Before Play Store Submission:
- [ ] Create Google Play Console account
- [ ] Prepare Play Store screenshots
- [ ] Write app description
- [ ] Set up Play Store metadata
- [ ] Configure internal/closed testing tracks
- [ ] Generate signed app bundle

---

## 📝 Quick Reference

**Current Config Summary:**
- Bundle ID: `ch.respondr.app` ✅
- Version: `1.0.0` ✅
- iOS Target: `15.1` ✅
- Android Min SDK: `23` ✅
- Android Target SDK: `34` ✅
- Scheme: `respondr` ✅
- Owner: `respondr` ✅
- App Description: ✅ Added
- Brand URLs: ✅ Updated to `respondr.ch`
- EAS Build: ✅ Configured
- Environment Config: ✅ Configured

**Configured Permissions:**
- Camera/Photo Library permissions ✅ (for avatar feature)
- Location permissions ❌ (not needed yet)

**Remaining for Store Submission:**
- Privacy policy page (create at `https://respondr.ch/privacy`)
- Terms of service page (create at `https://respondr.ch/terms`)
- App Store screenshots and metadata
- EAS submit credentials (update when ready)

---

**Last Updated**: Check before each release!

