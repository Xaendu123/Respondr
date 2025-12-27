# Deep Link Handling Guide

## Overview

This document describes how deep links are handled in the Respondr app for authentication flows.

## Deep Link Types

### 1. Email Confirmation (Signup)

**Purpose**: Verify user's email address and automatically sign them in after signup.

**URL Formats**:
- `respondr://auth/confirm?token_hash=...&type=signup`
- `respondr://auth-callback?token_hash=...&type=signup`
- `respondr://auth/confirm#access_token=...&refresh_token=...&type=signup`

**Flow**:
1. User clicks confirmation link in email
2. Deep link handler extracts `token_hash` or session tokens
3. If `token_hash` exists: Uses `verifyOtp()` with type `'signup'` to verify and create session
4. If session tokens exist: Uses `setSession()` to create session directly
5. Verifies email is confirmed (`email_confirmed_at` is set)
6. Refreshes user profile
7. Navigates to home screen `/(tabs)/log`

**Key Points**:
- OTP verification creates the session automatically
- User is automatically signed in after verification
- Account is marked as verified

### 2. Password Reset

**Purpose**: Allow user to reset their password using a secure token.

**URL Formats**:
- `respondr://reset-password#access_token=...&refresh_token=...&type=recovery`
- `respondr://auth/confirm?token_hash=...&type=recovery`

**Flow**:
1. User clicks password reset link in email
2. Deep link handler extracts tokens or `token_hash`
3. If session tokens exist: Uses `setSession()` to create session
4. If `token_hash` exists: Uses `verifyOtp()` with type `'recovery'` to create session
5. Session is created (user is temporarily authenticated for password reset)
6. Navigates to `/reset-password` screen with URL params
7. User enters new password
8. Password is updated using `updateUser({ password })`
9. User is redirected to login screen

**Key Points**:
- Session is created using the recovery token
- User can only reset password (not access other features)
- After password reset, user must log in with new password

### 3. Password Changed Confirmation

**Purpose**: Confirm password was successfully changed (after reset).

**URL Formats**:
- `respondr://password-changed`
- `respondr://passwordChanged`
- `respondr://password_changed`

**Flow**:
1. User successfully changes password
2. Deep link handler detects password changed link
3. Simply redirects to `/login` screen
4. User can now log in with new password

**Key Points**:
- No authentication needed
- Just navigates to login screen

## Implementation Details

### Token Extraction

The handler extracts tokens from multiple locations:
- URL search params: `?token_hash=...`
- URL hash/fragment: `#token_hash=...` or `#access_token=...&refresh_token=...`
- URL hash regex matching for various formats

### OTP Verification

For email confirmation and password reset, the handler uses `verifyOtp()`:
- **Email confirmation**: `type: 'signup'` or `type: 'email'`
- **Password reset**: `type: 'recovery'`

The verification automatically creates a session if successful.

### Session Management

- Sessions are created via `verifyOtp()` or `setSession()`
- User profile is refreshed after session creation
- Navigation happens only after session is confirmed

### Error Handling

- Invalid/expired tokens: Shows error and redirects to login
- Missing tokens: Shows error and redirects to login
- Network errors: Retries with exponential backoff
- Already verified: Checks for existing session and proceeds

## Testing

To test deep links:

1. **Email Confirmation**:
   - Sign up with a new account
   - Click confirmation link in email
   - Should verify email and sign in automatically

2. **Password Reset**:
   - Request password reset
   - Click reset link in email
   - Should create session and show reset password screen
   - Enter new password
   - Should redirect to login

3. **Password Changed**:
   - After password reset, if redirected to password-changed link
   - Should simply show login screen

## Troubleshooting

### Deep link not working
- Check console logs for URL processing
- Verify URL format matches expected patterns
- Check if tokens are present in URL
- Ensure deep link handler runs before auth redirects

### Session not created
- Verify token is valid and not expired
- Check OTP type matches (signup vs recovery)
- Ensure Supabase project is active
- Check network connectivity

### Wrong screen shown
- Verify deep link handler processes URL before auth redirects
- Check if `isProcessingDeepLinkRef` flag is set correctly
- Ensure URL patterns match correctly

