import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import 'react-native-gesture-handler'; // Must be imported first
import { supabase } from "../src/config/supabase";
import { AppProviders } from "../src/providers/AppProviders";
import { useAuth } from "../src/providers/AuthProvider";
import { handleOAuthCallback } from "../src/services/supabase/authService";

function RootLayoutNav() {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Handle deep links for OAuth callbacks and password reset
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      // Ignore Expo development server URLs (exp://)
      if (url.startsWith('exp://')) {
        return;
      }

      let handled = false;

      // Check if this is an OAuth callback or email confirmation
      if (url.includes('auth-callback')) {
        handled = true;
        try {
          // Check if it's an email confirmation (type=signup) or OAuth
          if (url.includes('type=signup') || url.includes('type=email')) {
            // Email confirmation - extract tokens from URL
            const urlObj = new URL(url);
            const tokenHash = urlObj.searchParams.get('token_hash') || urlObj.searchParams.get('token');
            const type = urlObj.searchParams.get('type') || 'email';
            
            if (tokenHash) {
              // Verify the email confirmation token
              const { data, error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type as any,
              });
              
              if (error) {
                console.error('Email confirmation error:', error);
                router.replace('/login');
              } else if (data?.session) {
                // Email confirmed - user is now logged in
                await refreshUser();
                router.replace('/(tabs)/logbook');
              }
            } else {
              // No token hash - wait for auth state to update
              setTimeout(async () => {
                await refreshUser();
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session) {
                  router.replace('/(tabs)/logbook');
                } else {
                  router.replace('/login');
                }
              }, 1500);
            }
          } else {
            // OAuth callback
            await handleOAuthCallback(url);
            await refreshUser();
            router.replace('/(tabs)/logbook');
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          router.replace('/login');
        }
      }
      // Check if this is a password reset link
      else if (url.includes('reset-password')) {
        handled = true;
        // Extract token and hash from URL
        const parsed = Linking.parse(url);
        // Navigate to reset password screen with the URL (contains token)
        router.replace({
          pathname: '/reset-password',
          params: { url },
        });
      }
      // Check if this is an email confirmation link
      else if (url.includes('confirm') || url.includes('verify') || url.includes('token=') || url.includes('type=signup')) {
        handled = true;
        try {
          // Supabase email confirmation links are handled automatically by the auth state listener
          // The link contains tokens that Supabase will process
          // Wait a moment for the auth state to update, then refresh and navigate
          setTimeout(async () => {
            try {
              await refreshUser();
              // Check if user is now authenticated
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                router.replace('/(tabs)/logbook');
              } else {
                router.replace('/login');
              }
            } catch (error) {
              console.error('Error after email confirmation:', error);
              router.replace('/login');
            }
          }, 1500);
        } catch (error) {
          console.error('Email confirmation error:', error);
          router.replace('/login');
        }
      }
      
      // If deep link was not handled (invalid/unknown), route based on auth state
      if (!handled) {
        console.warn('Invalid or unknown deep link:', url);
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            // User is authenticated - route to home
            router.replace('/(tabs)/logbook');
          } else {
            // No session - route to login
            router.replace('/login');
          }
        } catch (error) {
          console.error('Error checking session for invalid deep link:', error);
          router.replace('/login');
        }
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then(handleDeepLink);

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [router, refreshUser]);

  // Handle authentication-based redirects
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthScreens = segments[0] === 'login' || segments[0] === 'register';
    const inConfirmEmail = segments[0] === 'confirm-email';
    const inResetPassword = segments[0] === 'reset-password';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access protected routes
      router.replace('/login');
    } else if (isAuthenticated && inAuthScreens) {
      // Redirect to main app if authenticated and on login/register screens only
      router.replace('/(tabs)/logbook');
    }
    // Don't redirect from confirm-email or reset-password screens - let user stay there
    // Don't redirect from register screen when not authenticated (user might be registering)
  }, [isAuthenticated, segments, isLoading, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-email" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="badges" />
      <Stack.Screen name="my-activities" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
