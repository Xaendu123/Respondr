# What Happens If You Remove Environment Variables?

## ⚠️ Critical: Removing Environment Variables Will Break Your App

If you remove the environment variables from `eas.json` and rebuild, here's what will happen:

## What Happens

### 1. Build Process
- ✅ Build will **succeed** (no errors during build)
- ✅ App will compile and create successfully
- ⚠️ Environment variables will be `undefined` or `null`

### 2. Runtime Behavior

#### In Development (`__DEV__ = true`):
```typescript
// From src/config/supabase.ts
if (__DEV__) {
  console.warn('⚠️ Missing Supabase environment variables:', errorMsg);
  // App continues with placeholder values
  supabaseUrl = 'https://placeholder.supabase.co'
  supabaseAnonKey = 'placeholder-key'
}
```
- App will show warning but continue
- **All network requests will fail** (using placeholder URL)
- Users will see "network request failed" errors

#### In Production (`__DEV__ = false`):
```typescript
// From src/config/supabase.ts
if (!__DEV__) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  throw new Error('Missing Supabase environment variables...');
}
```
- App will **crash on startup** with error
- Users cannot use the app at all
- TestFlight build will fail to start

## Current Code Behavior

Looking at `src/config/supabase.ts`:

```typescript
// Try to get from Constants.expoConfig.extra first
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                     (__DEV__ ? process.env.EXPO_PUBLIC_SUPABASE_URL : undefined);
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        (__DEV__ ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  if (__DEV__) {
    console.warn('⚠️ Missing Supabase environment variables');
  } else {
    // PRODUCTION: App will crash!
    throw new Error('Missing Supabase environment variables...');
  }
}
```

## Impact Summary

| Scenario | Development Build | Production Build |
|----------|------------------|------------------|
| **With env vars** | ✅ Works | ✅ Works |
| **Without env vars** | ⚠️ Warns, but fails | ❌ **Crashes on startup** |

## What You Should Do

### ✅ Keep Environment Variables in eas.json

**DO NOT remove them!** They are required for:
- Connecting to Supabase
- Authentication
- Database queries
- Storage operations

### If You Want to Test Without Them

1. **Don't remove from eas.json** (required for production)
2. **Test locally** by temporarily commenting out the check in `supabase.ts`
3. **Or** create a separate test build profile with different values

## Current Configuration

Your `eas.json` has the correct values:
- ✅ `EXPO_PUBLIC_SUPABASE_URL`: Set correctly
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Set correctly
- ✅ All profiles (dev, preview, production) have values

## Recommendation

**Keep the environment variables in `eas.json`!**

They are:
- ✅ Required for the app to function
- ✅ Already correctly configured
- ✅ Not a security risk (anon keys are public by design)
- ✅ Version-controlled and safe to commit

## If You Remove Them

**Production builds will crash on startup** with:
```
Error: Missing Supabase environment variables. 
Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in eas.json for production builds.
```

**Don't remove them!** They're essential for your app to work.

