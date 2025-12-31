/**
 * TYPE DEFINITIONS
 * 
 * Central type definitions for domain entities and shared types.
 * All domain-related types should be defined here.
 */

/**
 * Activity types represent different kinds of logged activities
 */
export type ActivityType = 'training' | 'exercise' | 'operation';

/**
 * Visibility settings for activities
 */
export type ActivityVisibility = 'public' | 'unit' | 'private';

/**
 * User roles within organizations
 */
export type UserRole = 'member' | 'leader' | 'admin';

/**
 * Badge levels for achievements
 */
export type BadgeLevel = 'bronze' | 'silver' | 'gold';

/**
 * Reaction types for social interactions
 */
export type ReactionType = 'respect' | 'strong' | 'teamwork' | 'impressive';

/**
 * Activity entity
 */
export interface Activity {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  type: ActivityType;
  title: string;
  description?: string;
  duration: number; // in minutes
  date: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  participants?: string[]; // user IDs
  unitId?: string;
  visibility: ActivityVisibility;
  category?: string; // Operation category (e.g., A1, B2, etc.)
  falseAlarm?: boolean; // Indicates if this operation was a false alarm
  tags?: string[];
  images?: string[]; // image URLs
  reactions: Reaction[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User profile entity
 */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  showFullName?: boolean; // If true, displayName shows full name. If false, shows abbreviated (FirstName LastInitial.)
  bio?: string;
  avatar?: string;
  unitId?: string;
  organization?: string;
  rank?: string; // Funktionsgrad
  location?: string;
  role: UserRole;
  stats: UserStats;
  currentStreak: number;
  longestStreak: number;
  badges: string[]; // badge IDs
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User statistics
 */
export interface UserStats {
  totalActivities: number;
  totalHours: number;
  activitiesByType: {
    training: number;
    exercise: number;
    operation: number;
  };
  activitiesThisMonth: number;
  activitiesThisYear: number;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * Unit (organization) entity
 */
export interface Unit {
  id: string;
  name: string;
  description?: string;
  type: 'fire' | 'ems' | 'rescue' | 'civil' | 'other';
  location?: string;
  memberCount: number;
  verified: boolean;
  logo?: string;
  createdAt: Date;
}

/**
 * Badge entity
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // icon identifier
  level: BadgeLevel;
  requirement: string; // description of requirement
  progress?: number; // 0-100 for progress tracking
  unlockedAt?: Date;
}

/**
 * Reaction entity
 */
export interface Reaction {
  id: string;
  activityId: string;
  userId: string;
  type: ReactionType;
  createdAt: Date;
}

/**
 * Comment entity
 */
export interface Comment {
  id: string;
  activityId: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

