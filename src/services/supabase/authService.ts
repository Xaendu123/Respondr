/**
 * SUPABASE AUTHENTICATION SERVICE
 * 
 * Handles all authentication operations with Supabase Auth.
 */

import { supabase } from '../../config/supabase';
import i18n from '../../i18n/config';
import { UserProfile } from '../../types';
import { storeUser } from '../auth/authStorage';

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Extract display name from email address
 * Example: alex_bugnon@bluewin.ch -> alex_bugnon
 * Example: john.doe@example.com -> john.doe
 */
function extractDisplayNameFromEmail(email: string | undefined | null): string {
  if (!email) return 'User';
  
  // Extract the part before @
  const localPart = email.split('@')[0];
  if (!localPart) return 'User';
  
  return localPart;
}

/**
 * Sign up a new user
 * Supabase will return an error if the email already exists
 */
export const signUp = async (data: SignUpData): Promise<{ user: UserProfile | null; email: string; needsConfirmation: boolean }> => {
  
  // Get current language preference from i18n (defaults to 'en' if not set)
  const currentLanguage = i18n.language || 'en';
  
  // 1. Create auth user
  // Supabase will return an error if the email already exists
  let { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        language: currentLanguage, // Add language preference for email templates
      },
      emailRedirectTo: 'respondr://auth/confirm',
    },
  });

  if (authError) {
    console.error('=== AUTH SIGNUP ERROR ===', {
      message: authError.message,
      status: authError.status,
      code: authError.code,
      name: authError.name,
      fullError: JSON.stringify(authError, null, 2),
    });
    
    // Check if error is due to existing email
    // When Confirm email is disabled, Supabase returns: "User already registered"
    const errorMessage = (authError.message || '').toLowerCase();
    const errorCode = authError.status || authError.code || '';
    
    // Check for Supabase's exact error message for existing users
    if (
      errorMessage.includes('a user with this email address has already been registered') ||
      errorMessage.includes('email address has already been registered') ||
      errorMessage.includes('already been registered') ||
      errorMessage.includes('already registered') ||
      errorMessage.includes('user already registered') ||
      errorMessage.includes('email address is already registered') ||
      errorMessage.includes('email already registered') ||
      errorMessage.includes('user already exists') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('email already')
    ) {
      throw new Error('User already registered');
    }
    
    // Check error code (Supabase might use specific status codes)
    // 422 = Unprocessable Entity (often used for validation errors like duplicate email)
    if (errorCode === 422 || errorCode === '422') {
      throw new Error('User already registered');
    }
    
    // Handle 500 errors - might be database trigger issues
    // If it's an unexpected_failure, it could be the profile creation trigger failing
    if (authError.status === 500 || authError.code === 'unexpected_failure') {
      // Check if user was actually created despite the error
      // Sometimes Supabase creates the user but the trigger fails
      // First check if authData has a user (might be present even with error)
      if (authData?.user) {
        console.warn('Auth signup returned 500 error but user object exists, attempting to continue...');
        // User exists in response - clear error and continue
        authError = null;
      } else {
        // Try to get user from session (might have been created)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          console.warn('Auth signup returned 500 error but session exists, attempting to continue...');
          authData = { user: sessionData.session.user, session: sessionData.session };
          authError = null;
        } else {
          // Try getUser as last resort
          const { data: checkAuthData } = await supabase.auth.getUser();
          if (checkAuthData?.user) {
            console.warn('Auth signup returned 500 error but user was found, attempting to continue...');
            authData = { user: checkAuthData.user, session: null };
            authError = null;
          } else {
            // User wasn't created - this is a real error
            throw new Error(`Signup failed: ${authError.message || 'An unexpected error occurred. Please try again.'}`);
          }
        }
      }
    } else {
      // For other errors, throw as-is
      throw authError;
    }
  }
  
  // CRITICAL: When Confirm email is enabled and user already exists,
  // Supabase returns a fake/obfuscated user object with empty identities array
  // See: https://supabase.com/docs/reference/javascript/auth-signup
  if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
    throw new Error('User already registered');
  }
  
  if (!authData.user) {
    throw new Error('User creation failed');
  }

  // 2. Check if email confirmation is required
  // Even if a session exists, we need to check if the email is confirmed
  // Supabase may create a session immediately but email confirmation is still required
  const isEmailConfirmed = authData.user.email_confirmed_at !== null && 
                           authData.user.email_confirmed_at !== undefined;
  
  // Also check session to be safe
  const { data: sessionData } = await supabase.auth.getSession();
  const hasValidSession = sessionData?.session !== null && sessionData?.session !== undefined;
  
  // Email confirmation is required if:
  // 1. Email is not confirmed, OR
  // 2. No valid session exists
  if (!isEmailConfirmed || !hasValidSession) {
    // Email confirmation is required
    // The trigger should have created the profile, but we can't verify it due to RLS
    // (RLS blocks reads when user doesn't have a session or email isn't confirmed)
    // This is fine - the profile exists, we just can't read it until email is confirmed
    return {
      user: null,
      email: data.email,
      needsConfirmation: true,
    };
  }

  // 3. We have a session - wait for profile creation (trigger handles it automatically)
  // The handle_new_user() trigger should create the profile immediately after user creation
  // We wait with exponential backoff to allow the trigger to complete
  let profile = await waitForProfileCreation(authData.user.id);
  
  if (!profile) {
    // Final check if profile exists (trigger might have created it but query was too fast)
    const { data: checkProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (checkError) {
      // PGRST116 = not found, which is expected if trigger didn't run
      // 42501 = insufficient privilege (RLS blocking read) - this is OK, profile exists but we can't read it yet
      // Other errors might be recoverable
      if (checkError.code === 'PGRST116') {
        // Not found - profile doesn't exist, will create it below
      } else if (checkError.code === '42501' || checkError.message?.includes('permission denied') || checkError.message?.includes('row-level security')) {
        // RLS blocking read - profile likely exists but we can't read it without proper session
        // This is OK - the trigger created it, we just can't verify it
        // Return early - profile exists but we can't read it yet (will be available after email confirmation)
        return {
          user: null,
          email: data.email,
          needsConfirmation: true,
        };
      } else {
        // Other errors - log but don't throw yet, try to create profile as fallback
        console.warn('Profile check error (non-critical):', {
          code: checkError.code,
          message: checkError.message,
          details: checkError,
        });
      }
    }

    if (!checkProfile) {
      // Profile was not created by trigger - try to create it manually as fallback
      console.warn('Profile not created by trigger, attempting manual creation as fallback');
      
      try {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email || data.email,
            display_name: authData.user.user_metadata?.display_name || 
                          extractDisplayNameFromEmail(authData.user.email || data.email),
            first_name: authData.user.user_metadata?.first_name || data.firstName,
            last_name: authData.user.user_metadata?.last_name || data.lastName,
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create profile manually:', createError);
          // Check if it's a duplicate key error (profile was created by trigger but query was too fast)
          if (createError.code === '23505') {
            // Duplicate key - profile exists, try to fetch it again
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();
            
            if (existingProfile) {
              profile = existingProfile;
            } else {
              throw new Error(
                'Database error saving new user: Profile creation failed. ' +
                'Please contact support if this issue persists.'
              );
            }
          } else {
            throw new Error(
              `Database error saving new user: ${createError.message || 'Profile creation failed'}. ` +
              'Please contact support if this issue persists.'
            );
          }
        } else if (newProfile) {
          profile = newProfile;
        } else {
          throw new Error(
            'Database error saving new user: Profile was not created automatically. ' +
            'Please contact support if this issue persists.'
          );
        }
      } catch (fallbackError: any) {
        console.error('Fallback profile creation failed:', fallbackError);
        throw new Error(
          `Database error saving new user: ${fallbackError.message || 'Profile creation failed'}. ` +
          'Please contact support if this issue persists.'
        );
      }
    } else {
      profile = checkProfile;
    }
  }
  
  // User is signed in (email confirmation not required or auto-confirmed)
  return {
    user: mapProfileToUserProfile(profile),
    email: data.email,
    needsConfirmation: false,
  };
  
};

