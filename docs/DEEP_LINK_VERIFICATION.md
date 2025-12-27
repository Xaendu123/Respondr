# Deep Link Verification Report

## ✅ All Deep Links Match Correctly

### App Configuration

**app.json:**
- Scheme: `respondr` ✅
- Android intent filter: `respondr://` ✅
- iOS: Configured via scheme ✅

### Auth Service Configuration

**src/services/supabase/authService.ts:**

| Function | Deep Link Used | Status |
|----------|---------------|--------|
| `signUp()` | `respondr://auth/confirm` | ✅ Matches |
| `resetPassword()` | `respondr://auth/confirm` | ✅ Matches |
| `signInWithGoogle()` | `respondr://auth-callback` | ✅ Matches |
| `signInWithApple()` | `respondr://auth-callback` | ✅ Matches |

### Email Templates

**supabase/email-templates/:**

| Template | Deep Link Used | Status |
|----------|---------------|--------|
| `signup-confirm.html` | `respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup` | ✅ Matches |
| `signup-confirm-de.html` | `respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup` | ✅ Matches |
| `password-reset.html` | `respondr://auth/confirm?token_hash={{ .TokenHash }}&type=recovery` | ✅ Matches |
| `password-reset-de.html` | `respondr://auth/confirm?token_hash={{ .TokenHash }}&type=recovery` | ✅ Matches |
| `password-changed.html` | `respondr://login` | ✅ Matches |
| `password-changed-de.html` | `respondr://login` | ✅ Matches |

### Deep Link Handler

**app/_layout.tsx:**
- Handles: `respondr://auth/confirm?token_hash=...&type=...` ✅
- Handles: `respondr://auth-callback` ✅
- Handles: `respondr://login` ✅

## Deep Link Flow Verification

### 1. Signup Flow ✅
```
User signs up
  ↓
authService.signUp() uses: respondr://auth/confirm
  ↓
Email sent with: respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup
  ↓
User clicks link → Opens app
  ↓
_layout.tsx handles: respondr://auth/confirm?token_hash=...&type=signup
  ↓
verifyOtp() called → User logged in
```

### 2. Password Reset Flow ✅
```
User requests password reset
  ↓
authService.resetPassword() uses: respondr://auth/confirm
  ↓
Email sent with: respondr://auth/confirm?token_hash={{ .TokenHash }}&type=recovery
  ↓
User clicks link → Opens app
  ↓
_layout.tsx handles: respondr://auth/confirm?token_hash=...&type=recovery
  ↓
verifyOtp() called → Navigate to reset password screen
```

### 3. OAuth Flow ✅
```
User clicks "Sign in with Google/Apple"
  ↓
authService.signInWithGoogle/Apple() uses: respondr://auth-callback
  ↓
OAuth provider redirects to: respondr://auth-callback#access_token=...&refresh_token=...
  ↓
_layout.tsx handles: respondr://auth-callback
  ↓
handleOAuthCallback() called → User logged in
```

## Summary

✅ **All deep links are consistent across:**
- App configuration (app.json)
- Auth service (authService.ts)
- Email templates (all 6 templates)
- Deep link handler (_layout.tsx)

✅ **No mismatches found**

✅ **All deep links use the correct format:**
- Signup/Password Reset: `respondr://auth/confirm?token_hash=...&type=...`
- OAuth: `respondr://auth-callback`
- Login: `respondr://login`

## Next Steps

When configuring the new Supabase project, ensure:

1. **Site URL** in Supabase Dashboard → Auth → URL Configuration:
   - Set to: `respondr://`

2. **Redirect URLs** in Supabase Dashboard → Auth → URL Configuration:
   - Add: `respondr://*`
   - Add: `respondr://auth/confirm`
   - Add: `respondr://auth-callback`
   - Add: `respondr://login`

3. **Email Templates** in Supabase Dashboard → Auth → Email Templates:
   - Copy templates from `supabase/email-templates/` directory
   - Ensure deep links match exactly: `respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup` (or `type=recovery`)

