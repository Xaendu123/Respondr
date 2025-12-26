# Email Token Issue Solution

## The Problem

When clicking email links (password reset, email confirmation), Supabase redirects to your app's deep link, but the tokens (`access_token`, `refresh_token`) may not be included in the URL hash for custom URL schemes on mobile.

## Root Cause

For mobile apps with custom URL schemes (like `respondr://`), when Supabase redirects from the verification endpoint to your app, the browser-to-app redirect may not preserve the hash fragment containing tokens.

## Solutions

### Solution 1: Use token_hash in Email Templates (Recommended for PKCE Flow)

Instead of relying on tokens in the redirect URL, use `token_hash` in your email templates and handle verification in the app.

**Update your email templates to include `token_hash`:**

For password reset template, you could modify it to:
```html
<a href="respondr://reset-password?token_hash={{ .TokenHash }}&type=recovery">
  Reset Password
</a>
```

Then in your app, extract `token_hash` and use `supabase.auth.verifyOtp()`:
```typescript
const tokenHash = urlObj.searchParams.get('token_hash');
if (tokenHash) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  });
  // Session is created automatically
}
```

**Note:** The default `{{ .ConfirmationURL }}` from Supabase already includes the verification URL that goes through Supabase's endpoint first. For direct deep links, you'd need to construct custom URLs.

### Solution 2: Keep Using Default ConfirmationURL (Current Approach)

The default `{{ .ConfirmationURL }}` creates a link like:
```
https://your-project.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=respondr://reset-password
```

When clicked:
1. Browser opens Supabase's verify endpoint
2. Supabase verifies the token
3. Supabase redirects to `respondr://reset-password`
4. **Problem:** The redirect may not include tokens in the hash

**Current Code Solution:**
The code in `app/_layout.tsx` now:
- Checks for tokens in URL hash first
- If not found, checks for `token_hash` in query params
- Uses `verifyOtp()` if `token_hash` is found
- Falls back to waiting for session if only `token` is found

### Solution 3: Use a Web Intermediate Page (Most Reliable)

Create a web page that handles the verification, then redirects to your app:

1. **Email template:**
```html
<a href="https://your-domain.com/verify?token={{ .TokenHash }}&type=recovery">
  Reset Password
</a>
```

2. **Web page** (`/verify`):
   - Calls `supabase.auth.verifyOtp()` server-side
   - Gets session tokens
   - Redirects to app: `respondr://reset-password#access_token=...&refresh_token=...`

## Testing

To test which approach works:

1. **Check console logs** when clicking email link:
   - Look for `=== EXTRACTED TOKENS ===` to see if tokens are in hash
   - Look for `=== CHECKING FOR TOKEN HASH OR TOKEN ===` to see what's available

2. **Test with real email:**
   - Request password reset
   - Click link in email
   - Check app logs to see what URL format is received

3. **Check Supabase Dashboard:**
   - Go to Authentication → URL Configuration
   - Verify redirect URLs are exactly: `respondr://reset-password`, `respondr://auth-callback`, etc.
   - No trailing slashes, exact match

## Current Implementation

The code now handles:
- ✅ Tokens in URL hash (if Supabase includes them)
- ✅ `token_hash` in query params (using `verifyOtp()`)
- ✅ Fallback to wait for session (for async verification)
- ✅ Comprehensive logging for debugging

## Next Steps

1. **Test the current implementation** with a real password reset email
2. **Check the console logs** to see what format the URL actually has
3. **If tokens are still missing**, consider Solution 3 (web intermediate page) for the most reliable approach

## Reference

- [Supabase Mobile Deep Linking Guide](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

