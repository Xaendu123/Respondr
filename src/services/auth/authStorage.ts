/**
 * AUTH STORAGE
 * 
 * Secure storage for authentication tokens.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@respondr:auth_token';
const REFRESH_TOKEN_KEY = '@respondr:refresh_token';
const USER_KEY = '@respondr:user';

/**
 * Store authentication tokens
 */
export async function storeAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

/**
 * Get access token
 */
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store user data
 */
export async function storeUser(user: any): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored user data
 */
export async function getStoredUser(): Promise<any | null> {
  const userData = await AsyncStorage.getItem(USER_KEY);
  if (!userData) return null;
  
  const user = JSON.parse(userData);
  
  // Convert date strings back to Date objects
  if (user.createdAt && typeof user.createdAt === 'string') {
    user.createdAt = new Date(user.createdAt);
  }
  if (user.updatedAt && typeof user.updatedAt === 'string') {
    user.updatedAt = new Date(user.updatedAt);
  }
  
  return user;
}

/**
 * Clear all auth data
 */
export async function clearAuthData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}


