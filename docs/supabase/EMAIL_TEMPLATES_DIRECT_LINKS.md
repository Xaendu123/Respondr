# Email Templates with Direct Deep Links

This guide shows how to configure Supabase email templates to use direct deep links that skip browser redirects.

## Overview

Instead of having Supabase redirect through a browser (`https://project.supabase.co/auth/v1/verify` → `respondr://...`), you can configure email templates to link directly to your app with a token hash. This provides:

- ✅ **Faster user experience** (no browser redirect)
- ✅ **Complete control in your app**
- ✅ **Works offline** after link is clicked
- ✅ **Simpler flow** for users

## Email Template Configuration

### Step 1: Update Supabase Email Templates

Go to **Authentication → Email Templates** in your Supabase Dashboard.

#### Confirm Signup Template

Replace the default template with:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your email:</p>
<p><a href="respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>

<p style="font-size: 13px; color: #6b7280;">
  If the button doesn't work, copy and paste this link into your browser:
  respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup
</p>

<p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
  This link will expire in 1 hour.
</p>
```

#### Password Reset Template

Replace the default template with:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="respondr://auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>

<p style="font-size: 13px; color: #6b7280;">
  If the button doesn't work, copy and paste this link into your browser:
  respondr://auth/confirm?token_hash={{ .TokenHash }}&type=recovery
</p>

<p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
  This link will expire in 1 hour.
</p>
```

### Step 2: Template Variables

**Available variables:**
- `{{ .TokenHash }}` - The hashed token for verification (required for direct links)
- `{{ .Token }}` - 6-digit OTP code (alternative, not used for direct links)
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .RedirectTo }}` - The redirect URL passed to the auth function

**Important:** Use `{{ .TokenHash }}` (not `{{ .Token }}`) for direct deep links.

### Step 3: Supabase Dashboard Configuration

Ensure your redirect URLs are whitelisted:

1. Go to **Authentication → URL Configuration**
2. **Site URL**: `respondr://` (or your website URL)
3. **Redirect URLs** (Additional Redirect URLs): Add:
   ```
   respondr://*
   respondr://auth/confirm
   respondr://auth-callback
   respondr://reset-password
   ```

## How It Works

### Flow Comparison

**Old Method (Browser Redirect):**
1. User clicks: `https://project.supabase.co/auth/v1/verify?token=...&redirect_to=respondr://reset-password`
2. Browser opens → Supabase verifies token → Redirects to `respondr://reset-password#access_token=...&refresh_token=...`
3. App receives deep link with tokens in hash
4. App extracts tokens and calls `setSession()`

**New Method (Direct Link):**
1. User clicks: `respondr://auth/confirm?token_hash=...&type=recovery`
2. App opens directly (no browser)
3. App extracts `token_hash` from query params
4. App calls `verifyOtp({ token_hash, type: 'recovery' })` to get session

### Code Implementation

The app's deep link handler (`app/_layout.tsx`) checks for direct confirmation links:

```typescript
// Check for direct confirmation link
if (url.includes('auth/confirm') || url.includes('/auth/confirm')) {
  const urlObj = new URL(url);
  const tokenHash = urlObj.searchParams.get('token_hash');
  const type = urlObj.searchParams.get('type');
  
  // Exchange token_hash for session
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type === 'recovery' ? 'recovery' : 'email',
  });
  
  if (data?.session) {
    // Session created - navigate appropriately
    if (type === 'recovery') {
      router.replace('/reset-password');
    } else {
      router.replace('/(tabs)/logbook');
    }
  }
}
```

## Type Parameter Values

The `type` parameter in the deep link determines the flow:

- `type=signup` - Email confirmation after signup
- `type=recovery` - Password reset flow
- `type=email` - General email verification (can be used as fallback)
- `type=invite` - User invitation (if using invites)
- `type=magiclink` - Magic link login (if using passwordless auth)

## Testing

### Test Direct Confirmation Link

1. **Request password reset** or **sign up** to trigger email
2. **Check email** - link should be: `respondr://auth/confirm?token_hash=...&type=...`
3. **Click link** on device
4. **App should open** directly (no browser)
5. **Check console logs** for:
   - `=== DIRECT AUTH CONFIRMATION LINK ===`
   - `=== EXTRACTED DIRECT CONFIRMATION TOKENS ===`
   - `=== VERIFYING DIRECT CONFIRMATION TOKEN ===`
   - `=== DIRECT CONFIRMATION SUCCESS ===`

### Simulate Direct Link (Development)

**iOS Simulator:**
```bash
xcrun simctl openurl booted "respondr://auth/confirm?token_hash=test123&type=signup"
```

**Android Emulator:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "respondr://auth/confirm?token_hash=test123&type=signup" ch.respondr.app
```

## Troubleshooting

### Link Doesn't Open App

**Issue:** Clicking email link doesn't open the app

**Solutions:**
1. Verify `scheme: "respondr"` is set in `app.json`
2. Check Android `intentFilters` includes `respondr://` scheme
3. Ensure app is installed on device
4. Try copying link and pasting in Notes app, then tap it
5. For email clients that don't support deep links, provide fallback instructions

### Token Hash Not Found

**Issue:** Logs show "NO TOKEN HASH IN DIRECT CONFIRMATION LINK"

**Solutions:**
1. Verify email template uses `{{ .TokenHash }}` (not `{{ .Token }}`)
2. Check template is saved correctly in Supabase Dashboard
3. Verify URL format: `respondr://auth/confirm?token_hash=...&type=...`
4. Check that `token_hash` parameter exists in the URL

### Verification Fails

**Issue:** `verifyOtp()` returns error

**Solutions:**
1. Check token hasn't expired (1 hour default)
2. Verify `type` parameter matches the flow (signup, recovery, etc.)
3. Check Supabase logs for detailed error
4. Ensure redirect URLs are whitelisted in Supabase Dashboard
5. Try requesting a new email/reset link

### Both Methods Supported

The app supports both methods:
- **Direct links**: `respondr://auth/confirm?token_hash=...&type=...` (new method)
- **Redirect links**: `respondr://reset-password#access_token=...&refresh_token=...` (old method)

This allows you to migrate gradually or use different methods for different flows.

## Benefits of Direct Links

1. **Faster**: No browser redirect delay
2. **Better UX**: App opens directly, feels more native
3. **Offline Support**: Token can be processed offline after link is clicked
4. **Complete Control**: All logic stays in your app
5. **Simpler**: One less redirect step to handle

## When to Use Each Method

**Use Direct Links (Recommended):**
- Email confirmation
- Password reset
- User invitations
- Magic link login

**Use Redirect Links:**
- OAuth providers (Google, Apple, etc.) - these require browser
- When you need to show intermediate web page
- Legacy compatibility

## Security Considerations

1. **Token Expiration**: Direct links use the same 1-hour expiration as redirect links
2. **One-Time Use**: Tokens are single-use (Supabase handles this)
3. **HTTPS in Email**: Email should still be sent over HTTPS
4. **URL Validation**: App validates token format before calling `verifyOtp()`
5. **Error Handling**: Invalid/expired tokens show user-friendly error messages

## Next Steps

1. Update email templates in Supabase Dashboard
2. Test with real signup/password reset emails
3. Monitor logs to ensure direct links work correctly
4. Update any documentation that references the old redirect flow
5. Consider migrating other auth flows to direct links

