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
    // Track processed URLs to prevent duplicate handling
    const processedUrls = new Set<string>();
    
    const handleEmailConfirmation = async (url: string, urlObj: URL): Promise<boolean> => {
      // Check if user is already authenticated
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.session) {
        // User is already logged in - navigate to home
        await refreshUser();
        router.replace('/(tabs)/log');
        return true;
      }

      // Extract tokens from various possible locations
      const tokenHash = urlObj.searchParams.get('token_hash') || 
                       urlObj.hash.match(/token_hash=([^&]+)/)?.[1] ||
                       urlObj.searchParams.get('token');
      
      const type = urlObj.searchParams.get('type') || 
                   urlObj.hash.match(/type=([^&]+)/)?.[1] || 
                   'signup';
      
      // Check for direct session tokens in hash (alternative format)
      const accessToken = urlObj.hash.match(/access_token=([^&]+)/)?.[1];
      const refreshToken = urlObj.hash.match(/refresh_token=([^&]+)/)?.[1];
      
      // Helper function to verify OTP with retry logic
      const verifyOtpWithRetry = async (token: string, otpType: string, retries = 2): Promise<{ success: boolean; session: any }> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const decodedToken = decodeURIComponent(token);
            
            // For signup confirmations, ensure we use 'signup' type
            const finalOtpType = (otpType === 'signup' || type === 'signup') ? 'signup' : otpType;
            
            console.log(`Verifying OTP (attempt ${attempt + 1}/${retries + 1}):`, { 
              type: finalOtpType, 
              tokenLength: decodedToken.length 
            });
            
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: decodedToken,
              type: finalOtpType as any,
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
                  console.log('User already authenticated despite error, using existing session');
                  return { success: true, session: sessionData.session };
                }
                
                // If it's the last attempt, return the error
                if (attempt === retries) {
                  return { success: false, session: null };
                }
              } else {
                // For other errors, retry if we have attempts left
                if (attempt < retries) {
                  console.log(`Retrying OTP verification in ${1000 * (attempt + 1)}ms...`);
                  await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                  continue;
                }
                return { success: false, session: null };
              }
            }
            
            if (data?.session) {
              console.log('OTP verified successfully, session created:', {
                userId: data.session.user?.id,
                emailConfirmed: !!data.session.user?.email_confirmed_at
              });
              return { success: true, session: data.session };
            } else {
              console.warn('OTP verification returned no session');
              // Check if session was created anyway
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                console.log('Session found after verification, using it');
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
          console.log('Setting session from direct tokens (email confirmation)');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: decodeURIComponent(accessToken),
            refresh_token: decodeURIComponent(refreshToken),
          });
          
          if (sessionError) {
            console.error('Email confirmation session error:', sessionError);
            // Fall through to token hash verification
          } else if (sessionData?.session) {
            console.log('Session set from tokens, verifying email confirmation');
            
            // Verify that the user's email is confirmed
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              console.log('User email confirmed:', !!user.email_confirmed_at);
              
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
        const otpType = type === 'recovery' ? 'recovery' : type === 'signup' ? 'signup' : 'email';
        
        console.log('Verifying OTP for email confirmation:', { type: otpType, hasToken: !!tokenHash });
        
        const result = await verifyOtpWithRetry(tokenHash, otpType);
        
        if (result.success && result.session) {
          // OTP verified successfully - session is now set
          console.log('OTP verified successfully, session created');
          
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
            console.log('Email confirmed and user signed in, navigating to home');
            router.replace('/(tabs)/log');
            return true;
          } else {
            console.error('Session lost after OTP verification');
            Alert.alert(
              t('errors.auth'),
              t('auth.confirmationEmailInvalid') || 'Session could not be established. Please try logging in.'
            );
            router.replace('/login');
            return true;
          }
        } else {
          // OTP verification failed - check if user is already authenticated
          console.log('OTP verification failed, checking if user is already authenticated');
          const { data: finalSession } = await supabase.auth.getSession();
          if (finalSession?.session) {
            // User is already authenticated - might have been confirmed by another process
            console.log('User already authenticated, refreshing and navigating');
            await refreshUser();
            router.replace('/(tabs)/log');
            return true;
          }
          
          // Verification failed and no session
          console.error('OTP verification failed and no session found');
          Alert.alert(
            t('errors.auth'),
            t('auth.confirmationEmailInvalid') || 'Invalid or expired confirmation link. Please request a new confirmation email.'
          );
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
            Alert.alert(
              t('errors.auth'),
              t('auth.confirmationEmailInvalid') || 'Could not verify email. Please request a new confirmation email.'
            );
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
        console.log('Skipping already processed URL:', url);
        return;
      }
      processedUrls.add(url);
      
      // Clean up old URLs from the set (keep last 10)
      if (processedUrls.size > 10) {
        const urlsArray = Array.from(processedUrls);
        urlsArray.slice(0, urlsArray.length - 10).forEach(u => processedUrls.delete(u));
      }

      let handled = false;

      // Handle direct confirmation links (no browser redirect)
      // Format: respondr://auth/confirm?token_hash=...&type=signup
      // OR: respondr://auth/confirm?token=...&type=recovery
      if (url.includes('auth/confirm') || url.includes('/auth/confirm')) {
        handled = true;
        try {
          const urlObj = new URL(url);
          await handleEmailConfirmation(url, urlObj);
        } catch (error) {
          console.error('=== DIRECT CONFIRMATION EXCEPTION ===', error);
          Alert.alert(
            t('errors.auth'),
            t('auth.confirmationEmailInvalid') || 'Failed to process confirmation link.'
          );
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
            await handleEmailConfirmation(url, urlObj);
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
      // Check if this is an email confirmation link (generic catch-all)
      // Only process if not already handled by more specific handlers above
      else if (!handled && (url.includes('confirm') || url.includes('verify') || url.includes('token=') || url.includes('type=signup') || url.includes('type=email'))) {
        // Skip if it's a password reset (handled separately)
        if (!url.includes('type=recovery') && !url.includes('reset-password')) {
          handled = true;
          try {
            const urlObj = new URL(url);
            await handleEmailConfirmation(url, urlObj);
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
    const inNotLoggedIn = (segments[0] as string) === 'not-logged-in';
    const inNotFound = (segments[0] as string) === 'not-found';
    // Protected screens that require authentication
    const inProtectedScreens = segments[0] === 'settings' || 
                                segments[0] === 'edit-profile' || 
                                segments[0] === 'badges' || 
                                segments[0] === 'my-activities';

    // If not authenticated and trying to access protected content
    if (!isAuthenticated && (inAuthGroup || inProtectedScreens)) {
      // Show not-logged-in screen instead of redirecting to login
      if (!inNotLoggedIn) {
        router.replace('/not-logged-in' as any);
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
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-email" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="not-found" options={{ headerShown: false }} />
      <Stack.Screen name="not-logged-in" options={{ headerShown: false }} />
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