/**
 * Helper to wait for profile creation after signup (due to trigger)
 * The handle_new_user() trigger should create the profile automatically.
 * We poll with exponential backoff to allow the trigger to complete.
 * 
 * @param userId - The user ID to check for
 * @param retries - Number of retry attempts (default: 8, increased for reliability)
 * @param initialDelay - Initial delay in ms (default: 100ms, increases exponentially)
 */
async function waitForProfileCreation(userId: string, retries = 8, initialDelay = 100): Promise<any | null> {
  for (let i = 0; i < retries; i++) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile && !error) {
      return profile;
    }
    
    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms, 3200ms, 6400ms, 12800ms
    const delay = initialDelay * Math.pow(2, i);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return null;
}

/**
 * Sign in an existing user
 */
export const signIn = async (data: SignInData): Promise<UserProfile> => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    const errorMessage = (authError.message || '').toLowerCase();
    
    // Check if error is due to invalid credentials (user doesn't exist or wrong password)
    // Supabase returns "Invalid login credentials" for both cases (security best practice)
    if (
      errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('invalid credentials') ||
      errorMessage.includes('email not found') ||
      errorMessage.includes('user not found') ||
      authError.status === 400
    ) {
      // Check if it's specifically an email confirmation issue
      // by checking if the user exists but email is not confirmed
      // We can't distinguish between "user doesn't exist" and "wrong password" for security
      // But we can check if it's an email confirmation issue by trying to get user info
      // However, Supabase doesn't expose this, so we'll treat all invalid credentials
      // as either wrong password or user doesn't exist
      
      // Only treat as email confirmation if the error specifically mentions it
      if (
        errorMessage.includes('email not confirmed') ||
        errorMessage.includes('email not verified') ||
        errorMessage.includes('email confirmation') ||
        errorMessage.includes('confirm your email')
      ) {
        // Create a custom error that indicates email confirmation is needed
        const confirmationError: any = new Error('Email not confirmed');
        confirmationError.code = 'EMAIL_NOT_CONFIRMED';
        confirmationError.email = data.email;
        throw confirmationError;
      }
      
      // For invalid credentials, throw a generic error (don't reveal if user exists)
      const invalidCredsError: any = new Error('Invalid email or password');
      invalidCredsError.code = 'INVALID_CREDENTIALS';
      throw invalidCredsError;
    }
    
    throw authError;
  }
  
  if (!authData.user) throw new Error('Sign in failed');

  // Check if email is confirmed
  if (!authData.user.email_confirmed_at) {
    // Email is not confirmed - throw error to redirect to confirm-email screen
    const confirmationError: any = new Error('Email not confirmed');
    confirmationError.code = 'EMAIL_NOT_CONFIRMED';
    confirmationError.email = authData.user.email || data.email;
    throw confirmationError;
  }

  // Wait a moment for the session to be fully established (RLS needs this)
  // This ensures the auth context is properly set before querying the profile
  await new Promise(resolve => setTimeout(resolve, 100));

  // Get user profile with retry logic (RLS might need a moment to recognize the session)
  let profile = null;
  let profileError = null;
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data: profileData, error: error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (error) {
      profileError = error;
      // Check if error is "Cannot coerce the result to a single JSON object"
      if (error.message?.includes('Cannot coerce') || error.message?.includes('multiple rows')) {
        console.error('Multiple profiles found for user:', authData.user.id);
        // Try to get the first one
        const { data: profiles, error: multiError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .limit(1);
        
        if (multiError || !profiles || profiles.length === 0) {
          // Profile doesn't exist - try to create it
          break;
        }
        
        // Use the first profile and log a warning
        console.warn('Using first profile from multiple results:', profiles[0].id);
        return mapProfileToUserProfile(profiles[0]);
      }
      
      // For RLS or other errors, retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = 200 * Math.pow(2, attempt); // 200ms, 400ms, 800ms
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    } else if (profileData) {
      profile = profileData;
      break;
    } else {
      // Profile is null - doesn't exist, try to create it
      break;
    }
  }
  
  // If profile still not found, try to create it as fallback
  if (!profile) {
    console.warn('Profile not found for user after sign in, attempting to create it:', authData.user.id);
    
    try {
      // Extract display name from email if not available in metadata
      // Note: SignInData doesn't have displayName, so we only use metadata or email
      const displayName = authData.user.user_metadata?.display_name || 
                          extractDisplayNameFromEmail(authData.user.email || data.email);
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email || data.email,
          display_name: displayName,
        })
        .select()
        .single();
      
      if (createError) {
        // Check if it's a duplicate key error (profile was created by trigger but query was too fast)
        if (createError.code === '23505') {
          // Duplicate key - profile exists, try to fetch it again
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();
          
          if (fetchError) {
            console.error('Failed to fetch profile after duplicate key error:', fetchError);
            throw new Error(`Failed to retrieve user profile: ${fetchError.message || 'Profile query failed'}. Please try signing in again.`);
          }
          
          if (existingProfile) {
            return mapProfileToUserProfile(existingProfile);
          }
        }
        
        console.error('Failed to create profile:', createError);
        throw new Error(`Failed to create user profile: ${createError.message || 'Profile creation failed'}. Please contact support.`);
      }
      
      if (newProfile) {
        return mapProfileToUserProfile(newProfile);
      }
    } catch (fallbackError: any) {
      console.error('Profile creation fallback failed:', fallbackError);
      // If creation fails, throw the original error or a helpful message
      if (profileError) {
        throw new Error(`User profile not found and could not be created: ${profileError.message || 'Profile query failed'}. Please contact support.`);
      }
      throw fallbackError;
    }
  }
  
  // If we still don't have a profile, throw an error
  if (!profile) {
    throw new Error('User profile not found and could not be created. Please contact support.');
  }

  return mapProfileToUserProfile(profile);
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get the current session
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * Get the current user profile
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    // Check if error is "Cannot coerce the result to a single JSON object"
    if (error.message?.includes('Cannot coerce') || error.message?.includes('multiple rows')) {
      console.error('Multiple profiles found for user:', user.id);
      // Try to get the first one
      const { data: profiles, error: multiError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .limit(1);
      
      if (multiError || !profiles || profiles.length === 0) {
        return null;
      }
      
      console.warn('Using first profile from multiple results:', profiles[0].id);
      return mapProfileToUserProfile(profiles[0]);
    }
    throw error;
  }

  if (!profile) {
    return null;
  }

  return mapProfileToUserProfile(profile);
};

