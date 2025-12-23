/**
 * BADGE SERVICE
 * 
 * API service for badge-related operations.
 */

import { API_ENDPOINTS } from '../../config/api';
import { Badge } from '../../types';
import { apiClient, unwrapResponse } from './client';

class BadgeService {
  /**
   * Get all badges
   */
  async getAllBadges(): Promise<Badge[]> {
    const response = await apiClient.get<Badge[]>(API_ENDPOINTS.BADGES.LIST);
    return unwrapResponse(response);
  }
  
  /**
   * Get current user's badges (earned and locked)
   */
  async getMyBadges(): Promise<{ earned: Badge[]; locked: Badge[] }> {
    const response = await apiClient.get<{ earned: Badge[]; locked: Badge[] }>(
      API_ENDPOINTS.BADGES.ME
    );
    return unwrapResponse(response);
  }
  
  /**
   * Get badge by ID
   */
  async getBadge(id: string): Promise<Badge> {
    const response = await apiClient.get<Badge>(API_ENDPOINTS.BADGES.BY_ID(id));
    return unwrapResponse(response);
  }
}

export const badgeService = new BadgeService();

