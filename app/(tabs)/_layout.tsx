/**
 * BOTTOM TABS NAVIGATION LAYOUT
 * 
 * Defines the bottom tab navigation for the main app screens.
 * Includes slide animations based on tab order (left/right).
 */

import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { TabAnimationProvider } from "../../src/contexts/TabAnimationContext";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme } from "../../src/providers/ThemeProvider";
import { hapticLight } from "../../src/utils/haptics";

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Redirect to login screen if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <TabAnimationProvider>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 0, // Remove shadow on Android
          shadowColor: 'transparent', // Remove shadow on iOS
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        // Keep all screens mounted to enable custom slide animations
        // This prevents React Navigation from unmounting inactive tabs
        lazy: false,
      }}
      screenListeners={{
        tabPress: () => {
          hapticLight();
          return true;
        },
      }}
    >
      <Tabs.Screen
        name="logbook"
        options={{
          title: t("logbook.title"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: t("activity.logNew"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t("feed.title"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </TabAnimationProvider>
  );
}