/**
 * Update the current user's profile
 */
export const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  // Build update object, only including defined fields
  const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.showFullName !== undefined) updateData.show_full_name = updates.showFullName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.organization !== undefined) updateData.organization = updates.organization;
    if (updates.rank !== undefined) updateData.rank = updates.rank;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.unitId !== undefined) updateData.unit_id = updates.unitId;
    // Handle avatar: include it if it's null (to delete) or a string (to update)
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  
  // Update auth metadata if language preference changed
  // This ensures email templates use the correct language
  if (updates.preferences?.language !== undefined) {
    const currentMetadata = user.user_metadata || {};
    await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        language: updates.preferences.language,
      },
    });
  }

  return mapProfileToUserProfile(profile);
};

/**
 * Map Supabase profile to app UserProfile type
 */
const mapProfileToUserProfile = (profile: any): UserProfile => {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    firstName: profile.first_name || undefined,
    lastName: profile.last_name || undefined,
    showFullName: profile.show_full_name !== undefined ? profile.show_full_name : true, // Default to true if not set
    avatar: profile.avatar || undefined,
    bio: profile.bio || undefined,
    organization: profile.organization || undefined,
    rank: profile.rank || undefined,
    location: profile.location || undefined,
    unitId: profile.unit_id || undefined,
    role: 'member', // Default role
    stats: {
      totalActivities: 0,
      totalHours: 0,
      activitiesByType: {
        training: 0,
        exercise: 0,
        operation: 0,
      },
      activitiesThisMonth: 0,
      activitiesThisYear: 0,
    },
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    preferences: {
      theme: 'system',
      language: 'de',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
    },
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  };
};

