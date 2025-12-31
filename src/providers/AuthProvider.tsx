/**
 * AUTH PROVIDER
 * 
 * Manages authentication state and provides auth context to the app.
 * Uses Supabase for authentication and session management.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import * as supabaseAuth from '../services/supabase/authService';
import { UserProfile } from '../types';
import { RegisterRequest } from '../types/api';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (request: RegisterRequest) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize auth state on mount and when app comes to foreground
  useEffect(() => {
    let isMounted = true;
    
    // Initialize auth asynchronously to prevent blocking app load
    initializeAuth()
      .catch((error) => {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      })
      .finally(() => {
        // Ensure loading is always set to false, even if there's an error
        if (isMounted) {
          // Add a small delay to ensure state updates properly
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          }, 100);
        }
      });
    
    return () => {
      isMounted = false;
    };
    
  }, []);
  
  /**
   * Initialize authentication state from Supabase session
   */
  async function initializeAuth() {
    try {
      // Use supabase.auth.getSession() directly to get { data, error } format
      // Wrap in timeout to prevent hanging indefinitely
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => 
        setTimeout(() => resolve({ data: null, error: { message: 'Session check timeout' } }), 8000)
      );
      
      const result = await Promise.race([sessionPromise, timeoutPromise]);
      const { data: sessionData, error: sessionError } = result;
      
      // Handle invalid refresh token error (stale session)
      if (sessionError) {
        // Check if it's an invalid refresh token error
        if (sessionError.message?.includes('Invalid Refresh Token') || 
            sessionError.message?.includes('Refresh Token Not Found')) {
          // Clear the invalid session
          await supabaseAuth.signOut();
          setUser(null);
          return;
        }
        // For other errors, just log and continue (don't block app)
        console.warn('Session error (non-critical):', sessionError.message);
      }
      
      if (sessionData?.session) {
        try {
          await loadUserProfile();
        } catch (profileError: any) {
          // Handle invalid refresh token during profile load
          if (profileError?.message?.includes('Invalid Refresh Token') || 
              profileError?.message?.includes('Refresh Token Not Found')) {
            await supabaseAuth.signOut();
            setUser(null);
          } else {
            console.error('Failed to load user profile:', profileError);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to initialize auth:', error);
      
      // If it's an invalid refresh token error, clear the session
      if (error?.message?.includes('Invalid Refresh Token') || 
          error?.message?.includes('Refresh Token Not Found')) {
        try {
          await supabaseAuth.signOut();
          setUser(null);
        } catch (signOutError) {
          console.error('Failed to sign out:', signOutError);
        }
      }
      
      // Don't block app loading on auth errors
    } finally {
      // Always set loading to false, even if there's an error
      setIsLoading(false);
    }
  }
  
  /**
   * Load user profile from Supabase
   */
  async function loadUserProfile() {
    try {
      const profile = await supabaseAuth.getCurrentUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUser(null);
    }
  }
  
  /**
   * Login user with Supabase
   */
  async function login(email: string, password: string): Promise<void> {
    try {
      setIsLoading(true);
      setError(null);
      
      const userProfile = await supabaseAuth.signIn({ email, password });
      setUser(userProfile);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }
  
  /**
   * Register new user with Supabase
   * Returns email if confirmation is needed, otherwise sets user and returns null
   */
  async function register(request: RegisterRequest): Promise<string | null> {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await supabaseAuth.signUp({
        email: request.email,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
      });
      
      if (result.needsConfirmation) {
        // User needs to confirm email - return email for redirect
        return result.email;
      } else if (result.user) {
        // User is signed in (email confirmation not required or auto-confirmed)
        setUser(result.user);
        // Reload profile to ensure we have the latest data
        await loadUserProfile();
        return null;
      } else {
        throw new Error('Unexpected signup result');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      // Clear user on error
      setUser(null);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }
  
  /**
   * Logout user from Supabase
   */
  async function logout(): Promise<void> {
    try {
      setIsLoading(true);
      await supabaseAuth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }
  
  /**
   * Refresh user profile data from Supabase
   */
  async function refreshUser(): Promise<void> {
    try {
      await loadUserProfile();
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }
  
  /**
   * Clear error message
   */
  function clearError() {
    setError(null);
  }
  
  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    error,
    clearError,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

