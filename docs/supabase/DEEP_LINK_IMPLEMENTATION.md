# Supabase Deep Link Implementation Guide

This document explains how deep linking is configured for Supabase authentication flows (password reset, email confirmation, OAuth) in the Respondr app.

## Overview

When users click links in Supabase authentication emails (password reset, email confirmation), Supabase redirects to your app with authentication tokens. The app must:

1. **Intercept the deep link** when the app is opened
2. **Extract tokens** from the URL (either in hash fragment or query params)
3. **Exchange tokens for session** using Supabase's `setSession()` or `verifyOtp()` methods
4. **Navigate to appropriate screen** based on the flow type

## Configuration

### 1. Supabase Dashboard Configuration

**Required Settings:**
- Go to **Authentication → URL Configuration** in Supabase Dashboard
- **Site URL**: Set to `respondr://` (your custom URL scheme)
- **Redirect URLs** (Additional Redirect URLs): Add these patterns:
  ```
  respondr://reset-password
  respondr://auth-callback
  respondr://confirm-email
  respondr://*
  ```

**Why `respondr://*`?**
- The wildcard pattern `*` allows any path after `respondr://`
- This ensures all deep links work, regardless of the exact path
- Supabase may redirect to different paths depending on the flow

### 2. App Configuration

#### iOS (app.json)
Already configured with:
```json
{
  "scheme": "respondr"
}
```

This automatically adds `CFBundleURLSchemes` to `Info.plist`.

#### Android (app.json)
Intent filters are configured for:
- **Universal Links**: `https://respondr.ch/*` (for App Links)
- **Custom Scheme**: `respondr://*` (for custom URL scheme deep links)

### 3. Supabase Client Configuration

In `src/config/supabase.ts`:
```typescript
{
  auth: {
    flowType: 'pkce', // PKCE flow for better mobile security
    detectSessionInUrl: false, // We handle manually for better control
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  }
}
```

**Why `detectSessionInUrl: false`?**
- We handle URL detection manually in `app/_layout.tsx` for better control
- This allows us to handle different URL formats and flow types explicitly
- Gives us more control over error handling and navigation

**Why `flowType: 'pkce'`?**
- PKCE (Proof Key for Code Exchange) is more secure for mobile apps
- Recommended by Supabase for mobile applications
- Prevents certain types of attacks compared to implicit flow

## Deep Link Flow

### Password Reset Flow

1. **User requests password reset** → Supabase sends email
2. **Email contains link**: `https://[project].supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=respondr://reset-password`
3. **User clicks link** → Browser opens → Supabase verifies token → Redirects to `respondr://reset-password#access_token=...&refresh_token=...&type=recovery`
4. **App receives deep link** → `app/_layout.tsx` handles it
5. **Extract tokens** from URL hash fragment
6. **Call `supabase.auth.setSession()`** with tokens
7. **Navigate to `/reset-password`** screen
8. **User enters new password** → Call `supabase.auth.updateUser({ password: newPassword })`

### Email Confirmation Flow

1. **User signs up** → Supabase sends confirmation email
2. **Email contains link**: `https://[project].supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=respondr://auth-callback`
3. **User clicks link** → Browser opens → Supabase verifies → Redirects to `respondr://auth-callback#access_token=...&refresh_token=...&type=signup`
4. **App receives deep link** → Extract tokens → Set session → Navigate to home

### Token Extraction Methods

The app handles multiple token formats:

#### Method 1: Tokens in URL Hash (Preferred)
```
respondr://reset-password#access_token=eyJ...&refresh_token=eyJ...&type=recovery
```
- Tokens are in the hash fragment (after `#`)
- Parse with: `new URLSearchParams(urlObj.hash.substring(1))`
- Use `supabase.auth.setSession({ access_token, refresh_token })`

#### Method 2: Token Hash in Query Params (PKCE Flow)
```
respondr://reset-password?token_hash=abc123&type=recovery
```
- Token hash is in query params
- Use `supabase.auth.verifyOtp({ token_hash, type: 'recovery' })`
- This exchanges the hash for a session

#### Method 3: Raw Token in Query (Fallback)
```
respondr://reset-password?token=abc123&type=recovery
```
- Less common, typically happens if verification URL is used directly
- May need to wait for Supabase to process it asynchronously
- Check for session after a short delay

