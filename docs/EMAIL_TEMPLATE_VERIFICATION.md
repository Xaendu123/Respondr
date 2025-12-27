# Email Template Deep Link Verification

## ✅ All Templates Match Handler Logic

### 1. Signup Confirmation Email (`signup-confirm.html`)

**Template Link (line 187):**
```html
<a href="respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup">
```

**Handler Logic (`app/_layout.tsx` line 292-293):**
```typescript
if ((url.includes('auth/confirm') || url.includes('/auth/confirm') || ...) 
    && !url.includes('type=recovery') && !url.includes('reset-password'))
```
- ✅ Matches pattern: `respondr://auth/confirm?token_hash=...&type=signup`
- ✅ Handler: Email confirmation handler
- ✅ Action: Verifies OTP with type `'signup'`, creates session, navigates to home

**Status:** ✅ **MATCHES**

---

### 2. Password Reset Email (`password-reset.html`)

**Template Link (line 187):**
```html
<a href="respondr://auth/confirm?token_hash={{ .TokenHash }}&type=recovery">
```

**Handler Logic (`app/_layout.tsx` line 341):**
```typescript
else if (url.includes('reset-password') || (url.includes('type=recovery') && !url.includes('type=signup')))
```
- ✅ Matches pattern: `respondr://auth/confirm?token_hash=...&type=recovery`
- ✅ Handler: Password reset handler
- ✅ Action: Verifies OTP with type `'recovery'`, creates session, navigates to `/reset-password`

**Status:** ✅ **MATCHES**

---

### 3. Password Changed Confirmation Email (`password-changed.html`)

**Template Link (line 198):**
```html
<a href="respondr://login">
```

**Handler Logic (`app/_layout.tsx` line 493-495):**
```typescript
if (urlObj.pathname === '/login' || urlObj.pathname === 'login') {
  handled = true;
  router.replace('/login');
}
```
- ✅ Matches pattern: `respondr://login`
- ✅ Handler: Login deep link handler
- ✅ Action: Navigates to `/login` screen

**Status:** ✅ **MATCHES**

---

## Summary

| Template | Deep Link Format | Handler | Status |
|----------|-----------------|---------|--------|
| `signup-confirm.html` | `respondr://auth/confirm?token_hash={{ .TokenHash }}&type=signup` | Email Confirmation Handler | ✅ MATCHES |
| `password-reset.html` | `respondr://auth/confirm?token_hash={{ .TokenHash }}&type=recovery` | Password Reset Handler | ✅ MATCHES |
| `password-changed.html` | `respondr://login` | Login Handler | ✅ MATCHES |

## Verification Details

### Email Confirmation Flow
1. User receives email with link: `respondr://auth/confirm?token_hash=...&type=signup`
2. Handler extracts `token_hash` and `type=signup`
3. Calls `verifyOtp({ token_hash, type: 'signup' })`
4. Creates session and navigates to home

### Password Reset Flow
1. User receives email with link: `respondr://auth/confirm?token_hash=...&type=recovery`
2. Handler extracts `token_hash` and `type=recovery`
3. Calls `verifyOtp({ token_hash, type: 'recovery' })`
4. Creates session and navigates to `/reset-password`

### Password Changed Flow
1. User receives email with link: `respondr://login`
2. Handler detects `pathname === '/login'`
3. Navigates to `/login` screen

## Conclusion

✅ **All email template deep links correctly match the handler logic.**

No changes needed - the templates are correctly configured!

