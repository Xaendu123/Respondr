# Email Deep Link Configuration

To ensure Supabase emails include authentication tokens in the redirect URLs, you need to configure the redirect URLs in your Supabase project settings.

## Required Configuration

### 1. Configure Redirect URLs in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration** (or **Settings** → **Auth** → **URL Configuration**)
4. You'll see two important settings:

#### Site URL
- Set this to your app's deep link scheme: `respondr://`
- Or set it to your website URL if you have one (e.g., `https://respondr.ch`)

#### Redirect URLs (Additional Redirect URLs / Allowed Redirect URLs)
Add the following URLs to the whitelist:

```
respondr://reset-password
respondr://auth-callback
respondr://confirm-email
```

**Important:** You can add multiple URLs, one per line, or comma-separated depending on the interface.

### 2. How Supabase Redirects Work

When a user clicks a link in an email:

1. **Email Link**: `https://mryretaoanuuwruhjdvn.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=respondr://reset-password`
2. **Supabase Verifies**: Supabase verifies the token
3. **Redirect with Tokens**: Supabase redirects to your app with tokens in the URL hash:
   ```
   respondr://reset-password#access_token=eyJ...&refresh_token=eyJ...&type=recovery&expires_in=3600
   ```

The tokens are only included if the `redirect_to` URL is whitelisted in your Supabase project settings.

## For Password Reset

The `redirectTo` in your code should match what's in the whitelist:

```typescript
// src/services/supabase/authService.ts
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: 'respondr://reset-password', // Must be whitelisted in Supabase
  });
  // ...
};
```

## For Email Confirmation

By default, Supabase uses the Site URL as the redirect. To use a custom deep link, you can:

1. **Option 1**: Set Site URL to your deep link scheme
2. **Option 2**: Don't specify `emailRedirectTo` in `signUp()` - Supabase will use Site URL
3. **Option 3**: Specify it explicitly (must be whitelisted):

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: 'respondr://auth-callback', // Must be whitelisted
  },
});
```

## Verification Steps

1. **Check Current Settings**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Note the current Site URL and Redirect URLs

2. **Test the Flow**:
   - Request a password reset
   - Check the email link format
   - Click the link and check if the app receives tokens in the URL

3. **Check Console Logs**:
   - The app logs should show: `=== EXTRACTED TOKENS ===` with `hasAccessToken: true`
   - If tokens are missing, the redirect URL isn't whitelisted

## Common Issues

### Issue: Tokens not in redirect URL
**Solution**: The redirect URL must be added to the "Redirect URLs" whitelist in Supabase Dashboard

### Issue: "Invalid redirect URL" error
**Solution**: 
- Check that the URL exactly matches what's in the whitelist
- No trailing slashes
- Exact scheme match (e.g., `respondr://` not `Respondr://`)

### Issue: Email link goes to web browser instead of app
**Solution**: 
- This is normal for email links - the browser opens first
- The browser then redirects to your app via the deep link
- Make sure your app's deep link scheme is registered in `app.json`

## Dashboard Paths (Supabase UI)

- **Authentication Settings**: Dashboard → Project → Authentication → Settings
- **URL Configuration**: Dashboard → Project → Authentication → URL Configuration
- **Email Templates**: Dashboard → Project → Authentication → Email Templates

## Mobile Deep Linking

For mobile apps, Supabase will:
1. Include tokens in the URL hash (fragment) after `#`
2. Your app extracts these tokens using `URLSearchParams` on the hash
3. Use `supabase.auth.setSession()` to establish the session

The code in `app/_layout.tsx` and `app/reset-password.tsx` handles this extraction automatically.

