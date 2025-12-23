/**
 * SUPABASE AUTHENTICATION SERVICE
 * 
 * Handles all authentication operations with Supabase Auth.
 */

import { supabase } from '../../config/supabase';
import { UserProfile } from '../../types';
import { storeUser } from '../auth/authStorage';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpData): Promise<UserProfile> => {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  // 2. Create profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: data.email,
      display_name: data.displayName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return mapProfileToUserProfile(profile);
};

/**
 * Sign in an existing user
 */
export const signIn = async (data: SignInData): Promise<UserProfile> => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign in failed');

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) throw profileError;

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
    .single();

  if (error) throw error;

  return mapProfileToUserProfile(profile);
};

/**
 * Update the current user's profile
 */
export const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('No authenticated user');

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      display_name: updates.displayName,
      first_name: updates.firstName,
      last_name: updates.lastName,
      bio: updates.bio,
      organization: updates.organization,
      rank: updates.rank,
      location: updates.location,
      avatar: updates.avatar,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;

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
    .single();

  if (profileError) {
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

  // Note: Actual deletion should be processed by admin or automated job
  // For immediate deletion (use with caution):
  // await supabase.rpc('anonymize_user_data', { user_uuid: user.id });
}

/**
 * Updates user privacy preferences.
 */
export async function updatePrivacySettings(settings: {
  profileVisibility?: 'public' | 'unit' | 'private';
  activityVisibility?: 'public' | 'unit' | 'private';
  showStatistics?: boolean;
  showLocation?: boolean;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      profile_visibility: settings.profileVisibility,
      activity_visibility: settings.activityVisibility,
      show_statistics: settings.showStatistics,
      show_location: settings.showLocation,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }
}

