# Supabase Password Reset Setup

This guide explains how to configure Supabase for password reset emails that redirect to your app via deep link.

## Required Supabase Configuration

### 1. Configure Redirect URLs

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

#### Add Redirect URLs

Add these URLs to the **Redirect URLs** list:

```
respondr://reset-password
respondr://auth-callback
```

**For production, also add:**
```
https://respondr.ch/reset-password
https://respondr.ch/auth-callback
```

#### Site URL

Set the **Site URL** to:
```
respondr://
```

Or if you have a web fallback:
```
https://respondr.ch
```

### 2. Update Email Template

1. Navigate to **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Copy the HTML from `supabase/email-templates/password-reset.html`
4. Paste it into the **HTML** field
5. Click **Save**

**Important:** The template uses `{{ .ConfirmationURL }}` which Supabase automatically replaces with the verification URL that includes your redirect.

### 3. Email Settings

1. Navigate to **Authentication** → **Email Templates**
2. Ensure **Enable email confirmations** is enabled (if using email confirmation)
3. Check that **Enable email change confirmations** is configured as needed

### 4. Verify Redirect URL in Code

The `resetPassword` function in `src/services/supabase/authService.ts` should have:

```typescript
redirectTo: 'respondr://reset-password'
```

This is already configured correctly.

## How It Works

### Flow

1. **User requests password reset** → `resetPassword()` is called with `redirectTo: 'respondr://reset-password'`
2. **Supabase sends email** → Email contains link to Supabase verification page
3. **User clicks link** → Opens Supabase verification page in browser
4. **Supabase verifies token** → Redirects to `respondr://reset-password?token=...&type=recovery`
5. **App opens** → Deep link handler in `app/_layout.tsx` catches the URL
6. **User navigated** → Taken to `/reset-password` screen
7. **Password reset** → User enters new password and submits

### URL Format

The redirect URL from Supabase will look like:
```
respondr://reset-password?token=abc123&type=recovery
```

Or if using Supabase's verification page first:
```
https://[project].supabase.co/auth/v1/verify?token=abc123&type=recovery&redirect_to=respondr://reset-password
```

## Testing

### Test Password Reset Flow

1. **Request reset** from login screen
2. **Check email** for reset link
3. **Click link** → Should open app (if installed) or browser
4. **If browser opens** → Should redirect to app after verification
5. **App opens** → Should show reset password screen
6. **Enter new password** → Should update and redirect to login

### Test Deep Link Directly

You can test the deep link directly:

**⚠️ Important: Expo Go Limitation**

**Custom URL schemes like `respondr://` do NOT work in Expo Go.** Expo Go only supports `exp://` links. 

**To test in Expo Go, use one of these methods:**

**Method 1: Test Programmatically (Recommended)**
Add this temporarily to any screen to test the deep link handler:
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Test button
<TouchableOpacity onPress={() => {
  router.push({
    pathname: '/reset-password',
    params: { url: 'respondr://reset-password?token=test&type=recovery' },
  });
}}>
  <Text>Test Reset Password</Text>
</TouchableOpacity>
```

**Method 2: Navigate Directly**
Simply navigate to the reset password screen:
```typescript
router.push('/reset-password');
```

**Method 3: Use Development Build**
For full deep link testing, use a development build:
```bash
npx expo run:ios
# or
npx expo run:android
```

Then test with:
```
respondr://reset-password?token=test&type=recovery
```

See `docs/testing/TESTING_DEEP_LINKS_EXPO_GO.md` for detailed testing instructions.

**Alternative - Use Expo's Linking API:**
In your Metro bundler terminal, you can also test by opening the link programmatically:
```javascript
// In a component or console
import * as Linking from 'expo-linking';
Linking.openURL('respondr://reset-password?token=test&type=recovery');
```

**iOS Simulator:**
```bash
xcrun simctl openurl booted "respondr://reset-password?token=test&type=recovery"
```

**Android Emulator:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "respondr://reset-password?token=test&type=recovery" ch.respondr.app
```

**Physical Device (iOS):**
- Create a note with the URL and tap it
- Or use Safari: Type `respondr://reset-password?token=test` in address bar

**Physical Device (Android):**
- Create a note with the URL and tap it
- Or use ADB: `adb shell am start -W -a android.intent.action.VIEW -d "respondr://reset-password?token=test&type=recovery"`

## Troubleshooting

### Link Doesn't Open App

1. **Check redirect URLs** are added in Supabase dashboard
2. **Verify app scheme** matches `respondr://` in `app.json`
3. **Check deep link handler** in `app/_layout.tsx` handles `reset-password`
4. **Test on physical device** (simulators sometimes have issues)

### Email Not Sending

1. **Check Supabase email settings** → Authentication → Email Templates
2. **Verify SMTP configuration** (if using custom SMTP)
3. **Check spam folder**
4. **Verify email address** is correct

### Redirect URL Not Working

1. **Ensure redirect URL is whitelisted** in Supabase dashboard
2. **Check `redirectTo` parameter** in `resetPassword()` function
3. **Verify URL format** matches exactly (no trailing slash)
4. **Check Supabase logs** for redirect errors

### Token Expired

- Password reset tokens expire after 1 hour
- User needs to request a new reset link
- This is a security feature, not a bug

## Additional Configuration

### Custom SMTP (Optional)

If you want to use your own email service:

1. Navigate to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider
3. Test email sending

### Email Rate Limiting

Supabase has rate limits on emails:
- Default: 4 emails per hour per user
- Can be adjusted in project settings

### Multi-language Support

If you need different email templates per language:

1. Create separate templates in Supabase dashboard
2. Configure language detection in your app
3. Use Supabase's language parameter (if supported)

## Security Considerations

1. **Token expiration** - Tokens expire after 1 hour
2. **One-time use** - Tokens can only be used once
3. **HTTPS required** - Production redirects should use HTTPS
4. **URL validation** - Supabase validates redirect URLs against whitelist

## Summary Checklist

- [ ] Added `respondr://reset-password` to Redirect URLs in Supabase
- [ ] Added `respondr://auth-callback` to Redirect URLs (for OAuth)
- [ ] Set Site URL in Supabase
- [ ] Updated Reset Password email template in Supabase dashboard
- [ ] Tested password reset flow end-to-end
- [ ] Verified deep link opens app correctly
- [ ] Tested on both iOS and Android

## Related Files

- `src/services/supabase/authService.ts` - Password reset function
- `app/reset-password.tsx` - Reset password screen
- `app/_layout.tsx` - Deep link handler
- `supabase/email-templates/password-reset.html` - Email template
- `app.json` - App scheme configuration

