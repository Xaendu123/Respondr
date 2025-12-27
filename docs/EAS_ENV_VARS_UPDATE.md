# How to Update Environment Variables in EAS

## ⚠️ Important: Environment Variables Require a Rebuild

**You cannot update environment variables without rebuilding the app.** Environment variables are compiled into the app binary at build time, so they're part of the app code.

## Options for Managing Environment Variables

### Option 1: Update eas.json and Rebuild (Current Method) ✅

This is what you're currently doing:

1. **Update `eas.json`** with new environment variables
2. **Rebuild the app**:
   ```bash
   eas build --platform ios --profile production
   ```

**Pros:**
- Simple and straightforward
- Variables are version-controlled in `eas.json`
- Works for all build profiles

**Cons:**
- Requires full rebuild (takes time)
- Can't update without rebuilding

### Option 2: Use EAS Secrets (Still Requires Rebuild)

EAS Secrets allow you to store sensitive values separately, but you still need to rebuild:

1. **Set secrets via CLI**:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://nbdmoapoiqxyjrrhzqvg.supabase.co"
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key-here"
   ```

2. **Reference in eas.json** (optional - secrets are automatically available):
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_SUPABASE_URL": "${EXPO_PUBLIC_SUPABASE_URL}"
         }
       }
     }
   }
   ```

3. **Still need to rebuild**:
   ```bash
   eas build --platform ios --profile production
   ```

**Pros:**
- Secrets are stored securely in EAS
- Can be updated without changing `eas.json`
- Better for sensitive values

**Cons:**
- Still requires rebuild
- More complex setup

### Option 3: Runtime Configuration (Not Recommended for Supabase)

You could fetch configuration from a remote server at runtime, but this is:
- Complex to implement
- Requires network call on every app start
- Not recommended for Supabase URLs/keys

## ✅ Recommended Approach

**For your use case, stick with Option 1** (updating `eas.json`):

1. Your `eas.json` already has the correct values
2. It's simple and version-controlled
3. Rebuilds are necessary anyway for code changes

## Quick Rebuild Command

When you need to update environment variables:

```bash
# Rebuild with updated environment variables
eas build --platform ios --profile production

# Or for faster local testing
eas build --platform ios --profile preview --local
```

## Current Configuration Status

Your `eas.json` is already correctly configured:
- ✅ All profiles have correct Supabase URL
- ✅ All profiles have correct anon key
- ✅ Production profile includes `NODE_ENV=production`

**No changes needed** - just rebuild when you want to deploy!

## Summary

**You cannot update environment variables without rebuilding.** This is by design - environment variables are compiled into the app binary for security and performance reasons.

The fastest way to update them:
1. Edit `eas.json` (if needed)
2. Run `eas build --platform ios --profile production`
3. Wait for build to complete (~10-20 minutes)
4. Submit to TestFlight

