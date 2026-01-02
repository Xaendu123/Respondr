# iOS Quick Start Guide

## 🚀 Easiest Way to Run on iOS (No Code Signing Required)

### Option 1: Use Expo Go (Recommended for Development)

1. **Install Expo Go** from the App Store on your iPhone/iPad
   - Search for "Expo Go"

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Connect your device:**
   - Make sure your iPhone/iPad and computer are on the same WiFi network
   - Scan the QR code with your camera (iOS 13+) or the Expo Go app
   - The app will load automatically

**This method requires NO code signing and works immediately!**

---

### Option 2: Configure Automatic Signing in Xcode (For Native Builds)

If you need to use native iOS features not available in Expo Go:

1. **Open Xcode:**
   ```bash
   open ios/respondr.xcworkspace
   ```

2. **Configure Signing:**
   - Select **"respondr"** project in the left sidebar
   - Select **"respondr"** target
   - Go to **"Signing & Capabilities"** tab
   - ✅ Check **"Automatically manage signing"**
   - Select your **Team** (sign in with your Apple ID if needed)
   - Xcode will automatically handle certificates

3. **Run the app:**
   ```bash
   npm run ios:build
   ```
   Or select your simulator from Xcode and click Run ▶️

**Note:** You need an Apple ID (free) for this. Sign up at https://developer.apple.com

---

### Option 3: Use iOS Simulator (After Xcode Setup)

Once Xcode is configured with automatic signing:

```bash
# List available simulators
xcrun simctl list devices available

# Run on specific simulator
npm run ios:build
# Then select the simulator from the list
```

---

## Why Code Signing is Required

iOS requires code signing for:
- Running on physical devices
- Building production apps
- Using some native features

iOS Simulator **technically** doesn't need code signing, but Expo CLI checks for it anyway as a safety measure.

---

## Recommended Development Workflow

**For quick development and testing:**
```bash
npm start  # Use Expo Go on your physical device
```

**For testing native features:**
1. Set up automatic signing in Xcode (Option 2)
2. Use `npm run ios:build` or Xcode directly

**For production builds:**
```bash
eas build --profile production --platform ios
```

---

## Troubleshooting

### "No code signing certificates available"
**Solution:** Use Expo Go (Option 1) or set up automatic signing in Xcode (Option 2)

### "Could not find simulator"
**Solution:** 
- Install Xcode from App Store
- Open Xcode → Preferences → Components → Download a simulator

### "Expo Go doesn't support this feature"
**Solution:** Set up Xcode with automatic signing (Option 2) to build native app

---

## Summary

| Method | Code Signing | Setup Time | Best For |
|--------|-------------|------------|----------|
| Expo Go | ❌ Not needed | ⚡ Instant | Development & testing |
| Xcode (Auto Sign) | ✅ Automatic | 🕐 5 minutes | Native features |
| EAS Build | ✅ Handled by EAS | 🕐 Build time | Production |

**Start with Expo Go - it's the fastest way to get running!**

