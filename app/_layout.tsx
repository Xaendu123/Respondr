import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import 'react-native-gesture-handler'; // Must be imported first
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { supabase } from "../src/config/supabase";
import { useTranslation } from "../src/hooks/useTranslation";
import { AppProviders } from "../src/providers/AppProviders";
import { useAuth } from "../src/providers/AuthProvider";
import { useToast } from "../src/providers/ToastProvider";
import { handleOAuthCallback } from "../src/services/supabase/authService";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  // Track if we're currently processing a deep link to prevent auth redirects from interfering
  const isProcessingDeepLinkRef = useRef(false);

  // Handle deep links for OAuth callbacks and password reset
  useEffect(() => {
    // Track processed URLs to prevent duplicate handling
    const processedUrls = new Set<string>();
    
    const handleEmailConfirmation = async (url: string, urlObj: URL): Promise<boolean> => {
      // Don't check for existing session first - we need to verify the OTP to create the session
      // The OTP verification will create the session if successful

      // Extract tokens from various possible locations
      // Priority: searchParams > hash regex > hash URLSearchParams
      const hash = urlObj.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      
      // Check for direct session tokens in hash (alternative format)
      const accessToken = urlObj.hash.match(/access_token=([^&]+)/)?.[1] || hashParams.get('access_token');
      const refreshToken = urlObj.hash.match(/refresh_token=([^&]+)/)?.[1] || hashParams.get('refresh_token');
      
      const tokenHash = urlObj.searchParams.get('token_hash') || 
                       hashParams.get('token_hash') ||
                       urlObj.hash.match(/token_hash=([^&]+)/)?.[1] ||
                       urlObj.searchParams.get('token');
      
      const type = urlObj.searchParams.get('type') || 
                   hashParams.get('type') ||
                   urlObj.hash.match(/type=([^&]+)/)?.[1] || 
                   'signup';
      
      // Helper function to verify OTP with retry logic
      const verifyOtpWithRetry = async (token: string, otpType: string, retries = 2): Promise<{ success: boolean; session: any }> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const decodedToken = decodeURIComponent(token);
            
            // For signup confirmations, ensure we use 'signup' type
            const finalOtpType = (otpType === 'signup' || type === 'signup') ? 'signup' : otpType;
            
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: decodedToken,
              type: finalOtpType as 'signup' | 'email' | 'recovery',
            });
            
            if (error) {
              console.error(`OTP verification error (attempt ${attempt + 1}):`, error);
              
              // Handle specific error cases
              const errorMsg = error.message?.toLowerCase() || '';
              
              // If token already used or user already confirmed, check if they're logged in
              if (errorMsg.includes('already') || errorMsg.includes('expired') || errorMsg.includes('invalid')) {
                // Check if user is now authenticated (might have been confirmed by another process)
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session) {
                  return { success: true, session: sessionData.session };
                }
                
                // If it's the last attempt, return the error
                if (attempt === retries) {
                  return { success: false, session: null };
                }
              } else {
                // For other errors, retry if we have attempts left
                if (attempt < retries) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                  continue;
                }
                return { success: false, session: null };
              }
            }
            
            if (data?.session) {
              return { success: true, session: data.session };
            } else {
              console.warn('OTP verification returned no session');
              // Check if session was created anyway
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                return { success: true, session: sessionData.session };
              }
            }
          } catch (err) {
            console.error(`Verification attempt ${attempt + 1} failed:`, err);
            if (attempt === retries) {
              return { success: false, session: null };
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
        return { success: false, session: null };
      };
      
      // Method 1: Direct session tokens (preferred - fastest)
      // This happens when Supabase redirects with tokens in the URL hash
      if (accessToken && refreshToken) {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: decodeURIComponent(accessToken),
            refresh_token: decodeURIComponent(refreshToken),
          });
          
          if (sessionError) {
            console.error('Email confirmation session error:', sessionError);
            // Fall through to token hash verification
          } else if (sessionData?.session) {
            // Verify that the user's email is confirmed
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Refresh user profile to ensure everything is up to date
              await refreshUser();
              
              // Navigate to home
              router.replace('/(tabs)/log');
              return true;
            } else {
              console.error('No user found after setting session');
              // Fall through to token hash verification
            }
          }
        } catch (err) {
          console.error('Error setting session from tokens:', err);
          // Fall through to token hash verification
        }
      }
      
      // Method 2: Token hash verification (for signup/email confirmation)
      if (tokenHash) {
        // Determine OTP type - prioritize signup for email confirmation
        // For email confirmation, we should use 'signup' type to verify the account
        const otpType = type === 'recovery' ? 'recovery' : type === 'signup' ? 'signup' : 'email';
        
        const result = await verifyOtpWithRetry(tokenHash, otpType);
        
        if (result.success && result.session) {
          // OTP verified successfully - session is now set
          // Verify that the user's email is confirmed
          const { data: { user } } = await supabase.auth.getUser();
          if (user && !user.email_confirmed_at) {
            // If email is not confirmed yet, wait a moment and check again
            // (Supabase might need a moment to update)
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser && !updatedUser.email_confirmed_at) {
              console.warn('Email confirmation: User email not confirmed after OTP verification');
            }
          }
          
          // Refresh user profile to ensure everything is up to date
          await refreshUser();
          
          // Verify session is still valid before navigating
          const { data: sessionCheck } = await supabase.auth.getSession();
          if (sessionCheck?.session) {
            router.replace('/(tabs)/log');
            return true;
          } else {
            console.error('Session lost after OTP verification');
            showToast({ type: 'error', message: t('auth.confirmationEmailInvalid') || 'Session could not be established. Please try logging in.' });
            router.replace('/login');
            return true;
          }
        } else {
          // OTP verification failed - check if user is already authenticated
          const { data: finalSession } = await supabase.auth.getSession();
          if (finalSession?.session) {
            // User is already authenticated - might have been confirmed by another process
            await refreshUser();
            router.replace('/(tabs)/log');
            return true;
          }
          
          // Verification failed and no session
          console.error('OTP verification failed and no session found');
          showToast({ type: 'error', message: t('auth.confirmationEmailInvalid') || 'Invalid or expired confirmation link. Please request a new confirmation email.' });
          router.replace('/login');
          return true;
        }
      }
      
      // Method 3: Wait for automatic verification (Supabase might handle it)
      return new Promise<boolean>((resolve) => {
        setTimeout(async () => {
          await refreshUser();
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            router.replace('/(tabs)/log');
            resolve(true);
          } else {
            showToast({ type: 'error', message: t('auth.confirmationEmailInvalid') || 'Could not verify email. Please request a new confirmation email.' });
            router.replace('/login');
            resolve(true);
          }
        }, 1500);
      });
    };

    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      // Ignore Expo development server URLs (exp://)
      if (url.startsWith('exp://')) {
        return;
      }

      // Prevent duplicate processing
      if (processedUrls.has(url)) {
        return;
      }
      processedUrls.add(url);
      
      // Clean up old URLs from the set (keep last 10)
      if (processedUrls.size > 10) {
        const urlsArray = Array.from(processedUrls);
        urlsArray.slice(0, urlsArray.length - 10).forEach(u => processedUrls.delete(u));
      }

      // Set flag immediately to prevent catch-all route from showing not-found
      isProcessingDeepLinkRef.current = true;
      let handled = false;

      // Handle direct confirmation links (no browser redirect)
      // Format: respondr://auth/confirm?token_hash=...&type=signup
      // OR: respondr://auth-callback?token_hash=...&type=signup
      // NOTE: Password reset (type=recovery) is handled separately below
      if ((url.includes('auth/confirm') || url.includes('/auth/confirm') || (url.includes('auth-callback') && (url.includes('type=signup') || url.includes('type=email')))) 
          && !url.includes('type=recovery') && !url.includes('reset-password')) {
        handled = true;
        try {
          const urlObj = new URL(url);
          const result = await handleEmailConfirmation(url, urlObj);
          if (!result) {
            // If handler returns false, it means it couldn't process the link
            console.error('Email confirmation handler returned false');
            router.replace('/not-found' as any);
          }
        } catch (error) {
          console.error('=== DIRECT CONFIRMATION EXCEPTION ===', error);
          showToast({ type: 'error', message: t('auth.confirmationEmailInvalid') || 'Failed to process confirmation link.' });
          router.replace('/login');
        }
      }
      // Check if this is an OAuth callback or email confirmation (redirect flow)
      else if (url.includes('auth-callback')) {
        handled = true;
        try {
          const urlObj = new URL(url);
          // Check if it's an email confirmation (type=signup) or OAuth
          if (url.includes('type=signup') || url.includes('type=email')) {
            const result = await handleEmailConfirmation(url, urlObj);
            if (!result) {
              console.error('Email confirmation handler returned false for auth-callback');
              router.replace('/not-found' as any);
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
      // Handle password reset links
      // Format: respondr://reset-password#access_token=...&refresh_token=...&type=recovery
      // OR: respondr://auth/confirm?token_hash=...&type=recovery
      else if (url.includes('reset-password') || (url.includes('type=recovery') && !url.includes('type=signup'))) {
        handled = true;
        
        try {
          const urlObj = new URL(url);
          
          // Extract tokens from hash (fragment) - this is where Supabase puts them after redirect
          const hash = urlObj.hash.substring(1); // Remove the '#' prefix
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type') || urlObj.searchParams.get('type') || 'recovery';
          
          // Extract token_hash from various locations
          const tokenHash = urlObj.searchParams.get('token_hash') || 
                           hashParams.get('token_hash') ||
                           urlObj.hash.match(/token_hash=([^&]+)/)?.[1];
          
          // Method 1: Direct session tokens (preferred - fastest)
          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: decodeURIComponent(accessToken),
              refresh_token: decodeURIComponent(refreshToken),
            });
            
            if (sessionError) {
              console.error('Password reset session error:', sessionError);
              showToast({ type: 'error', message: t('auth.invalidResetLink') || 'Invalid or expired reset link. Please request a new password reset.' });
              router.replace('/login');
            } else if (sessionData?.session) {
              await refreshUser();
              router.replace({
                pathname: '/reset-password',
                params: { url },
              });
            } else {
              console.error('No session after setting tokens');
              router.replace('/login');
            }
          }
          // Method 2: Token hash verification (use verifyOtp to create session)
          else if (tokenHash) {
            try {
              const decodedToken = decodeURIComponent(tokenHash);
              const { data, error } = await supabase.auth.verifyOtp({
                token_hash: decodedToken,
                type: 'recovery',
              });
              
              if (error) {
                console.error('Password reset OTP verification error:', error);
                showToast({ type: 'error', message: t('auth.invalidResetLink') || 'Invalid or expired reset link. Please request a new password reset.' });
                router.replace('/login');
              } else if (data?.session) {
                await refreshUser();
                router.replace({
                  pathname: '/reset-password',
                  params: { url },
                });
              } else {
                console.error('No session after OTP verification');
                // Check if session was created anyway
                const { data: sessionCheck } = await supabase.auth.getSession();
                if (sessionCheck?.session) {
                  await refreshUser();
                  router.replace({
                    pathname: '/reset-password',
                    params: { url },
                  });
                } else {
                  showToast({ type: 'error', message: t('auth.invalidResetLink') || 'Could not create session. Please request a new password reset.' });
                  router.replace('/login');
                }
              }
            } catch (verifyError) {
              console.error('Password reset OTP verification exception:', verifyError);
              showToast({ type: 'error', message: t('auth.invalidResetLink') || 'Failed to verify reset link. Please request a new password reset.' });
              router.replace('/login');
            }
          } else {
            // No tokens found - show error
            console.error('No tokens found in password reset link:', {
              hasHash: !!hash,
              hashLength: hash?.length,
              hasTokenHash: !!tokenHash,
              searchParams: Object.fromEntries(urlObj.searchParams),
            });
            showToast({ type: 'error', message: t('auth.invalidResetLink') || 'Invalid reset link format. Please request a new password reset.' });
            router.replace('/login');
          }
        } catch (error) {
          console.error('Password reset deep link error:', error);
          showToast({ type: 'error', message: t('auth.invalidResetLink') || 'Failed to process reset link. Please request a new password reset.' });
          router.replace('/login');
        }
      }
      // Handle password changed confirmation (just redirect to login)
      else if (url.includes('password-changed') || url.includes('passwordChanged') || url.includes('password_changed')) {
        handled = true;
        router.replace('/login');
      }
      // Check if this is an email confirmation link (generic catch-all)
      // Only process if not already handled by more specific handlers above
      else if (!handled && (url.includes('confirm') || url.includes('verify') || url.includes('token=') || url.includes('token_hash=') || url.includes('type=signup') || url.includes('type=email'))) {
        // Skip if it's a password reset (handled separately)
        if (!url.includes('type=recovery') && !url.includes('reset-password')) {
          handled = true;
          try {
            const urlObj = new URL(url);
            const result = await handleEmailConfirmation(url, urlObj);
            if (!result) {
              console.error('Email confirmation handler returned false for generic pattern');
              router.replace('/not-found' as any);
            }
          } catch (error) {
            console.error('Email confirmation error:', error);
            router.replace('/login');
          }
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
      
      // If deep link was not handled (invalid/unknown), show not found screen
      if (!handled) {
        console.warn('Invalid or unknown deep link:', url);
        router.replace('/not-found' as any);
      }
      
      // Reset flag after processing (with a small delay to allow navigation to complete)
      setTimeout(() => {
        isProcessingDeepLinkRef.current = false;
      }, 3000);
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
  // NOTE: This runs AFTER deep link handling, so email confirmation deep links are processed first
  useEffect(() => {
    if (isLoading) return;
    
    // Don't run auth redirects if we're currently processing a deep link
    // This prevents interference with email confirmation processing
    if (isProcessingDeepLinkRef.current) {
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthScreens = segments[0] === 'login' || segments[0] === 'register';
    const inConfirmEmail = segments[0] === 'confirm-email';
    const inResetPassword = segments[0] === 'reset-password';
    const inNotLoggedIn = (segments[0] as string) === 'not-logged-in';
    const inNotFound = (segments[0] as string) === 'not-found';
    // Protected screens that require authentication
    const inProtectedScreens = segments[0] === 'settings' ||
                                segments[0] === 'edit-profile' ||
                                segments[0] === 'badges' ||
                                segments[0] === 'my-activities';

    // If not authenticated and trying to access protected content
    // BUT: Don't redirect if we're on auth screens (login, register, confirm-email, reset-password, not-found, not-logged-in)
    if (!isAuthenticated && (inAuthGroup || inProtectedScreens)) {
      // Redirect to login screen instead of not-logged-in
      // But only if we're not already on an auth-related screen
      if (!inNotLoggedIn && !inAuthScreens && !inConfirmEmail && !inResetPassword && !inNotFound) {
        router.replace('/login' as any);
      }
    } else if (isAuthenticated && inAuthScreens) {
      // Redirect to main app if authenticated and on login/register screens only
      router.replace('/(tabs)/log');
    } else if (isAuthenticated && inNotLoggedIn) {
      // If authenticated but on not-logged-in screen, go to home
      router.replace('/(tabs)/log');
    }
    // Don't redirect from confirm-email or reset-password screens - let user stay there
    // Don't redirect from register screen when not authenticated (user might be registering)
    // Don't redirect from not-found screen
  }, [isAuthenticated, segments, isLoading, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-email" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="not-found" options={{ headerShown: false }} />
      <Stack.Screen name="not-logged-in" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ presentation: "modal", gestureEnabled: true }} />
      <Stack.Screen name="edit-profile" options={{ presentation: "modal", gestureEnabled: true }} />
      <Stack.Screen name="badges" options={{ headerShown: false }} />
      <Stack.Screen name="my-activities" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-settings" options={{ presentation: "modal", gestureEnabled: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}
