/**
 * BOTTOM TABS NAVIGATION LAYOUT
 *
 * Defines the bottom tab navigation for the main app screens.
 * Includes slide animations based on tab order (left/right).
 */

import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, usePathname } from "expo-router";
import { useEffect } from "react";
import { TabAnimationProvider, useTabAnimation } from "../../src/contexts/TabAnimationContext";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme } from "../../src/providers/ThemeProvider";
import { hapticLight } from "../../src/utils/haptics";

function TabsContent() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { setCurrentTab } = useTabAnimation();
  const pathname = usePathname();

  // Update animation context when route changes
  useEffect(() => {
    // Extract tab name from pathname (e.g., "/(tabs)/feed" -> "feed")
    const tabName = pathname.split('/').pop() || 'feed';
    if (['feed', 'log', 'logbook'].includes(tabName)) {
      setCurrentTab(tabName);
    }
  }, [pathname, setCurrentTab]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        // Keep all screens mounted to enable custom slide animations
        lazy: false,
        // Disable default tab animation since we handle it ourselves
        animation: 'none',
      }}
      screenListeners={{
        tabPress: () => {
          hapticLight();
          return true;
        },
      }}
    >
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
        name="log"
        options={{
          title: t("activity.logNew"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
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
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login screen if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <TabAnimationProvider>
      <TabsContent />
    </TabAnimationProvider>
  );
}