/**
 * Signs in with Google OAuth.
 */
export async function signInWithGoogle(): Promise<{ url: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'respondr://auth-callback',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.url) {
    throw new Error('No OAuth URL returned.');
  }

  return { url: data.url };
}

/**
 * Signs in with Apple OAuth.
 */
export async function signInWithApple(): Promise<{ url: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: 'respondr://auth-callback',
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.url) {
    throw new Error('No OAuth URL returned.');
  }

  return { url: data.url };
}

/**
 * Handles OAuth callback and completes authentication.
 * Call this when your app is opened via deep link.
 * 
 * @param url - The deep link URL containing auth tokens
 */
export async function handleOAuthCallback(url: string): Promise<UserProfile | null> {
  // Extract tokens from URL and set session
  const { data, error } = await supabase.auth.setSession({
    access_token: extractAccessToken(url),
    refresh_token: extractRefreshToken(url),
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.session) {
    return null;
  }

  // Fetch profile from database
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .maybeSingle();

  if (profileError) {
    // Check if error is "Cannot coerce the result to a single JSON object"
    if (profileError.message?.includes('Cannot coerce') || profileError.message?.includes('multiple rows')) {
      console.error('Multiple profiles found for user:', data.session.user.id);
      // Try to get the first one
      const { data: profiles, error: multiError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .limit(1);
      
      if (multiError || !profiles || profiles.length === 0) {
        throw new Error('User profile not found.');
      }
      
      console.warn('Using first profile from multiple results:', profiles[0].id);
      const userProfile = mapProfileToUserProfile(profiles[0]);
      await storeUser(userProfile);
      return userProfile;
    }
    throw new Error(profileError.message);
  }
  if (!profileData) {
    throw new Error('User profile not found.');
  }

  const userProfile = mapProfileToUserProfile(profileData);
  await storeUser(userProfile);
  return userProfile;
}

/**
 * Helper function to extract access token from OAuth callback URL
 */
function extractAccessToken(url: string): string {
  const match = url.match(/access_token=([^&]+)/);
  if (!match) throw new Error('No access token in URL');
  return match[1];
}

/**
 * Helper function to extract refresh token from OAuth callback URL
 */
function extractRefreshToken(url: string): string {
  const match = url.match(/refresh_token=([^&]+)/);
  if (!match) throw new Error('No refresh token in URL');
  return match[1];
}

/**
 * Requests account deletion (GDPR right to be forgotten).
 */
export async function requestAccountDeletion(reason?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated.');
  }

  // Create deletion request
  // Note: Database trigger will automatically execute anonymize_user_data()
  // when this record is inserted (see supabase/scripts/automate_deletion.sql)
  const { error } = await supabase
    .from('data_deletion_requests')
    .insert({
      user_id: user.id,
      reason: reason || null,
      status: 'pending',
      requested_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(error.message);
  }

  // Sign out the user after deletion request is created
  // The database trigger handles anonymization automatically
  await supabase.auth.signOut();
}

/**
 * Updates user privacy preferences.
 */
export async function updatePrivacySettings(settings: {
  profileVisibility?: 'public' | 'unit' | 'private';
  marketingConsent?: boolean;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated.');
  }

  const updateData: { [key: string]: any } = {
    updated_at: new Date().toISOString(),
  };

  if (settings.profileVisibility !== undefined) {
    updateData.profile_visibility = settings.profileVisibility;
  }

  if (settings.marketingConsent !== undefined) {
    // Explicitly set marketing_consent, even if false
    updateData.marketing_consent = settings.marketingConsent;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select('profile_visibility, marketing_consent')
    .single();

  if (error) {
    console.error('Error updating privacy settings:', error);
    throw new Error(error.message);
  }

}

/**
 * Send password reset email
 * @param email - User's email address
 */
export const resetPassword = async (email: string): Promise<void> => {
  // Get current language preference from i18n (defaults to 'en' if not set)
  const currentLanguage = i18n.language || 'en';
  
  // Try to update user metadata with current language if user is logged in
  // This ensures the email uses the correct language
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const currentMetadata = user.user_metadata || {};
      // Only update if language is different or missing
      if (currentMetadata.language !== currentLanguage) {
        await supabase.auth.updateUser({
          data: {
            ...currentMetadata,
            language: currentLanguage,
          },
        });
      }
    }
  } catch (error) {
    // User might not be logged in - that's okay, Supabase will use existing metadata
    // Silently continue - the email will use whatever language is in the user's metadata
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: 'respondr://auth/confirm',
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Resend email confirmation
 * @param email - User's email address
 */
export const resendConfirmationEmail = async (email: string): Promise<void> => {
  // Get current language preference from i18n (defaults to 'en' if not set)
  const currentLanguage = i18n.language || 'en';
  
  // Try to update user metadata with current language if user is logged in
  // This ensures the email uses the correct language
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const currentMetadata = user.user_metadata || {};
      // Only update if language is different or missing
      if (currentMetadata.language !== currentLanguage) {
        await supabase.auth.updateUser({
          data: {
            ...currentMetadata,
            language: currentLanguage,
          },
        });
      }
    }
  } catch (error) {
    // User might not be logged in - that's okay, Supabase will use existing metadata
    // Silently continue - the email will use whatever language is in the user's metadata
  }
  
  // Don't specify emailRedirectTo - let Supabase use the default configured in dashboard
  // This ensures it matches what was used during signup
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });

  if (error) {
    // Handle rate limiting gracefully
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
      // Extract cooldown time from error message if available
      // Message format: "For security purposes, you can only request this after X seconds."
      const cooldownMatch = error.message?.match(/(\d+)\s*seconds?/i);
      const cooldownSeconds = cooldownMatch ? parseInt(cooldownMatch[1], 10) : 60;
      
      // Create a custom error with cooldown information
      const rateLimitError: any = new Error(error.message || 'Email rate limit exceeded');
      rateLimitError.code = 'RATE_LIMIT';
      rateLimitError.cooldownSeconds = cooldownSeconds;
      throw rateLimitError;
    }
    
    console.error('=== RESEND ERROR ===', {
      message: error.message,
      code: error.code,
      status: error.status,
      fullError: JSON.stringify(error, null, 2),
    });
    throw new Error(error.message || 'Failed to resend confirmation email');
  }
}

