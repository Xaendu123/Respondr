# Network Request Failed - Diagnosis Guide

## Issue
TestFlight build shows "network request failed" with new database (`nbdmoapoiqxyjrrhzqvg`), but works with old database.

## Database Status
- **New Database**: `nbdmoapoiqxyjrrhzqvg` - ACTIVE_HEALTHY ✅
- **Region**: eu-central-2 (new) vs eu-west-1 (old)
- **API Logs**: Show successful requests (signup working)

## Possible Causes

### 1. Region-Specific Network Issues
- **New region**: eu-central-2
- **Old region**: eu-west-1
- Different network routing or latency
- **Fix Applied**: Added 30-second timeout and better error handling

### 2. iOS App Transport Security (ATS)
- ATS might be stricter for new domain
- **Fix Applied**: Added ATS exception for `supabase.co` with subdomains

### 3. Network Timeout
- New region might have higher latency
- Default timeout might be too short
- **Fix Applied**: Custom fetch with 30-second timeout

### 4. DNS/Network Routing
- New database domain might have different DNS propagation
- Network routing differences between regions
- **Check**: Test from different networks/devices

## Fixes Applied

### 1. Custom Fetch with Timeout
```typescript
// Added 30-second timeout
// Better error messages for network failures
// Proper abort handling
```

### 2. Enhanced Error Handling
- More descriptive error messages
- Connection test on startup (production)
- Better logging for debugging

### 3. ATS Configuration
- Exception for `supabase.co` domain
- Includes all subdomains
- TLS 1.2 minimum

## Testing Steps

1. **Rebuild the app** with these fixes:
   ```bash
   eas build --platform ios --profile production
   ```

2. **Test in TestFlight**:
   - Install new build
   - Check console logs for connection test
   - Try signup/login
   - Monitor network requests

3. **Check Logs**:
   - Look for "Supabase connection test failed" in logs
   - Check error messages for specific failure reason
   - Verify URL and key are present

## Debugging

If issue persists, check:

1. **Network Connectivity**:
   - Test on different networks (WiFi vs cellular)
   - Check if other apps can connect
   - Verify device has internet

2. **Supabase Dashboard**:
   - Check project status
   - Verify API is accessible
   - Check for any rate limiting

3. **Console Logs**:
   - Look for detailed error messages
   - Check if timeout is being hit
   - Verify configuration is loaded

## Next Steps

1. Rebuild with fixes
2. Test in TestFlight
3. If still failing, check console logs for specific error
4. Consider testing from different network/location

## Region Comparison

| Feature | Old (eu-west-1) | New (eu-central-2) |
|---------|----------------|-------------------|
| Region | Ireland | Frankfurt |
| Status | (Paused) | ACTIVE_HEALTHY |
| Network | Working | Needs testing |
| Latency | Lower (if in EU) | May vary |

The region change might affect network routing, especially if users are in different geographic locations.

