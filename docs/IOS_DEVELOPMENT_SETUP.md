# iOS Development Setup Guide

This guide explains how to run and develop the iOS app locally.

## Quick Solutions for Code Signing Errors

### ✅ Option 1: Use iOS Simulator (Recommended for Development)

The iOS Simulator doesn't require code signing certificates. Use:

```bash
# Run on default simulator
npm run ios

# Or specify a simulator
npx expo run:ios --simulator="iPhone 15 Pro"

# List available simulators
xcrun simctl list devices available
```

**Note**: The `package.json` script has been updated to use `--simulator` by default.

### ✅ Option 2: Use Expo Go App (Easiest for Development)

Expo Go doesn't require code signing at all:

```bash
# Start the development server
npm start

# Then:
# 1. Install "Expo Go" from the App Store on your iPhone/iPad
# 2. Scan the QR code with your camera (iOS 13+) or Expo Go app
# 3. The app will load in Expo Go
```

**Limitations**: Some native features may not work in Expo Go. For full native functionality, use Option 1 or 3.

### ✅ Option 3: Set Up Automatic Code Signing in Xcode

To run on a physical device, you need to set up code signing:

1. **Open the project in Xcode:**
   ```bash
   open ios/respondr.xcworkspace
   ```

2. **Select your project** in the navigator (top item)

3. **Select the "respondr" target** → **Signing & Capabilities** tab

4. **Check "Automatically manage signing"**

5. **Select your Team** (requires Apple Developer account - free for personal use)

6. **Xcode will automatically:**
   - Create provisioning profiles
   - Set up code signing certificates
   - Register the bundle identifier

7. **Connect your iPhone/iPad via USB**

8. **Select your device** from the device dropdown in Xcode

9. **Click Run** or use:
   ```bash
   npx expo run:ios --device
   ```

### ✅ Option 4: Use EAS Build for Development Builds

EAS Build can create development builds with proper code signing:

```bash
# Build development client for iOS (requires EAS account)
eas build --profile development --platform ios

# Then install the development client on your device
# and run the app with it
```

## Troubleshooting

### Error: "No code signing certificates are available"

**Solution**: Use Option 1 (simulator) or Option 2 (Expo Go) for development.

### Error: "Could not find iPhone Simulator"

**Solution**: Install Xcode from the App Store, then:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

### Error: "Bundle identifier already exists"

**Solution**: If `ch.respondr.app` is already registered:
- Use a different bundle identifier in `app.json` → `ios.bundleIdentifier`
- Or add it to your Apple Developer account

### Running on a Physical Device

You need:
1. **Apple Developer Account** (free for personal use):
   - Sign up at https://developer.apple.com
   - Free account allows testing on your own devices

2. **Xcode installed** from the App Store

3. **Automatic signing enabled** (see Option 3 above)

4. **Device trusted**:
   - Connect device via USB
   - On device: Settings → General → VPN & Device Management → Trust your computer

## Recommended Development Workflow

### For Quick Development:
```bash
npm start  # Use Expo Go on your physical device
```

### For Full Native Features:
```bash
npm run ios  # Runs on iOS Simulator (no code signing needed)
```

### For Testing on Physical Device:
1. Set up code signing in Xcode (Option 3)
2. Use: `npx expo run:ios --device`

### For Production Builds:
```bash
eas build --profile production --platform ios
```

## Code Signing Requirements Summary

| Method | Code Signing Required | Best For |
|--------|---------------------|----------|
| iOS Simulator | ❌ No | Local development |
| Expo Go | ❌ No | Quick testing |
| Physical Device (Development) | ✅ Yes (automatic via Xcode) | Testing on real device |
| EAS Build | ✅ Yes (handled by EAS) | Production/CI builds |

## Current Configuration

- **Bundle Identifier**: `ch.respondr.app`
- **Deployment Target**: iOS 15.4+
- **Supports**: iPhone and iPad (`supportsTablet: true`)

## Additional Resources

- [Expo iOS Development](https://docs.expo.dev/workflow/ios-simulator/)
- [Xcode Code Signing](https://developer.apple.com/documentation/xcode/configuring-code-signing)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

