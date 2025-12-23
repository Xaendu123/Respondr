/**
 * API CONFIGURATION
 * 
 * Central configuration for API endpoints and settings.
 */

// API Environment Configuration
// Note: Currently using Supabase for all backend operations
// This config is kept for potential future REST API integration
export const API_CONFIG = {
  // Current API mode (set to 'production' when using REST API)
  MODE: 'production' as 'mock' | 'production',
  
  // Base URLs for different environments
  BASE_URLS: {
    production: 'https://api.respondr.app',
    staging: 'https://staging-api.respondr.app',
    development: 'http://localhost:3000',
    mock: 'mock://api',
  },
  
  // Timeout settings (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry settings
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
  
  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};

/**
 * Get the current API base URL based on mode
 */
export function getApiBaseUrl(): string {
  if (API_CONFIG.MODE === 'mock') {
    return API_CONFIG.BASE_URLS.mock;
  }
  return API_CONFIG.BASE_URLS.production;
}

/**
 * Check current API mode
 */
export function isMockMode(): boolean {
  return API_CONFIG.MODE === 'mock';
}

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // User
  USER: {
    ME: '/api/users/me',
    BY_ID: (id: string) => `/api/users/${id}`,
    STATS: (id: string) => `/api/users/${id}/stats`,
    AVATAR: '/api/users/me/avatar',
  },
  
  // Units
  UNITS: {
    LIST: '/api/units',
    BY_ID: (id: string) => `/api/units/${id}`,
    MEMBERS: (id: string) => `/api/units/${id}/members`,
  },
  
  // Activities
  ACTIVITIES: {
    LIST: '/api/activities',
    CREATE: '/api/activities',
    BY_ID: (id: string) => `/api/activities/${id}`,
    FEED: '/api/activities/feed',
    MAP: '/api/activities/map',
    IMAGES: (id: string) => `/api/activities/${id}/images`,
  },
  
  // Reactions
  REACTIONS: {
    ADD: (activityId: string) => `/api/activities/${activityId}/reactions`,
    REMOVE: (activityId: string, type: string) => 
      `/api/activities/${activityId}/reactions/${type}`,
    LIST: (activityId: string) => `/api/activities/${activityId}/reactions`,
  },
  
  // Comments
  COMMENTS: {
    ADD: (activityId: string) => `/api/activities/${activityId}/comments`,
    UPDATE: (commentId: string) => `/api/comments/${commentId}`,
    DELETE: (commentId: string) => `/api/comments/${commentId}`,
    LIST: (activityId: string) => `/api/activities/${activityId}/comments`,
  },
  
  // Statistics
  STATS: {
    ME: '/api/stats/me',
    UNIT: (unitId: string) => `/api/stats/unit/${unitId}`,
    LEADERBOARD: '/api/stats/leaderboard',
  },
  
  // Badges
  BADGES: {
    LIST: '/api/badges',
    ME: '/api/badges/me',
    BY_ID: (id: string) => `/api/badges/${id}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    READ: (id: string) => `/api/notifications/${id}/read`,
    READ_ALL: '/api/notifications/read-all',
  },
} as const;

