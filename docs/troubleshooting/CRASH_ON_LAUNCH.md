# Troubleshooting: App Crashes on Launch

If your EAS build crashes immediately on launch, here are the most common causes and solutions:

## Critical Fixes Applied

### 1. ✅ Missing Babel Configuration
**Issue**: `react-native-reanimated` requires a Babel plugin to work.

**Fix**: Created `babel.config.js` with the required plugin:
```javascript
plugins: ['react-native-reanimated/plugin']
```

### 2. ✅ Missing Gesture Handler Import
**Issue**: `react-native-gesture-handler` must be imported at the very top of your entry file.

**Fix**: Added import at the top of `app/_layout.tsx`:
```javascript
import 'react-native-gesture-handler'; // Must be imported first
```

### 3. ✅ Missing Metro Configuration
**Issue**: Metro bundler needs proper configuration for React Native 0.73+.

**Fix**: Created `metro.config.js` with proper Expo and React Native configuration.

## Common Causes

### Environment Variables Missing

If your app uses Supabase or other services, ensure environment variables are set in EAS Build:

1. **Set secrets in EAS**:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
   ```

2. **Or configure in `eas.json`**:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_SUPABASE_URL": "your-url",
           "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-key"
         }
       }
     }
   }
   ```

### Async Initialization Issues

If your app has async initialization (like i18n), ensure it's handled properly:

- Wrap async operations in try-catch blocks
- Use loading states to prevent rendering before initialization
- Consider using Suspense boundaries for async components

### Native Module Issues

If you're using native modules, ensure they're properly configured:

1. **Check plugin configuration** in `app.json`
2. **Verify native dependencies** are compatible with your Expo SDK version
3. **Run prebuild** if you've modified native code:
   ```bash
   npx expo prebuild --clean
   ```

## Debugging Steps

### 1. Check Build Logs
Review the EAS Build logs for any errors during the build process:
```bash
eas build:list
eas build:view [build-id]
```

### 2. Test Locally First
Before building with EAS, test locally:
```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android
```

### 3. Check Device Logs
For iOS:
```bash
# Connect device and view logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Respondr"'
```

For Android:
```bash
adb logcat | grep -i "respondr\|react\|error"
```

### 4. Enable Debug Mode
Add error boundaries and better error handling:
```javascript
// In app/_layout.tsx or root component
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <View>
      <Text>Something went wrong:</Text>
      <Text>{error.message}</Text>
      <Button onPress={resetErrorBoundary}>Try again</Button>
    </View>
  );
}
```

## Verification Checklist

- [ ] `babel.config.js` exists with `react-native-reanimated/plugin`
- [ ] `metro.config.js` exists and is properly configured
- [ ] `react-native-gesture-handler` is imported at the top of entry file
- [ ] Environment variables are set in EAS secrets or `eas.json`
- [ ] All native modules are properly configured in `app.json` plugins
- [ ] No console errors in local development
- [ ] App builds successfully with `npx expo run:ios` or `npx expo run:android`

## Next Steps

After applying these fixes:

1. **Rebuild with EAS**:
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

2. **Test the new build** on a device or simulator

3. **If still crashing**, check device logs for specific error messages

4. **Share error logs** if you need further assistance

## Additional Resources

- [EAS Build Troubleshooting](https://docs.expo.dev/build/troubleshooting/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Expo Error Handling](https://docs.expo.dev/guides/errors/)

