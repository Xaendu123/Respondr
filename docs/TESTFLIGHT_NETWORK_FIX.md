# TestFlight Network Request Failed - Fix Guide

## Problem
Getting "network request failed" error in TestFlight builds.

## Common Causes

1. **Environment Variables Not Set in EAS Build**
   - EAS builds need environment variables explicitly set in `eas.json`
   - ✅ Already configured in your `eas.json` for production

2. **iOS App Transport Security (ATS)**
   - iOS blocks insecure network connections
   - ✅ Fixed: Added ATS exception for `supabase.co` domain

3. **Supabase Client Configuration**
   - React Native needs explicit fetch configuration
   - ✅ Fixed: Added `global.fetch` configuration

## Fixes Applied

### 1. Supabase Client Configuration
- Added explicit `fetch` configuration for React Native compatibility
- Added development logging to help debug configuration issues

### 2. iOS App Transport Security
- Added ATS exception for `supabase.co` domain
- Ensures HTTPS connections are allowed
- Configured TLS 1.2 minimum version

## Verification Steps

1. **Check Environment Variables in Build**
   ```bash
   # Verify your EAS build has the correct environment variables
   eas build:configure
   ```

2. **Rebuild for TestFlight**
   ```bash
   # Build for production with environment variables
   eas build --platform ios --profile production
   ```

3. **Test Network Connection**
   - After installing TestFlight build, check console logs
   - Look for "Supabase Config" log (in development builds)
   - Verify URL and key are present

## Additional Debugging

If the issue persists, add this to your app to see the actual error:

```typescript
// In src/config/supabase.ts (temporary debugging)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    console.log('Auth event:', event, session ? 'has session' : 'no session');
  }
});
```

## Common Issues

### Issue: Environment variables not available
**Solution**: Ensure `eas.json` has `env` section for production profile

### Issue: ATS blocking requests
**Solution**: Already fixed with ATS exception in `app.json`

### Issue: Network timeout
**Solution**: Check Supabase project status and network connectivity

## Next Steps

1. Rebuild the app with these fixes
2. Test in TestFlight
3. If still failing, check:
   - Supabase project is active
   - Network connectivity on device
   - Console logs for specific error messages

