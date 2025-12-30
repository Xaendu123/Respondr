import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, AppStateStatus, StyleSheet, View } from "react-native";
import { useAuth } from "../src/providers/AuthProvider";
import { useTheme } from "../src/providers/ThemeProvider";

export default function Index() {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Handle app state changes (when app comes back from background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - refresh auth state
        try {
          await refreshUser();
        } catch (error) {
          console.warn('Failed to refresh user on app state change:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshUser]);
  
  // Timeout safety: if loading takes more than 10 seconds, show error state
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Auth initialization timeout - forcing navigation');
        setHasTimedOut(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    } else {
      setHasTimedOut(false);
    }
  }, [isLoading]);
  
  // Show loading screen while checking auth
  if (isLoading && !hasTimedOut) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  // If timed out, try to navigate anyway (auth might have partially initialized)
  if (hasTimedOut) {
    console.warn('Auth initialization timed out, navigating based on current state');
  }
  
  // Redirect to login if not authenticated, otherwise to main app
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  
  return <Redirect href="/(tabs)/log" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
