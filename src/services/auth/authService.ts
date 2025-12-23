/**
 * AUTH SERVICE
 * 
 * Handles user authentication operations.
 */

import { API_ENDPOINTS } from '../../config/api';
import { LoginRequest, LoginResponse, RegisterRequest } from '../../types/api';
import { apiClient, unwrapResponse } from '../api/client';
import {
    clearAuthData,
    getRefreshToken,
    storeAuthTokens,
    storeUser,
} from './authStorage';

class AuthService {
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password } as LoginRequest,
      { requiresAuth: false }
    );
    
    const data = unwrapResponse(response);
    
    // Store tokens and user data
    await storeAuthTokens(data.accessToken, data.refreshToken);
    await storeUser(data.user);
    
    return data;
  }
  
  /**
   * Register new user
   */
  async register(request: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      request,
      { requiresAuth: false }
    );
    
    const data = unwrapResponse(response);
    
    // Store tokens and user data
    await storeAuthTokens(data.accessToken, data.refreshToken);
    await storeUser(data.user);
    
    return data;
  }
  
  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      await clearAuthData();
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        return false;
      }
      
      const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken },
        { requiresAuth: false }
      );
      
      const data = unwrapResponse(response);
      await storeAuthTokens(data.accessToken, data.refreshToken);
      
      return true;
    } catch (error) {
      // If refresh fails, clear auth data
      await clearAuthData();
      return false;
    }
  }
  
  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
      { requiresAuth: false }
    );
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      { token, newPassword },
      { requiresAuth: false }
    );
  }
}

export const authService = new AuthService();

