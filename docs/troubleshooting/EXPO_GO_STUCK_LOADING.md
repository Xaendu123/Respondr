# Expo Go Stuck on "Opening Project"

If Expo Go gets stuck on the "Opening project" screen, here are the most common causes and solutions:

## Quick Fixes

### 1. Clear Expo Go Cache

**iOS:**
- Delete and reinstall Expo Go app

**Android:**
- Settings → Apps → Expo Go → Storage → Clear Data

### 2. Restart Metro with Clear Cache

```bash
npx expo start --clear
```

### 3. Check Network Connection

- Ensure your device and computer are on the same WiFi network
- Try using tunnel mode:
  ```bash
  npx expo start --tunnel
  ```

### 4. Check for Errors in Metro Bundler

Look at the terminal running `expo start` for any error messages. Common issues:
- Missing dependencies
- Syntax errors in code
- Module resolution errors

## Common Causes

### 1. Missing Environment Variables

**Symptom**: App loads but crashes immediately or hangs

**Fix**: Ensure `.env` file exists with:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### 2. Async Initialization Blocking

**Symptom**: App hangs during initialization

**Fix**: The app has been updated to:
- Make i18n initialization non-blocking
- Add timeout to auth initialization
- Handle missing Supabase credentials gracefully

### 3. Large Bundle Size

**Symptom**: Takes very long to load

**Fix**: 
- Check Metro bundler output for bundle size
- Consider code splitting
- Remove unused dependencies

### 4. Network Issues

**Symptom**: Metro bundler can't connect to device

**Fix**:
```bash
# Use tunnel mode
npx expo start --tunnel

# Or check firewall settings
# Ensure port 8081 is not blocked
```

### 5. Incompatible Modules

**Symptom**: Module not found errors

**Fix**: Run compatibility check:
```bash
npx expo doctor
```

## Debugging Steps

### 1. Check Metro Bundler Logs

Look for:
- Bundle compilation errors
- Module resolution errors
- Network errors

### 2. Enable Verbose Logging

```bash
npx expo start --verbose
```

### 3. Check Device Logs

**iOS:**
- Connect device to Mac
- Open Console.app
- Filter for "Expo" or "Metro"

**Android:**
```bash
adb logcat | grep -i "expo\|metro\|react"
```

### 4. Test with Minimal Code

Temporarily simplify `app/_layout.tsx` to isolate the issue:

```typescript
export default function RootLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Test</Text>
    </View>
  );
}
```

If this works, gradually add back providers to find the issue.

## Recent Fixes Applied

1. ✅ Made Supabase config resilient (won't crash if env vars missing)
2. ✅ Made i18n initialization non-blocking
3. ✅ Added timeout to auth initialization
4. ✅ Disabled new architecture (required for Expo Go)
5. ✅ Removed unused `react-native-worklets`

## Still Stuck?

1. **Check Metro bundler**: Is it running and showing "Metro waiting on..."?
2. **Check device network**: Can device reach your computer's IP?
3. **Try development build**: `npx expo run:ios` or `npx expo run:android`
4. **Check Expo Go version**: Update to latest version
5. **Try different network**: Switch to mobile hotspot or different WiFi

## Alternative: Use Development Build

If Expo Go continues to have issues, use a development build:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

This gives you more control and better error messages.

