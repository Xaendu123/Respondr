# Deep Linking and Redirects

This document explains how deep linking and redirects work in the Respondr app, particularly for OAuth authentication flows.

## Overview

The app uses two types of deep linking:
1. **Custom URL Scheme**: `respondr://` - For OAuth callbacks and internal navigation
2. **Universal Links**: `https://respondr.ch/*` - For web-to-app linking (Android)

## Configuration

### URL Scheme
Configured in `app.json`:
```json
{
  "scheme": "respondr"
}
```

This enables URLs like:
- `respondr://auth-callback`
- `respondr://settings`
- `respondr://(tabs)/feed`

### Universal Links (Android)
Configured in `app.json`:
```json
{
  "android": {
    "intentFilters": [{
      "action": "VIEW",
      "data": [{
        "scheme": "https",
        "host": "respondr.ch"
      }]
    }]
  }
}
```

This enables URLs like:
- `https://respondr.ch/auth-callback`
- `https://respondr.ch/settings`

## OAuth Redirect Flow

### 1. Initiate OAuth Login

When a user clicks "Sign in with Google" or "Sign in with Apple":

```typescript
// src/services/supabase/authService.ts
export async function signInWithGoogle() {
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'respondr://auth-callback',  // Deep link callback
    },
  });
  // Opens browser with OAuth provider
  return { url: data.url };
}
```

### 2. User Authenticates

1. App opens browser/webview with OAuth provider (Google/Apple)
2. User authenticates with provider
3. Provider redirects to Supabase callback URL
4. Supabase processes the OAuth response
5. Supabase redirects to: `respondr://auth-callback?access_token=...&refresh_token=...`

### 3. App Receives Deep Link

When the app receives `respondr://auth-callback`:

```typescript
// The deep link handler (in app/_layout.tsx or a dedicated handler)
import * as Linking from 'expo-linking';
import { handleOAuthCallback } from '../services/supabase/authService';

useEffect(() => {
  // Handle initial URL (if app was opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url?.includes('auth-callback')) {
      handleOAuthCallback(url);
    }
  });

  // Listen for deep links while app is running
  const subscription = Linking.addEventListener('url', (event) => {
    if (event.url.includes('auth-callback')) {
      handleOAuthCallback(event.url);
    }
  });

  return () => subscription.remove();
}, []);
```

### 4. Process OAuth Callback

```typescript
// src/services/supabase/authService.ts
export async function handleOAuthCallback(url: string) {
  // Extract tokens from URL
  const { data } = await supabase.auth.setSession({
    access_token: extractAccessToken(url),
    refresh_token: extractRefreshToken(url),
  });

  // Load user profile
  const profile = await getCurrentUserProfile();
  return profile;
}
```

## Navigation Redirects

### Authentication-Based Redirects

The app automatically redirects based on authentication state:

```typescript
// app/_layout.tsx
useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === '(tabs)';
  const inAuthScreens = segments[0] === 'login' || segments[0] === 'register';

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && inAuthGroup) {
    router.replace('/login');
  }
  
  // Redirect authenticated users away from auth screens
  else if (isAuthenticated && inAuthScreens) {
    router.replace('/(tabs)/logbook');
  }
}, [isAuthenticated, segments, isLoading]);
```

### Route Structure

```
/ (index.tsx)
  └─> Redirects to /(tabs)/feed

/(tabs)/* (Protected - requires auth)
  ├─> /(tabs)/feed
  ├─> /(tabs)/log
  ├─> /(tabs)/logbook
  └─> /(tabs)/profile

/login (Public)
/register (Public)
/settings (Protected)
/badges (Protected)
/my-activities (Protected)
```

## Deep Link URL Patterns

### OAuth Callbacks
- `respondr://auth-callback?access_token=...&refresh_token=...`
- `https://respondr.ch/auth-callback?access_token=...&refresh_token=...` (Android)

### Navigation Deep Links
- `respondr://(tabs)/feed` - Navigate to feed
- `respondr://settings` - Open settings
- `respondr://badges` - View badges
- `https://respondr.ch/settings` - Universal link to settings

## Implementation Details

### Expo Router Integration

Expo Router automatically handles deep links that match your file structure:

- `respondr://settings` → `app/settings.tsx`
- `respondr://(tabs)/feed` → `app/(tabs)/feed.tsx`
- `respondr://login` → `app/login.tsx`

### Custom Deep Link Handling

For OAuth callbacks, you need to manually handle the URL:

```typescript
import * as Linking from 'expo-linking';

// In your root component or auth provider
useEffect(() => {
  const handleDeepLink = async (url: string | null) => {
    if (!url) return;
    
    const { path, queryParams } = Linking.parse(url);
    
    if (path === 'auth-callback') {
      await handleOAuthCallback(url);
      // Navigate to main app
      router.replace('/(tabs)/logbook');
    }
  };

  // Check if app was opened via deep link
  Linking.getInitialURL().then(handleDeepLink);

  // Listen for deep links while app is running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription.remove();
}, []);
```

## Testing Deep Links

### iOS Simulator
```bash
xcrun simctl openurl booted "respondr://auth-callback?access_token=test"
```

### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "respondr://auth-callback?access_token=test" ch.respondr.app
```

### Physical Device
- Create a note or message with the URL
- Tap the URL to open it

## Troubleshooting

### Deep Link Not Opening App

1. **Check URL scheme**: Must match `app.json` scheme exactly
2. **Verify app is installed**: Deep links only work with installed apps
3. **Check platform-specific config**:
   - iOS: URL scheme in Info.plist
   - Android: Intent filters in AndroidManifest.xml

### OAuth Callback Not Working

1. **Verify redirect URL**: Must match exactly in Supabase dashboard
2. **Check OAuth provider settings**: Redirect URI must be whitelisted
3. **Test URL format**: `respondr://auth-callback` (no trailing slash)

### Navigation Redirects Not Working

1. **Check authentication state**: Ensure `isAuthenticated` is updating correctly
2. **Verify route segments**: Use `useSegments()` to debug current route
3. **Check router state**: Ensure router is initialized before redirecting

## Security Considerations

1. **Token Extraction**: Always validate tokens from deep links
2. **URL Validation**: Verify deep link URLs before processing
3. **State Parameter**: Use OAuth state parameter to prevent CSRF attacks
4. **Token Storage**: Never log or expose tokens in error messages

## Related Files

- `app.json` - Deep link configuration
- `app/_layout.tsx` - Navigation and auth redirects
- `src/services/supabase/authService.ts` - OAuth handling
- `src/providers/AuthProvider.tsx` - Authentication state management

