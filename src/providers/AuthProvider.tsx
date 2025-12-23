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
  register: (request: RegisterRequest) => Promise<void>;
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
  
  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        await loadUserProfile();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  /**
   * Initialize authentication state from Supabase session
   */
  async function initializeAuth() {
    try {
      const session = await supabaseAuth.getSession();
      if (session) {
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
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
   */
  async function register(request: RegisterRequest): Promise<void> {
    try {
      setIsLoading(true);
      setError(null);
      
      const userProfile = await supabaseAuth.signUp({
        email: request.email,
        password: request.password,
        displayName: request.displayName,
        organization: request.organization,
      });
      setUser(userProfile);
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
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

