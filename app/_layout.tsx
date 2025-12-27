import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";
import 'react-native-gesture-handler'; // Must be imported first
import { supabase } from "../src/config/supabase";
import { useTranslation } from "../src/hooks/useTranslation";
import { AppProviders } from "../src/providers/AppProviders";
import { useAuth } from "../src/providers/AuthProvider";
import { handleOAuthCallback } from "../src/services/supabase/authService";

function RootLayoutNav() {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useTranslation();

  // Handle deep links for OAuth callbacks and password reset
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      // Ignore Expo development server URLs (exp://)
      if (url.startsWith('exp://')) {
        return;
      }

      let handled = false;

      // Handle direct confirmation links (no browser redirect)
      // Format: respondr://auth/confirm?token_hash=...&type=signup
      // OR: respondr://auth/confirm?token=...&type=recovery
      if (url.includes('auth/confirm') || url.includes('/auth/confirm')) {
        handled = true;
        try {
          const urlObj = new URL(url);
          const tokenHash = urlObj.searchParams.get('token_hash') || urlObj.searchParams.get('token');
          const type = urlObj.searchParams.get('type') || 'signup';
          
          if (!tokenHash) {
            Alert.alert(
              t('errors.auth'),
              t('auth.confirmationEmailInvalid')
            );
            router.replace('/login');
            return;
          }
          
          // Verify the token hash to get a session
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: decodeURIComponent(tokenHash),
            type: type === 'recovery' ? 'recovery' : type === 'signup' ? 'signup' : 'email',
          });
          
          if (error) {
            Alert.alert(
              t('errors.auth'),
              error.message || t('auth.confirmationEmailInvalid')
            );
            router.replace('/login');
          } else if (data?.session) {
            await refreshUser();
            
            if (type === 'recovery') {
              // Password reset - navigate to reset password screen
              router.replace({
                pathname: '/reset-password',
                params: { url },
              });
            } else {
              // Email confirmation - user is now logged in, navigate to home
              router.replace('/(tabs)/log');
            }
          } else {
            console.error('=== NO SESSION AFTER DIRECT CONFIRMATION ===');
            Alert.alert(
              t('errors.auth'),
              t('auth.confirmationEmailInvalid')
            );
            router.replace('/login');
          }
        } catch (error) {
          console.error('=== DIRECT CONFIRMATION EXCEPTION ===', error);
          Alert.alert(
            t('errors.auth'),
            t('auth.confirmationEmailInvalid')
          );
          router.replace('/login');
        }
      }
      // Check if this is an OAuth callback or email confirmation (redirect flow)
      else if (url.includes('auth-callback')) {
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
                router.replace('/(tabs)/log');
              }
            } else {
              // No token hash - wait for auth state to update
              setTimeout(async () => {
                await refreshUser();
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session) {
                  router.replace('/(tabs)/log');
                } else {
                  router.replace('/login');
                }
              }, 1500);
            }
          } else {
            // OAuth callback
            await handleOAuthCallback(url);
            await refreshUser();
            router.replace('/(tabs)/log');
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          router.replace('/login');
        }
      }
      // Check if this is a password reset link
      else if (url.includes('reset-password') || url.includes('type=recovery')) {
        handled = true;
        try {
          // Supabase redirects to your app with tokens in the URL hash (fragment)
          // Format: respondr://reset-password#access_token=...&refresh_token=...&type=recovery
          const urlObj = new URL(url);
          
          // Extract tokens from hash (fragment) - this is where Supabase puts them after redirect
          const hash = urlObj.hash.substring(1); // Remove the '#' prefix
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type') || urlObj.searchParams.get('type');
          
          if (accessToken && refreshToken) {
            // Method 1: Set session using tokens from URL hash (preferred)
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: decodeURIComponent(accessToken),
              refresh_token: decodeURIComponent(refreshToken),
            });
            
            if (sessionError) {
              console.error('=== PASSWORD RESET SESSION ERROR ===', sessionError);
              Alert.alert(
                t('errors.auth'),
                t('auth.invalidResetLink')
              );
              router.replace('/login');
            } else if (sessionData?.session) {
              // Session set successfully - navigate to reset password screen
              await refreshUser();
              router.replace({
                pathname: '/reset-password',
                params: { url },
              });
            } else {
              console.error('=== NO SESSION AFTER SET ===');
              router.replace('/login');
            }
          } else {
            // No tokens in hash - might be the verification URL or browser didn't pass hash
            // Check if we can extract token_hash or token from the URL
            const tokenHash = urlObj.searchParams.get('token_hash');
            const token = urlObj.searchParams.get('token');
            
            // If we have a token_hash, use verifyOtp to exchange it for a session
            if (tokenHash && (type === 'recovery' || url.includes('type=recovery'))) {
              try {
                const { data, error } = await supabase.auth.verifyOtp({
                  token_hash: tokenHash,
                  type: 'recovery',
                });
                
                if (error) {
                  console.error('=== VERIFY OTP ERROR ===', error);
                  Alert.alert('Error', 'Invalid or expired reset link. Please request a new password reset.');
                  router.replace('/login');
                } else if (data?.session) {
                  await refreshUser();
                  router.replace({
                    pathname: '/reset-password',
                    params: { url },
                  });
                } else {
                  console.error('=== NO SESSION AFTER VERIFY OTP ===');
                  router.replace('/login');
                }
              } catch (verifyError) {
                console.error('=== VERIFY OTP EXCEPTION ===', verifyError);
                Alert.alert('Error', 'Failed to verify reset link. Please request a new password reset.');
                router.replace('/login');
              }
            } else if (token && (type === 'recovery' || url.includes('type=recovery'))) {
              // We have a token but need token_hash for verifyOtp
              // The token in the URL is the raw token, but verifyOtp needs token_hash
              // However, if this is the verification URL from email, we need to check if
              // the redirect actually happened or if we're still on the verification URL
              
              // If this is still the Supabase verification URL, we can't directly use it
              // The user needs to click it in browser first, then browser redirects to app
              // For now, try waiting to see if session gets set automatically
              Alert.alert(
                'Processing...',
                'Please wait while we verify your reset link...'
              );
              
              setTimeout(async () => {
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session) {
                      await refreshUser();
                  router.replace({
                    pathname: '/reset-password',
                    params: { url },
                  });
                } else {
                  console.error('=== NO SESSION AFTER WAIT ===');
                  Alert.alert(
                    'Error', 
                    'Could not verify reset link. Please open the link in a browser first, then it will redirect to the app.'
                  );
                  router.replace('/login');
                }
              }, 2000);
            } else {
              console.error('=== NO TOKENS FOUND ===', { 
                hasHash: !!hash, 
                hashLength: hash?.length,
                hasTokenHash: !!tokenHash,
                hasToken: !!token,
                searchParams: Object.fromEntries(urlObj.searchParams),
              });
              // Try one more time - check if Supabase set session automatically
              setTimeout(async () => {
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session) {
                      await refreshUser();
                  router.replace({
                    pathname: '/reset-password',
                    params: { url },
                  });
                } else {
                  Alert.alert('Error', 'Invalid reset link format. Please request a new password reset.');
                  router.replace('/login');
                }
              }, 1000);
            }
          }
        } catch (error) {
          console.error('=== PASSWORD RESET DEEP LINK ERROR ===', error);
          Alert.alert('Error', 'Failed to process reset link. Please request a new password reset.');
          router.replace('/login');
        }
      }
      // Check if this is an email confirmation link
      else if (url.includes('confirm') || url.includes('verify') || url.includes('token=') || url.includes('type=signup') || url.includes('type=email')) {
        handled = true;
        try {
          // Extract token and type from URL
          const urlObj = new URL(url);
          const tokenHash = urlObj.searchParams.get('token_hash') || urlObj.hash.match(/token_hash=([^&]+)/)?.[1];
          const type = urlObj.searchParams.get('type') || urlObj.hash.match(/type=([^&]+)/)?.[1] || 'signup';
          
          // Also check for access_token in hash (alternative format)
          const accessToken = urlObj.hash.match(/access_token=([^&]+)/)?.[1];
          const refreshToken = urlObj.hash.match(/refresh_token=([^&]+)/)?.[1];
          
          if (accessToken && refreshToken) {
            // Direct session tokens - set session immediately
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: decodeURIComponent(accessToken),
              refresh_token: decodeURIComponent(refreshToken),
            });
            
            if (sessionError) {
              console.error('Email confirmation session error:', sessionError);
              router.replace('/login');
            } else if (sessionData?.session) {
              // Email confirmed and user logged in
              await refreshUser();
              router.replace('/(tabs)/log');
            } else {
              router.replace('/login');
            }
          } else if (tokenHash) {
            // Token hash format - verify OTP
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: decodeURIComponent(tokenHash),
              type: type as any,
            });
            
            if (error) {
              Alert.alert('Error', 'Invalid or expired confirmation link. Please request a new confirmation email.');
              router.replace('/login');
            } else if (data?.session) {
              // Email confirmed - user is now logged in
              await refreshUser();
              router.replace('/(tabs)/log');
            } else {
              router.replace('/login');
            }
          } else {
            // Check if there's a token (not hash) that needs verification
            const token = urlObj.searchParams.get('token');
            if (token && (type === 'signup' || type === 'email')) {
              // Try to verify with token directly (though typically we need token_hash)
              // Sometimes the verification happens automatically when URL is opened
              setTimeout(async () => {
                try {
                  await refreshUser();
                  const { data: sessionData } = await supabase.auth.getSession();
                  if (sessionData?.session) {
                    router.replace('/(tabs)/log');
                  } else {
                    Alert.alert('Error', 'Could not verify email. Please request a new confirmation email.');
                    router.replace('/login');
                  }
                } catch (error) {
                  router.replace('/login');
                }
              }, 1500);
              return; // Exit early, setTimeout will handle navigation
            } else {
              // No tokens found - wait for auth state to update (Supabase might handle it automatically)
              setTimeout(async () => {
                try {
                  await refreshUser();
                  const { data: sessionData } = await supabase.auth.getSession();
                  if (sessionData?.session) {
                    router.replace('/(tabs)/log');
                  } else {
                    Alert.alert('Error', 'Could not verify email. Please request a new confirmation email.');
                    router.replace('/login');
                  }
                } catch (error) {
                  router.replace('/login');
                }
              }, 1500);
            }
          }
        } catch (error) {
          console.error('Email confirmation error:', error);
          router.replace('/login');
        }
      }
      
      // Handle simple login deep link (respondr://login)
      if (!handled) {
        try {
          const urlObj = new URL(url);
          if (urlObj.pathname === '/login' || urlObj.pathname === 'login') {
            handled = true;
            router.replace('/login');
          }
        } catch (e) {
          // URL parsing failed, continue to catch-all handler
        }
      }
      
      // If deep link was not handled (invalid/unknown), route based on auth state
      if (!handled) {
        console.warn('Invalid or unknown deep link:', url);
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            // User is authenticated - route to home
            router.replace('/(tabs)/log');
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
      router.replace('/(tabs)/log');
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
      <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
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
