# Viewing Logs in TestFlight Builds (Windows/Linux)

Since you don't have a Mac, you can't use Xcode Device Console. Here are alternative solutions:

## Option 1: Add Remote Logging Service (Recommended)

### Using Sentry (Free tier available)

Sentry is a popular error tracking and logging service that works cross-platform:

```bash
npm install @sentry/react-native
```

Create a logging utility:
```typescript
// src/utils/logger.ts
import * as Sentry from '@sentry/react-native';

// Initialize Sentry (only in production)
if (!__DEV__) {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN', // Get from https://sentry.io
    environment: 'production',
    tracesSampleRate: 1.0, // Adjust as needed
  });
}

export const log = (level: 'info' | 'debug' | 'error', message: string, data?: any) => {
  // Always log to console in dev
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}]`, message, data);
    return;
  }

  // In production, send to Sentry
  switch (level) {
    case 'error':
      Sentry.captureException(new Error(message), {
        extra: data,
        tags: { source: 'auth_flow' },
      });
      break;
    case 'info':
    case 'debug':
      Sentry.addBreadcrumb({
        message,
        data,
        level: level === 'error' ? 'error' : 'info',
        category: 'auth',
      });
      break;
  }
};

// Usage in your code:
log('debug', '=== EXTRACTED TOKENS ===', { hasAccessToken: !!accessToken });
```

### Using Custom Backend Logging

If you have a backend, create a simple logging endpoint:

```typescript
// src/utils/logger.ts
const LOG_ENDPOINT = 'https://your-backend.com/api/logs';

export const logToServer = async (level: string, message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[${level}]`, message, data);
    return;
  }

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        appVersion: Constants.expoConfig?.version,
        platform: Platform.OS,
      }),
    });
  } catch (error) {
    // Fail silently
  }
};
```

## Option 2: In-App Debug Screen (Quick Solution)

Add a debug screen that shows logs directly in the app:

```typescript
// src/utils/logger.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_STORAGE_KEY = '@app_debug_logs';
const MAX_LOGS = 100;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

class AppLogger {
  private logs: LogEntry[] = [];

  async init() {
    // Load existing logs from storage
    try {
      const stored = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  async log(level: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    // Always log to console
    console.log(`[${level}]`, message, data);

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift(); // Remove oldest
    }

    // Persist to storage
    try {
      await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
  }
}

export const appLogger = new AppLogger();

// Initialize on app start
appLogger.init();
```

```typescript
// app/debug-logs.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appLogger } from '../src/utils/logger';
import { useTheme } from '../src/providers/ThemeProvider';

export default function DebugLogsScreen() {
  const { theme } = useTheme();
  const [logs, setLogs] = useState(appLogger.getLogs());

  useEffect(() => {
    // Refresh logs every second
    const interval = setInterval(() => {
      setLogs(appLogger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await appLogger.clearLogs();
            setLogs([]);
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs</Text>
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.logsContainer}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet</Text>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <Text style={styles.timestamp}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={[styles.level, styles[`level_${log.level}`]]}>
                [{log.level.toUpperCase()}]
              </Text>
              <Text style={styles.message}>{log.message}</Text>
              {log.data && (
                <Text style={styles.data}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    clearButton: {
      padding: 8,
    },
    clearButtonText: {
      color: theme.colors.error,
      fontSize: 16,
    },
    logsContainer: {
      flex: 1,
      padding: 16,
    },
    logEntry: {
      marginBottom: 12,
      padding: 12,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.border,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    level: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    level_debug: {
      color: '#0066cc',
    },
    level_info: {
      color: '#00aa00',
    },
    level_error: {
      color: theme.colors.error,
    },
    message: {
      fontSize: 14,
      color: theme.colors.textPrimary,
      marginBottom: 4,
      fontFamily: 'monospace',
    },
    data: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
      marginTop: 4,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      marginTop: 32,
    },
  });
}
```

Add route in `app/_layout.tsx`:
```typescript
<Stack.Screen name="debug-logs" options={{ title: 'Debug Logs' }} />
```

Access via dev menu or hidden button (e.g., tap app version 10 times in settings).

## Option 3: Use Expo's Remote Logging (Limited)

Expo Go has remote logging, but TestFlight builds don't use Expo Go. This won't work for TestFlight.

## Option 4: Email/SMS Logs (Simple but Limited)

For critical logs, you could email them:

```typescript
import * as MailComposer from 'expo-mail-composer';

export const emailLogs = async (logs: LogEntry[]) => {
  const logText = logs
    .map(log => `[${log.timestamp}] [${log.level}] ${log.message}\n${JSON.stringify(log.data, null, 2)}`)
    .join('\n\n');

  await MailComposer.composeAsync({
    recipients: ['your-email@example.com'],
    subject: 'App Debug Logs',
    body: logText,
  });
};
```

## Recommendation

For your use case (debugging password reset flow), I recommend:

1. **Quick fix:** Add the in-app debug screen (Option 2) - you can view logs immediately
2. **Long-term:** Add Sentry (Option 1) - better for production monitoring

The in-app debug screen is the fastest to implement and doesn't require external services.

