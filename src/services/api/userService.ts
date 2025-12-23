/**
 * USER SERVICE
 * 
 * API service for user-related operations.
 */

import { API_ENDPOINTS } from '../../config/api';
import { UserProfile } from '../../types';
import { UpdateProfileRequest } from '../../types/api';
import { apiClient, unwrapResponse } from './client';

class UserService {
  /**
   * Get current user profile
   */
  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(API_ENDPOINTS.USER.ME);
    return unwrapResponse(response);
  }
  
  /**
   * Update current user profile
   */
  async updateMe(request: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>(
      API_ENDPOINTS.USER.ME,
      request
    );
    return unwrapResponse(response);
  }
  
  /**
   * Get user profile by ID
   */
  async getUser(id: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(
      API_ENDPOINTS.USER.BY_ID(id)
    );
    return unwrapResponse(response);
  }
  
  /**
   * Get user statistics
   */
  async getUserStats(id: string): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.USER.STATS(id));
    return unwrapResponse(response);
  }
  
  /**
   * Upload avatar (placeholder - would handle file upload in real implementation)
   */
  async uploadAvatar(imageUri: string): Promise<string> {
    // In real implementation, this would:
    // 1. Convert image to FormData
    // 2. Upload to API
    // 3. Return new avatar URL
    
    // For now, just return the local URI
    return imageUri;
  }
}

export const userService = new UserService();