## Code Implementation

### Deep Link Handler (`app/_layout.tsx`)

The `handleDeepLink` function in `app/_layout.tsx`:

1. **Ignores Expo dev URLs** (`exp://`)
2. **Checks for password reset links** (`reset-password` or `type=recovery`)
3. **Checks for email confirmation links** (`confirm`, `verify`, `type=signup`, `type=email`)
4. **Extracts tokens** using multiple methods
5. **Sets session** using appropriate Supabase method
6. **Navigates** to the correct screen
7. **Handles errors** gracefully with user-friendly messages

### Key Functions

```typescript
// Extract tokens from URL hash
const hash = urlObj.hash.substring(1);
const hashParams = new URLSearchParams(hash);
const accessToken = hashParams.get('access_token');
const refreshToken = hashParams.get('refresh_token');

// Set session
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken,
});

// Or verify OTP (for token_hash)
await supabase.auth.verifyOtp({
  token_hash: tokenHash,
  type: 'recovery',
});
```

## Testing

### Development Testing

1. **Start the app** in development mode
2. **Request password reset** or **sign up** to trigger email
3. **Click link in email** (may need to copy/paste in some email clients)
4. **Check console logs** for token extraction messages:
   - `=== EXTRACTED TOKENS ===`
   - `=== SETTING SESSION FROM TOKENS ===`
   - `=== SESSION SET SUCCESSFULLY ===`

### TestFlight Testing

For TestFlight builds (production):
- **Use in-app debug screen** (if implemented) to view logs
- **Or use Xcode Device Console** (if on Mac)
- **Or implement Sentry** for remote log viewing

### Simulating Deep Links

#### iOS Simulator
```bash
xcrun simctl openurl booted "respondr://reset-password#access_token=test&refresh_token=test&type=recovery"
```

#### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "respondr://reset-password#access_token=test&refresh_token=test&type=recovery" ch.respondr.app
```

## Troubleshooting

### Tokens Not Found in URL

**Symptoms:**
- Logs show `=== NO TOKENS FOUND ===`
- User sees "Invalid link" error

**Possible Causes:**
1. **Redirect URLs not whitelisted** in Supabase Dashboard
2. **Browser strips hash fragment** when redirecting to custom scheme
3. **Supabase using different URL format** (check email link format)

**Solutions:**
1. Verify redirect URLs are added to Supabase Dashboard
2. Check if `token_hash` is in query params instead
3. Use `verifyOtp()` method if `token_hash` is available
4. Check Supabase email template format

### Session Not Set

**Symptoms:**
- Tokens extracted successfully
- `setSession()` called but no session created
- User still not authenticated

**Possible Causes:**
1. **Tokens expired** (reset links expire after 1 hour)
2. **Invalid token format** (check token length/format)
3. **Network error** during session setting

**Solutions:**
1. Request a new reset link
2. Check network connectivity
3. Verify Supabase project credentials are correct
4. Check Supabase logs for errors

### App Doesn't Open from Email Link

**Symptoms:**
- Clicking email link opens browser instead of app
- Or shows "Can't open page" error

**Possible Causes:**
1. **App not installed** (should show App Store link)
2. **URL scheme not registered** correctly
3. **Email client doesn't support deep links**

**Solutions:**
1. Verify app is installed on device
2. Check `app.json` has correct `scheme` value
3. Try copying link and pasting in Notes app, then tapping
4. For production, consider Universal Links (iOS) / App Links (Android)

## Security Considerations

1. **Never log tokens** in production (they're in logs for debugging only)
2. **Tokens expire** after 1 hour (handle expired token errors gracefully)
3. **Use PKCE flow** (`flowType: 'pkce'`) for better security
4. **Validate token format** before using (check not null/undefined)
5. **Handle errors securely** (don't expose sensitive info to users)

## Best Practices

1. **Always set `flowType: 'pkce'`** for mobile apps
2. **Handle multiple token formats** (hash, token_hash, raw token)
3. **Provide clear error messages** to users
4. **Show loading state** while processing deep links
5. **Test on both iOS and Android** (deep linking can behave differently)
6. **Test with app closed, backgrounded, and foregrounded**

## Additional Resources

- [Supabase Mobile Deep Linking Guide](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [React Native Deep Linking](https://reactnative.dev/docs/linking)

