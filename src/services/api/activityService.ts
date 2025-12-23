/**
 * ACTIVITY SERVICE
 * 
 * API service for activity-related operations.
 */

import { API_ENDPOINTS } from '../../config/api';
import { Activity } from '../../types';
import {
    ActivityFilter,
    AddCommentRequest,
    AddReactionRequest,
    CreateActivityRequest,
    PaginatedResponse,
    UpdateActivityRequest,
} from '../../types/api';
import { apiClient, unwrapResponse } from './client';

class ActivityService {
  /**
   * Get activity feed
   */
  async getFeed(filter: 'all' | 'unit' | 'mine' = 'all'): Promise<Activity[]> {
    const response = await apiClient.get<Activity[]>(
      API_ENDPOINTS.ACTIVITIES.FEED,
      { visibility: filter }
    );
    return unwrapResponse(response);
  }
  
  /**
   * Get activities with filters
   */
  async getActivities(filter?: ActivityFilter): Promise<PaginatedResponse<Activity>> {
    const response = await apiClient.get<PaginatedResponse<Activity>>(
      API_ENDPOINTS.ACTIVITIES.LIST,
      filter as any
    );
    return unwrapResponse(response);
  }
  
  /**
   * Get activity by ID
   */
  async getActivity(id: string): Promise<Activity> {
    const response = await apiClient.get<Activity>(
      API_ENDPOINTS.ACTIVITIES.BY_ID(id)
    );
    return unwrapResponse(response);
  }
  
  /**
   * Create new activity
   */
  async createActivity(request: CreateActivityRequest): Promise<Activity> {
    const response = await apiClient.post<Activity>(
      API_ENDPOINTS.ACTIVITIES.CREATE,
      request
    );
    return unwrapResponse(response);
  }
  
  /**
   * Update activity
   */
  async updateActivity(request: UpdateActivityRequest): Promise<Activity> {
    const { id, ...updates } = request;
    const response = await apiClient.put<Activity>(
      API_ENDPOINTS.ACTIVITIES.BY_ID(id),
      updates
    );
    return unwrapResponse(response);
  }
  
  /**
   * Delete activity
   */
  async deleteActivity(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ACTIVITIES.BY_ID(id));
  }
  
  /**
   * Add reaction to activity
   */
  async addReaction(request: AddReactionRequest): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.REACTIONS.ADD(request.activityId),
      { type: request.type }
    );
  }
  
  /**
   * Remove reaction from activity
   */
  async removeReaction(activityId: string, reactionType: string): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.REACTIONS.REMOVE(activityId, reactionType)
    );
  }
  
  /**
   * Add comment to activity
   */
  async addComment(request: AddCommentRequest): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.COMMENTS.ADD(request.activityId),
      { content: request.content }
    );
  }
  
  /**
   * Update comment
   */
  async updateComment(commentId: string, content: string): Promise<void> {
    await apiClient.put(
      API_ENDPOINTS.COMMENTS.UPDATE(commentId),
      { content }
    );
  }
  
  /**
   * Delete comment
   */
  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.COMMENTS.DELETE(commentId));
  }
}

export const activityService = new ActivityService();

