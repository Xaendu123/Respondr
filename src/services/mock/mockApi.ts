/**
 * API SERVICE
 * 
 * Handles all backend API interactions and responses.
 */

import { API_ENDPOINTS } from '../../config/api';
import { Activity, Comment, Reaction } from '../../types';
import { ApiResponse, CreateActivityRequest, LoginRequest, RegisterRequest } from '../../types/api';
import {
  currentMockUser,
  generateMockToken,
  mockActivities,
  mockBadges,
  mockUnits,
  mockUsers,
  setCurrentMockUser
} from './mockData';

// Network delay simulation
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * API Request Handler
 */
export async function mockApiRequest<T = any>(
  method: string,
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  await delay(300);
  
  try {
    // Authentication endpoints
    if (endpoint === API_ENDPOINTS.AUTH.LOGIN) {
      return handleLogin(body as LoginRequest) as ApiResponse<T>;
    }
    
    if (endpoint === API_ENDPOINTS.AUTH.REGISTER) {
      return handleRegister(body as RegisterRequest) as ApiResponse<T>;
    }
    
    if (endpoint === API_ENDPOINTS.AUTH.LOGOUT) {
      return handleLogout() as ApiResponse<T>;
    }
    
    if (endpoint === API_ENDPOINTS.AUTH.REFRESH) {
      return handleRefreshToken(body) as ApiResponse<T>;
    }
    
    // User endpoints
    if (endpoint === API_ENDPOINTS.USER.ME && method === 'GET') {
      return handleGetCurrentUser() as ApiResponse<T>;
    }
    
    if (endpoint === API_ENDPOINTS.USER.ME && method === 'PUT') {
      return handleUpdateUser(body) as ApiResponse<T>;
    }
    
    if (endpoint.startsWith('/api/users/') && endpoint.endsWith('/stats')) {
      const userId = endpoint.split('/')[3];
      return handleGetUserStats(userId) as ApiResponse<T>;
    }
    
    // Activities endpoints
    if (endpoint === API_ENDPOINTS.ACTIVITIES.FEED) {
      return handleGetActivityFeed(body) as ApiResponse<T>;
    }
    
    if (endpoint === API_ENDPOINTS.ACTIVITIES.LIST && method === 'GET') {
      return handleGetActivities(body) as ApiResponse<T>;
    }
    
    if (endpoint === API_ENDPOINTS.ACTIVITIES.CREATE && method === 'POST') {
      return handleCreateActivity(body as CreateActivityRequest) as ApiResponse<T>;
    }
    
    if (endpoint.startsWith('/api/activities/') && method === 'GET') {
      const activityId = endpoint.split('/')[3];
      if (!activityId.includes('/')) {
        return handleGetActivity(activityId) as ApiResponse<T>;
      }
    }
    
    if (endpoint.startsWith('/api/activities/') && method === 'PUT') {
      const activityId = endpoint.split('/')[3];
      return handleUpdateActivity(activityId, body) as ApiResponse<T>;
    }
    
    if (endpoint.startsWith('/api/activities/') && method === 'DELETE') {
      const activityId = endpoint.split('/')[3];
      return handleDeleteActivity(activityId) as ApiResponse<T>;
    }
    
    // Reactions endpoints
    if (endpoint.includes('/reactions') && method === 'POST') {
      const activityId = endpoint.split('/')[3];
      return handleAddReaction(activityId, body) as ApiResponse<T>;
    }
    
    if (endpoint.includes('/reactions') && method === 'DELETE') {
      const parts = endpoint.split('/');
      const activityId = parts[3];
      const reactionType = parts[5];
      return handleRemoveReaction(activityId, reactionType) as ApiResponse<T>;
    }
    
    // Comments endpoints
    if (endpoint.includes('/comments') && method === 'POST') {
      const activityId = endpoint.split('/')[3];
      return handleAddComment(activityId, body) as ApiResponse<T>;
    }
    
    if (endpoint.startsWith('/api/comments/') && method === 'PUT') {
      const commentId = endpoint.split('/')[3];
      return handleUpdateComment(commentId, body) as ApiResponse<T>;
    }
    
    if (endpoint.startsWith('/api/comments/') && method === 'DELETE') {
      const commentId = endpoint.split('/')[3];
      return handleDeleteComment(commentId) as ApiResponse<T>;
    }
    
    // Statistics endpoints
    if (endpoint === API_ENDPOINTS.STATS.ME) {
      return handleGetMyStats() as ApiResponse<T>;
    }
    
    // Badges endpoints
    if (endpoint === API_ENDPOINTS.BADGES.ME) {
      return handleGetMyBadges() as ApiResponse<T>;
    }
    
    if (endpoint === API_ENDPOINTS.BADGES.LIST) {
      return handleGetAllBadges() as ApiResponse<T>;
    }
    
    // Units endpoints
    if (endpoint === API_ENDPOINTS.UNITS.LIST) {
      return handleGetUnits() as ApiResponse<T>;
    }
    
    // Default: Not implemented
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `Mock endpoint not implemented: ${method} ${endpoint}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'MOCK_ERROR',
        message: error instanceof Error ? error.message : 'Mock API error',
      },
    };
  }
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================

function handleLogin(request: LoginRequest): ApiResponse {
  const user = mockUsers.find(u => u.email === request.email);
  
  if (!user) {
    return {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
  }
  
  setCurrentMockUser(user);
  
  return {
    success: true,
    data: {
      accessToken: generateMockToken(),
      refreshToken: generateMockToken(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        unitId: user.unitId,
        role: user.role,
      },
    },
  };
}

function handleRegister(request: RegisterRequest): ApiResponse {
  const newUser = {
    ...mockUsers[0],
    id: `user-${Date.now()}`,
    email: request.email,
    displayName: request.displayName,
    unitId: request.unitId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  mockUsers.push(newUser);
  setCurrentMockUser(newUser);
  
  return {
    success: true,
    data: {
      accessToken: generateMockToken(),
      refreshToken: generateMockToken(),
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        avatar: newUser.avatar,
        unitId: newUser.unitId,
        role: newUser.role,
      },
    },
  };
}

function handleLogout(): ApiResponse {
  setCurrentMockUser(null);
  return { success: true, data: {} };
}

function handleRefreshToken(body: any): ApiResponse {
  if (!body?.refreshToken) {
    return {
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
    };
  }
  
  return {
    success: true,
    data: {
      accessToken: generateMockToken(),
      refreshToken: generateMockToken(),
    },
  };
}

// ============================================================================
// USER HANDLERS
// ============================================================================

function handleGetCurrentUser(): ApiResponse {
  if (!currentMockUser) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }
  
  return { success: true, data: currentMockUser };
}

function handleUpdateUser(updates: any): ApiResponse {
  if (!currentMockUser) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }
  
  const updatedUser = { ...currentMockUser, ...updates, updatedAt: new Date() };
  setCurrentMockUser(updatedUser);
  
  return { success: true, data: updatedUser };
}

function handleGetUserStats(userId: string): ApiResponse {
  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    };
  }
  
  return { success: true, data: user.stats };
}

// ============================================================================
// ACTIVITY HANDLERS
// ============================================================================

function handleGetActivityFeed(params: any): ApiResponse {
  let filtered = [...mockActivities];
  
  // Filter by visibility
  if (params?.visibility === 'unit') {
    filtered = filtered.filter(a => a.visibility === 'unit' || a.visibility === 'public');
  } else if (params?.visibility === 'mine') {
    // Filter to only show activities from the current logged-in user
    const userId = currentMockUser?.id;
    if (userId) {
      filtered = filtered.filter(a => a.userId === userId);
    } else {
      // If no user is logged in, return empty array
      filtered = [];
    }
  }
  
  // Sort by date (newest first)
  filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return {
    success: true,
    data: filtered,
    meta: {
      page: 1,
      limit: 20,
      total: filtered.length,
      totalPages: 1,
    },
  };
}

function handleGetActivities(params: any): ApiResponse {
  return handleGetActivityFeed(params);
}

function handleGetActivity(activityId: string): ApiResponse {
  const activity = mockActivities.find(a => a.id === activityId);
  
  if (!activity) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Activity not found' },
    };
  }
  
  return { success: true, data: activity };
}

function handleCreateActivity(request: CreateActivityRequest): ApiResponse {
  // Ensure user is authenticated
  if (!currentMockUser) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User must be logged in to create activities' },
    };
  }
  
  const newActivity: Activity = {
    id: `activity-${Date.now()}`,
    userId: currentMockUser.id,
    userDisplayName: currentMockUser.displayName,
    userAvatar: currentMockUser.avatar,
    unitId: currentMockUser.unitId,
    type: request.type,
    title: request.title,
    description: request.description,
    duration: request.duration,
    date: new Date(request.date),
    location: request.location,
    latitude: request.latitude,
    longitude: request.longitude,
    participants: request.participants,
    visibility: request.visibility,
    tags: request.tags || [],
    images: [],
    reactions: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  mockActivities.unshift(newActivity);
  
  return { success: true, data: newActivity };
}

function handleUpdateActivity(activityId: string, updates: any): ApiResponse {
  const index = mockActivities.findIndex(a => a.id === activityId);
  
  if (index === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Activity not found' },
    };
  }
  
  mockActivities[index] = {
    ...mockActivities[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  return { success: true, data: mockActivities[index] };
}

function handleDeleteActivity(activityId: string): ApiResponse {
  const index = mockActivities.findIndex(a => a.id === activityId);
  
  if (index === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Activity not found' },
    };
  }
  
  mockActivities.splice(index, 1);
  
  return { success: true, data: {} };
}

// ============================================================================
// REACTION HANDLERS
// ============================================================================

function handleAddReaction(activityId: string, body: any): ApiResponse {
  const activity = mockActivities.find(a => a.id === activityId);
  
  if (!activity) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Activity not found' },
    };
  }
  
  const newReaction: Reaction = {
    id: `reaction-${Date.now()}`,
    activityId,
    userId: currentMockUser!.id,
    type: body.type,
    createdAt: new Date(),
  };
  
  activity.reactions.push(newReaction);
  
  return { success: true, data: newReaction };
}

function handleRemoveReaction(activityId: string, reactionType: string): ApiResponse {
  const activity = mockActivities.find(a => a.id === activityId);
  
  if (!activity) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Activity not found' },
    };
  }
  
  activity.reactions = activity.reactions.filter(
    r => !(r.userId === currentMockUser!.id && r.type === reactionType)
  );
  
  return { success: true, data: {} };
}

// ============================================================================
// COMMENT HANDLERS
// ============================================================================

function handleAddComment(activityId: string, body: any): ApiResponse {
  const activity = mockActivities.find(a => a.id === activityId);
  
  if (!activity) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Activity not found' },
    };
  }
  
  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    activityId,
    userId: currentMockUser!.id,
    userDisplayName: currentMockUser!.displayName,
    userAvatar: currentMockUser!.avatar,
    content: body.content,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  activity.comments.push(newComment);
  
  return { success: true, data: newComment };
}

function handleUpdateComment(commentId: string, body: any): ApiResponse {
  for (const activity of mockActivities) {
    const comment = activity.comments.find(c => c.id === commentId);
    if (comment) {
      comment.content = body.content;
      comment.updatedAt = new Date();
      return { success: true, data: comment };
    }
  }
  
  return {
    success: false,
    error: { code: 'NOT_FOUND', message: 'Comment not found' },
  };
}

function handleDeleteComment(commentId: string): ApiResponse {
  for (const activity of mockActivities) {
    const index = activity.comments.findIndex(c => c.id === commentId);
    if (index !== -1) {
      activity.comments.splice(index, 1);
      return { success: true, data: {} };
    }
  }
  
  return {
    success: false,
    error: { code: 'NOT_FOUND', message: 'Comment not found' },
  };
}

// ============================================================================
// STATISTICS HANDLERS
// ============================================================================

function handleGetMyStats(): ApiResponse {
  if (!currentMockUser) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }
  
  return { success: true, data: currentMockUser.stats };
}

// ============================================================================
// BADGE HANDLERS
// ============================================================================

function handleGetMyBadges(): ApiResponse {
  if (!currentMockUser) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }
  
  const userBadgeIds = currentMockUser.badges || [];
  const earned = mockBadges.filter(b => userBadgeIds.includes(b.id));
  const locked = mockBadges.filter(b => !userBadgeIds.includes(b.id));
  
  return {
    success: true,
    data: { earned, locked },
  };
}

function handleGetAllBadges(): ApiResponse {
  return { success: true, data: mockBadges };
}

// ============================================================================
// UNIT HANDLERS
// ============================================================================

function handleGetUnits(): ApiResponse {
  return { success: true, data: mockUnits };
}

