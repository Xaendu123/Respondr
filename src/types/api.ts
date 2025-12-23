/**
 * API TYPES
 * 
 * Type definitions for API requests and responses.
 */

/**
 * Base API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * API Error
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field?: string;
    message: string;
  }>;
}

/**
 * API Metadata (for pagination, etc.)
 */
export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: Required<ApiMeta>;
}

/**
 * Authentication Types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
    unitId?: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  unitId?: string;
}

/**
 * Activity Types
 */
export interface CreateActivityRequest {
  type: 'training' | 'exercise' | 'operation';
  title: string;
  description?: string;
  duration: number;
  date: string; // ISO date string
  location?: string;
  latitude?: number;
  longitude?: number;
  participants?: string[]; // User IDs
  visibility: 'public' | 'unit' | 'private';
  tags?: string[];
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {
  id: string;
}

export interface ActivityFilter {
  type?: 'training' | 'exercise' | 'operation';
  unitId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  visibility?: 'all' | 'unit' | 'mine';
  page?: number;
  limit?: number;
}

/**
 * Reaction Types
 */
export interface AddReactionRequest {
  activityId: string;
  type: 'respect' | 'strong' | 'teamwork' | 'impressive';
}

/**
 * Comment Types
 */
export interface AddCommentRequest {
  activityId: string;
  content: string;
}

export interface UpdateCommentRequest {
  commentId: string;
  content: string;
}

/**
 * Profile Update Types
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  unitId?: string;
  organization?: string;
  rank?: string;
  location?: string;
}

/**
 * Upload Types
 */
export interface UploadResponse {
  url: string;
  thumbnailUrl?: string;
}

