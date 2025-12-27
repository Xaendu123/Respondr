# Database Migration Checklist

## ✅ Configuration Status

### New Database (nbdmoapoiqxyjrrhzqvg)
- **Status**: ACTIVE_HEALTHY ✅
- **Region**: eu-central-2
- **URL**: `https://nbdmoapoiqxyjrrhzqvg.supabase.co`
- **Connection Test**: ✅ Working

### Configuration Files
- ✅ `eas.json` - All profiles point to new database
- ✅ `src/config/supabase.ts` - Uses environment variables
- ✅ No hardcoded old database URLs in code

## ⚠️ Important: TestFlight Build Issue

**Problem**: TestFlight build shows "network request failed" with new database, but works with old database.

**Root Cause**: The TestFlight build was created BEFORE the database migration, so it has the old database URL (`mryretaoanuuwruhjdvn`) hardcoded in the binary.

**Solution**: You MUST rebuild the app for TestFlight with the new database configuration.

## 🔧 Steps to Fix

### 1. Verify Configuration
```bash
# Check eas.json has correct database URL
cat eas.json | grep SUPABASE_URL
# Should show: https://nbdmoapoiqxyjrrhzqvg.supabase.co
```

### 2. Rebuild for TestFlight
```bash
# Build new version for production/TestFlight
eas build --platform ios --profile production
```

### 3. Submit to TestFlight
```bash
# After build completes, submit to App Store Connect
eas submit --platform ios --profile production
```

### 4. Verify in TestFlight
- Install the new build
- Test network connectivity
- Should now connect to new database

## 📋 Migration Verification

### Code Configuration ✅
- [x] `eas.json` has new database URL for all profiles
- [x] No hardcoded old database URLs in source code
- [x] Environment variables correctly configured

### Database Status ✅
- [x] New database is ACTIVE_HEALTHY
- [x] Connection test successful
- [x] API keys match configuration

### Build Status ⚠️
- [ ] **NEW BUILD REQUIRED** - Current TestFlight build has old database URL
- [ ] Rebuild with new configuration
- [ ] Test in TestFlight after rebuild

## 🔍 Why This Happens

When you build an app with EAS Build:
1. Environment variables from `eas.json` are baked into the binary at build time
2. If you change the database URL AFTER building, the old URL is still in the binary
3. You must rebuild to get the new URL into the app

## ✅ Next Steps

1. **Rebuild the app** with the new database configuration
2. **Submit to TestFlight** with the new build
3. **Test** that network requests work with the new database
4. **Deactivate old database** once confirmed working

## 📝 Notes

- The new database is working correctly (connection test passed)
- The issue is that the TestFlight build has the old database URL
- Rebuilding will fix the issue
- All code is already configured correctly for the new database

