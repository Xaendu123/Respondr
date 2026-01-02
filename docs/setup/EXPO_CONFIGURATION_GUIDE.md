# Expo Configuration Guide

## ✅ Correct Way to Configure Expo Projects

In Expo projects, you should **ONLY** configure things through:

### 1. **`app.json`** - Platform Configuration
All iOS and Android settings go here:
```json
{
  "expo": {
    "ios": {
      "deploymentTarget": "15.4",
      "bundleIdentifier": "ch.respondr.app",
      // ... all iOS config
    },
    "android": {
      "minSdkVersion": 23,
      "package": "ch.respondr.app",
      // ... all Android config
    }
  }
}
```

### 2. **`app.config.js`** - Dynamic Configuration
For environment variables and dynamic settings:
```javascript
module.exports = ({ config }) => {
  // Dynamic config based on environment
  return config;
};
```

### 3. **`eas.json`** - Build Configuration
For EAS Build profiles:
```json
{
  "build": {
    "development": {
      "ios": { /* iOS build settings */ },
      "android": { /* Android build settings */ }
    }
  }
}
```

### 4. **Custom Plugins** (in `plugins/`)
For advanced native modifications:
```javascript
// plugins/myPlugin.js
const { withPlugins } = require('@expo/config-plugins');

function withMyPlugin(config) {
  // Modify native config programmatically
  return config;
}

module.exports = withMyPlugin;
```

---

## ❌ DON'T Manually Edit Native Directories

### Don't edit files in:
- `ios/respondr.xcodeproj/project.pbxproj`
- `ios/respondr/Info.plist` (unless using a plugin)
- `android/app/build.gradle`
- Any other files in `ios/` or `android/` directories

**Why?**
- These directories are generated/managed by Expo
- Changes will be overwritten when you run `npx expo prebuild`
- Expo uses `app.json` as the source of truth

---

## When Native Directories Are Needed

### Bare Workflow (This Project)
Your project appears to use the **"bare workflow"** where:
- ✅ Native directories (`ios/` and `android/`) are committed to git
- ✅ You can run native builds directly (`expo run:ios`, `expo run:android`)
- ⚠️ Still configure through `app.json` first!

**Even in bare workflow:**
- Configure through `app.json` → Expo generates native files
- If you need custom changes, use Expo Config Plugins
- Only edit native files directly if absolutely necessary and document why

### Managed Workflow
- Native directories are generated on-demand
- Not committed to git
- Always configured through `app.json`

---

## Code Signing Configuration

### For Code Signing Issues:

**❌ Don't edit:** `ios/respondr.xcodeproj/project.pbxproj`

**✅ Do this instead:**

1. **Use Expo Go** (easiest):
   ```bash
   npm start
   ```

2. **Or configure in Xcode** (for native builds):
   - Open `ios/respondr.xcworkspace` in Xcode
   - Project → Signing & Capabilities
   - Check "Automatically manage signing"
   - Select your Team
   - Xcode will handle certificates automatically

3. **Or use EAS Build** (for production):
   ```bash
   eas build --profile production --platform ios
   ```
   EAS handles code signing automatically

---

## How Changes Flow

```
app.json / app.config.js
    ↓
npx expo prebuild  (if needed)
    ↓
ios/ & android/ directories generated/updated
    ↓
Native builds (xcodebuild, gradle)
```

---

## Regenerating Native Directories

If you need to regenerate the native directories from `app.json`:

```bash
# Remove native directories (backup first!)
rm -rf ios android

# Regenerate from app.json
npx expo prebuild

# Reinstall pods (iOS)
cd ios && pod install && cd ..
```

---

## Summary

| What | Where to Configure |
|------|-------------------|
| iOS bundle ID | `app.json` → `ios.bundleIdentifier` |
| Android package | `app.json` → `android.package` |
| iOS deployment target | `app.json` → `ios.deploymentTarget` |
| Android min SDK | `app.json` → `android.minSdkVersion` |
| Permissions | `app.json` → `ios.infoPlist` / `android.permissions` |
| Build settings | `eas.json` → `build.*.ios` / `build.*.android` |
| Code signing | Xcode UI (for dev) or EAS Build (for production) |

**Remember:** `app.json` is your source of truth! 🎯

