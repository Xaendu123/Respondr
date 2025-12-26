# Accessing Console Logs in TestFlight Builds (iOS)

## The Problem

TestFlight builds are production builds that don't show console logs in Expo/Metro. The standard `console.log()` statements won't be visible in your development terminal.

## Solutions

### Option 1: Xcode Device Console (Recommended for Quick Debugging)

You can view device logs through Xcode even for TestFlight builds:

1. **Connect your iOS device to your Mac via USB**
2. **Open Xcode**
3. **Go to:** `Window` → `Devices and Simulators` (or press `Cmd+Shift+2`)
4. **Select your connected device** from the left sidebar
5. **Click "Open Console"** button at the bottom
6. **Filter by your app name** (e.g., "Respondr") or process name
7. **Reproduce the issue** (e.g., click password reset link)
8. **Look for logs** containing your markers like `=== EXTRACTED TOKENS ===`

**Note:** The console shows all system logs, so you'll see a lot of noise. Use the search/filter to find your specific log messages.

### Option 2: macOS Console App

Similar to Xcode, but using the standalone Console app:

1. **Connect iOS device via USB**
2. **Open Console.app** (Applications → Utilities → Console)
3. **Select your device** from the sidebar
4. **Filter by your app name**
5. **Look for your log messages**

### Option 3: Add Remote Logging (Best for Production)

For production debugging, consider adding a remote logging service:

#### Using Sentry (Recommended)

```bash
npm install @sentry/react-native
```

```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
});
```

Then in your code:
```typescript
console.log('=== EXTRACTED TOKENS ===', data);
Sentry.addBreadcrumb({
  message: '=== EXTRACTED TOKENS ===',
  data: data,
  level: 'info',
});
```

#### Using Flipper (Development Only)

Flipper can show logs for development builds, but typically not for TestFlight.

#### Custom Logging Service

You could create a simple logging service that sends logs to your own backend:

```typescript
// src/utils/logger.ts
import { supabase } from '../config/supabase';

export const logToServer = async (level: 'info' | 'error' | 'debug', message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}]`, message, data);
    return;
  }

  // In production, send to your logging endpoint
  try {
    await fetch('https://your-logging-endpoint.com/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userId: (await supabase.auth.getUser()).data.user?.id,
      }),
    });
  } catch (error) {
    // Fail silently in production
  }
};

// Usage:
logToServer('debug', '=== EXTRACTED TOKENS ===', { hasAccessToken: !!accessToken });
```

### Option 4: Temporary Debug Screen in App

Add a debug screen that shows recent logs (useful for testing):

```typescript
// app/debug.tsx (only include in development builds)
import { useState, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';

const logs: Array<{ timestamp: Date; message: string; data?: any }> = [];

// Intercept console.log
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  logs.push({
    timestamp: new Date(),
    message: args.join(' '),
    data: args.length > 1 ? args.slice(1) : undefined,
  });
  // Keep only last 100 logs
  if (logs.length > 100) logs.shift();
};

export default function DebugScreen() {
  return (
    <ScrollView>
      {logs.map((log, i) => (
        <View key={i} style={{ padding: 10, borderBottomWidth: 1 }}>
          <Text>{log.timestamp.toLocaleTimeString()}</Text>
          <Text>{log.message}</Text>
          {log.data && <Text>{JSON.stringify(log.data, null, 2)}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
```

### Option 5: Use React Native Debugger (Development Only)

For development builds, you can use React Native Debugger, but this won't work for TestFlight builds.

## Recommended Approach for Your Case

For debugging the password reset/email confirmation flow in TestFlight:

1. **Short-term:** Use Xcode Device Console (Option 1) - it's the quickest way
2. **Long-term:** Add Sentry or similar service (Option 3) - better for production debugging

## Testing the Logs

1. **Build and upload to TestFlight**
2. **Install on your device via TestFlight**
3. **Connect device to Mac via USB**
4. **Open Xcode → Devices and Simulators → Open Console**
5. **Filter/search for:** `=== EXTRACTED TOKENS ===` or `=== CHECKING FOR TOKEN HASH ===`
6. **Trigger the password reset flow**
7. **Watch the console for your log messages**

## Tips

- **Use unique log markers** (like `=== EXTRACTED TOKENS ===`) to easily find your logs
- **Include timestamps** in your logs if needed
- **Be careful with sensitive data** - don't log tokens or passwords in production
- **Consider log levels** - use different markers for different log levels (INFO, DEBUG, ERROR)

## Example: What to Look For

When testing password reset, you should see logs like:

```
=== PASSWORD RESET DEEP LINK === { url: 'respondr://reset-password#...' }
=== EXTRACTED TOKENS === { hasAccessToken: true, hasRefreshToken: true, ... }
=== SETTING SESSION FROM TOKENS ===
=== SESSION SET SUCCESSFULLY ===
```

Or if tokens are missing:

```
=== CHECKING FOR TOKEN HASH OR TOKEN === { hasTokenHash: false, hasToken: true, ... }
=== FOUND TOKEN (NOT HASH) FOR RECOVERY ===
```

