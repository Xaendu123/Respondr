# Localized Permissions Plugin

This plugin automatically generates localized permission descriptions for iOS and Android based on your i18n translation files.

## How It Works

1. **Reads translations** from `src/i18n/locales/de.json` and `src/i18n/locales/en.json`
2. **Updates app.json** permission descriptions with the default language (German)
3. **Generates native localization files** during `npx expo prebuild`:
   - iOS: `InfoPlist.strings` in `de.lproj/` and `en.lproj/` folders
   - Android: `strings.xml` in `values-de/` and `values-en/` folders

## Why "DangerousMod"?

The plugin uses `withDangerousMod`, which is called "dangerous" because it:
- **Directly modifies native files** using file system operations
- **Not idempotent** - may behave differently if run multiple times
- **Can break** if Expo's native templates change in future versions

**Why we use it:**
- Expo doesn't provide a "safe" mod plugin for creating localization files
- It's the only way to automatically generate `InfoPlist.strings` and `strings.xml` files
- Our implementation is careful to check if files/folders exist before modifying

**The alternative** would be manually creating these files after each `npx expo prebuild`, which is more error-prone and harder to maintain.

## Usage

The plugin is automatically configured in `app.json`:

```json
{
  "plugins": [
    ["./plugins/withLocalizedNativePermissions", null]
  ]
}
```

And applied in `app.config.js`:

```javascript
const withLocalizedPermissions = require('./plugins/withLocalizedPermissions');
```

## Translation Keys Required

The plugin looks for these keys in your translation files:

- `profile.cameraPermissionRequired` - Camera permission description
- `profile.photoPermissionRequired` - Photo library permission description

Example in `src/i18n/locales/de.json`:

```json
{
  "profile": {
    "cameraPermissionRequired": "Wir benötigen Zugriff auf die Kamera, um ein Profilbild aufzunehmen",
    "photoPermissionRequired": "Wir benötigen Zugriff auf deine Fotos, um ein Profilbild auszuwählen"
  }
}
```

## Building

After updating translations:

1. **For managed workflow** (Expo Go): Permission descriptions come from `app.json` (default language)
2. **For bare workflow** (after `npx expo prebuild`): Native localization files are automatically generated

## Notes

- Default language (German) is used in `app.json` for managed workflow
- Native localization files are only created after running `npx expo prebuild`
- The plugin safely handles missing native project folders (managed workflow)

