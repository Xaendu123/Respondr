# Testing Deep Links in Expo Go

## ⚠️ Important Limitation

**Expo Go does NOT support custom URL schemes** like `respondr://`. Custom schemes only work in development builds or production builds.

## Options for Testing

### Option 1: Test Programmatically (Recommended for Expo Go)

Since Expo Go doesn't support custom schemes, test the deep link handler directly from within the app:

1. **Add a test button** temporarily to any screen (e.g., login screen)
2. **Call the deep link handler** programmatically

Example - Add to `app/login.tsx` temporarily:

```typescript
import * as Linking from 'expo-linking';

// Add a test button
<TouchableOpacity onPress={() => {
  // Simulate the deep link
  const testUrl = 'respondr://reset-password?token=test&type=recovery';
  // Manually trigger the handler
  router.push({
    pathname: '/reset-password',
    params: { url: testUrl },
  });
}}>
  <Text>Test Reset Password Deep Link</Text>
</TouchableOpacity>
```

### Option 2: Use Development Build (Best for Testing)

For proper deep link testing, use a development build:

```bash
# Build development client
npx expo run:ios
# or
npx expo run:android
```

Then test with:
```
respondr://reset-password?token=test&type=recovery
```

### Option 3: Test via Expo Router Navigation

Since the deep link handler uses Expo Router, you can test navigation directly:

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate directly to reset password screen
router.push('/reset-password');
```

## Testing the Deep Link Handler Logic

Even in Expo Go, you can test that the handler logic works:

1. **Open the app in Expo Go**
2. **Add temporary test code** to trigger the handler:

```typescript
// In app/_layout.tsx or any component
useEffect(() => {
  // Simulate receiving a deep link
  const testUrl = 'respondr://reset-password?token=test&type=recovery';
  
  // Manually call the handler
  if (testUrl.includes('reset-password')) {
    router.replace({
      pathname: '/reset-password',
      params: { url: testUrl },
    });
  }
}, []);
```

## Why Custom Schemes Don't Work in Expo Go

Expo Go is a generic app that loads your project. It doesn't register your custom URL scheme (`respondr://`) because:
- Expo Go uses its own bundle identifier
- Custom schemes are registered at the native app level
- Only your built app (development or production) has your custom scheme

## What Will Work in Production

Once you build your app (development build or production):
- ✅ `respondr://reset-password` will work
- ✅ Deep links from emails will open your app
- ✅ OAuth redirects will work
- ✅ All custom scheme URLs will function

## Quick Test Script

Create a temporary test component:

```typescript
// app/test-deep-link.tsx (temporary file)
import { useRouter } from 'expo-router';
import { Button, View } from 'react-native';

export default function TestDeepLink() {
  const router = useRouter();
  
  return (
    <View style={{ padding: 20 }}>
      <Button
        title="Test Reset Password Deep Link"
        onPress={() => {
          router.push({
            pathname: '/reset-password',
            params: { url: 'respondr://reset-password?token=test&type=recovery' },
          });
        }}
      />
    </View>
  );
}
```

Then navigate to `/test-deep-link` in Expo Go to test.

## Summary

- ❌ **Custom schemes don't work in Expo Go** (`respondr://`)
- ✅ **Test programmatically** by calling the router directly
- ✅ **Use development build** for full deep link testing
- ✅ **Production builds** will support all deep links

For now, test the reset password screen by navigating directly:
```
Navigate to: /reset-password
```

