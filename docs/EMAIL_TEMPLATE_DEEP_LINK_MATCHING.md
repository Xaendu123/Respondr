# Email Template to Deep Link Handler Matching

## Overview

This document verifies that the deep link handling logic matches what the Supabase email templates send.

## Email Template Configuration

### Signup Confirmation Email

**Auth Service Configuration:**
```typescript
emailRedirectTo: 'respondr://auth/confirm'
```

**Email Template Options:**

**Option 1: Using `{{ .ConfirmationURL }}` (Default)**
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```
**Result URL:** 
```
https://nbdmoapoiqxyjrrhzqvg.supabase.co/auth/v1/verify?token_hash=...&type=signup&redirect_to=respondr://auth/confirm
```
**After Supabase verification, redirects to:**
```
respondr://auth/confirm#access_token=...&refresh_token=...&type=signup
```

**Option 2: Using Custom Template with `{{ .RedirectTo }}` and `{{ .TokenHash }}`**
```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```
**Result URL:**
```
respondr://auth/confirm?token_hash=...&type=signup
```

### Password Reset Email

**Auth Service Configuration:**
```typescript
redirectTo: 'respondr://auth/confirm'
```

**Email Template Options:**

**Option 1: Using `{{ .ConfirmationURL }}` (Default)**
```html
<a href="{{ .ConfirmationURL }}">Reset your password</a>
```
**Result URL:**
```
https://nbdmoapoiqxyjrrhzqvg.supabase.co/auth/v1/verify?token_hash=...&type=recovery&redirect_to=respondr://auth/confirm
```
**After Supabase verification, redirects to:**
```
respondr://auth/confirm#access_token=...&refresh_token=...&type=recovery
```

**Option 2: Using Custom Template**
```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```
**Result URL:**
```
respondr://auth/confirm?token_hash=...&type=recovery
```

### Password Changed Confirmation

**After password reset, Supabase may redirect to:**
```
respondr://password-changed
```
or
```
respondr://login
```

## Deep Link Handler Implementation

### Current Handler (`app/_layout.tsx`)

The handler supports **both** URL formats:

#### 1. Session Tokens in Hash (from `{{ .ConfirmationURL }}`)
```typescript
// Handles: respondr://auth/confirm#access_token=...&refresh_token=...&type=signup
if (accessToken && refreshToken) {
  await supabase.auth.setSession({ access_token, refresh_token });
  // Navigate to home
}
```

#### 2. Token Hash in Query Params (from custom template)
```typescript
// Handles: respondr://auth/confirm?token_hash=...&type=signup
if (tokenHash) {
  await supabase.auth.verifyOtp({ token_hash, type: 'signup' });
  // Navigate to home
}
```

#### 3. Password Reset
```typescript
// Handles: respondr://auth/confirm?token_hash=...&type=recovery
// OR: respondr://auth/confirm#access_token=...&refresh_token=...&type=recovery
if (tokenHash && type === 'recovery') {
  await supabase.auth.verifyOtp({ token_hash, type: 'recovery' });
  // Navigate to /reset-password
}
```

#### 4. Password Changed
```typescript
// Handles: respondr://password-changed
if (url.includes('password-changed')) {
  router.replace('/login');
}
```

## Verification Checklist

✅ **Email Confirmation (Signup)**
- [x] Handler supports `#access_token=...&refresh_token=...` format
- [x] Handler supports `?token_hash=...&type=signup` format
- [x] Uses `verifyOtp` with type `'signup'` for token_hash
- [x] Verifies email is confirmed
- [x] Navigates to home after successful verification

✅ **Password Reset**
- [x] Handler supports `#access_token=...&refresh_token=...` format
- [x] Handler supports `?token_hash=...&type=recovery` format
- [x] Uses `verifyOtp` with type `'recovery'` for token_hash
- [x] Creates session for password reset
- [x] Navigates to `/reset-password` screen

✅ **Password Changed**
- [x] Handler detects `password-changed` deep link
- [x] Redirects to `/login` screen

## Recommended Email Template Configuration

### For Signup Confirmation

**Recommended:** Use custom template with `{{ .RedirectTo }}` and `{{ .TokenHash }}` for direct deep linking:
```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

**Alternative:** Use `{{ .ConfirmationURL }}` if you want Supabase to handle verification server-side first (works but adds extra redirect):
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

### For Password Reset

**Recommended:** Use custom template:
```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```

**Alternative:** Use `{{ .ConfirmationURL }}`:
```html
<a href="{{ .ConfirmationURL }}">Reset your password</a>
```

## Current Status

✅ **All deep link formats are supported by the handler**

The handler correctly processes:
1. Direct session tokens (from `{{ .ConfirmationURL }}`)
2. Token hash verification (from custom templates)
3. Both signup and recovery types
4. Password changed confirmation

## Handler Order & Logic

The deep link handler processes URLs in this order:

1. **Email Confirmation Handler** (for `type=signup` or `type=email`)
   - Matches: `respondr://auth/confirm?token_hash=...&type=signup`
   - Matches: `respondr://auth/confirm#access_token=...&type=signup`
   - Excludes: `type=recovery` (handled separately)

2. **OAuth Callback Handler** (for OAuth flows)
   - Matches: `respondr://auth-callback#access_token=...`
   - Excludes: `type=signup` or `type=email` (handled by email confirmation)

3. **Password Reset Handler** (for `type=recovery`)
   - Matches: `respondr://reset-password#access_token=...&type=recovery`
   - Matches: `respondr://auth/confirm?token_hash=...&type=recovery`
   - Matches: Any URL with `type=recovery` (not signup)

4. **Password Changed Handler**
   - Matches: `respondr://password-changed`
   - Redirects to login

5. **Generic Email Confirmation** (catch-all)
   - Only matches if not already handled and not `type=recovery`

This ensures that password reset links are correctly routed to the password reset handler, not the email confirmation handler.

## Next Steps

1. **Verify email templates in Supabase Dashboard:**
   - Go to Auth → Email Templates
   - Check that templates use either:
     - `{{ .ConfirmationURL }}` (default)
     - OR `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup/recovery` (custom)

2. **Test both formats:**
   - Test with default `{{ .ConfirmationURL }}` template
   - Test with custom `{{ .RedirectTo }}` template
   - Both should work with current handler

3. **Ensure redirect URLs are configured:**
   - In Supabase Dashboard → Auth → URL Configuration
   - Add: `respondr://auth/confirm`
   - Add: `respondr://password-changed`
   - Add: `respondr://login`

