# Testing the Plugin

## Step 1: Test Plugin Syntax (Quick Check)
```bash
node -e "require('./plugins/withLocalizedNativePermissions')"
```
Should exit without errors.

## Step 2: Test Plugin with Expo Config (Local)
```bash
# This will run the plugin and show any errors
npx expo config --type introspect
```

## Step 3: Test Prebuild (Creates Native Directories)
```bash
# Clean prebuild - regenerates ios/ and android/ from app.json
npx expo prebuild --clean

# Check if localization files were created:
# iOS:
ls -la ios/respondr/de.lproj/InfoPlist.strings
ls -la ios/respondr/en.lproj/InfoPlist.strings

# Android:
ls -la android/app/src/main/res/values-de/strings.xml
ls -la android/app/src/main/res/values-en/strings.xml
```

## Step 4: Test Local Build (iOS)
```bash
# This will use the generated native project
npx expo run:ios
```

## Step 5: Test EAS Build (Production)
```bash
# Test with preview profile first (faster, cheaper)
eas build --profile preview --platform ios

# Or test production build
eas build --profile production --platform ios
```
