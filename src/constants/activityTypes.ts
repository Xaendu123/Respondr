/**
 * ACTIVITY TYPE CONSTANTS
 *
 * Centralized color coding and visual language for activity types.
 * Provides consistent styling throughout the app.
 */

import { ActivityType } from '../types';
import { Theme } from '../config/theme';

export interface ActivityTypeConfig {
  type: ActivityType;
  icon: string;
  translationKey: string;
  getColor: (theme: Theme) => string;
  getBackgroundColor: (theme: Theme) => string;
}

/**
 * Activity type configurations with semantic colors
 *
 * Training (Education) - Yellow/Info - Learning, knowledge, flame tip
 * Exercise (Übung) - Orange/Warning - Practice, preparation, drills
 * Operation (Einsatz) - Red/Error - Emergency, real action, urgency
 */
export const ACTIVITY_TYPES: Record<ActivityType, ActivityTypeConfig> = {
  training: {
    type: 'training',
    icon: 'book-outline',
    translationKey: 'activity.typeTraining',
    getColor: (theme) => theme.colors.info,
    getBackgroundColor: (theme) => theme.colors.info + '20',
  },
  exercise: {
    type: 'exercise',
    icon: 'fitness-outline',
    translationKey: 'activity.typeExercise',
    getColor: (theme) => theme.colors.warning,
    getBackgroundColor: (theme) => theme.colors.warning + '20',
  },
  operation: {
    type: 'operation',
    icon: 'flash-outline',
    translationKey: 'activity.typeOperation',
    getColor: (theme) => theme.colors.error,
    getBackgroundColor: (theme) => theme.colors.error + '20',
  },
};

/**
 * Get the color for an activity type
 */
export function getActivityTypeColor(type: ActivityType, theme: Theme): string {
  return ACTIVITY_TYPES[type]?.getColor(theme) ?? theme.colors.primary;
}

/**
 * Get the background color for an activity type
 */
export function getActivityTypeBackgroundColor(type: ActivityType, theme: Theme): string {
  return ACTIVITY_TYPES[type]?.getBackgroundColor(theme) ?? (theme.colors.primary + '20');
}

/**
 * Get the icon name for an activity type
 */
export function getActivityTypeIcon(type: ActivityType): string {
  return ACTIVITY_TYPES[type]?.icon ?? 'flag-outline';
}

/**
 * Get the translation key for an activity type
 */
export function getActivityTypeTranslationKey(type: ActivityType): string {
  return ACTIVITY_TYPES[type]?.translationKey ?? 'activity.type';
}

/**
 * Get all activity types as an array
 */
export function getAllActivityTypes(): ActivityType[] {
  return Object.keys(ACTIVITY_TYPES) as ActivityType[];
}

/**
 * Gradient colors for headers based on activity type
 */
export function getActivityTypeGradient(type: ActivityType, theme: Theme): [string, string] {
  switch (type) {
    case 'training':
      return [theme.colors.info, theme.colors.warning];
    case 'exercise':
      return [theme.colors.warning, theme.colors.primary];
    case 'operation':
      return [theme.colors.error, theme.colors.primaryDark];
    default:
      return [theme.colors.gradientStart, theme.colors.gradientEnd];
  }
}
