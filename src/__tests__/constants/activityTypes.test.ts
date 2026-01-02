/**
 * Activity Types Constants Tests
 */

import {
  ACTIVITY_TYPES,
  getActivityTypeColor,
  getActivityTypeBackgroundColor,
  getActivityTypeIcon,
  getActivityTypeTranslationKey,
  getAllActivityTypes,
  getActivityTypeGradient,
} from '../../constants/activityTypes';
import { themes } from '../../config/theme';

describe('Activity Types Constants', () => {
  const lightTheme = themes.light;
  const darkTheme = themes.dark;

  describe('ACTIVITY_TYPES', () => {
    it('should have training type configured', () => {
      expect(ACTIVITY_TYPES.training).toBeDefined();
      expect(ACTIVITY_TYPES.training.type).toBe('training');
      expect(ACTIVITY_TYPES.training.icon).toBe('book-outline');
      expect(ACTIVITY_TYPES.training.translationKey).toBe('activity.typeTraining');
    });

    it('should have exercise type configured', () => {
      expect(ACTIVITY_TYPES.exercise).toBeDefined();
      expect(ACTIVITY_TYPES.exercise.type).toBe('exercise');
      expect(ACTIVITY_TYPES.exercise.icon).toBe('fitness-outline');
      expect(ACTIVITY_TYPES.exercise.translationKey).toBe('activity.typeExercise');
    });

    it('should have operation type configured', () => {
      expect(ACTIVITY_TYPES.operation).toBeDefined();
      expect(ACTIVITY_TYPES.operation.type).toBe('operation');
      expect(ACTIVITY_TYPES.operation.icon).toBe('flash-outline');
      expect(ACTIVITY_TYPES.operation.translationKey).toBe('activity.typeOperation');
    });

    it('should have all three activity types', () => {
      const types = Object.keys(ACTIVITY_TYPES);
      expect(types).toHaveLength(3);
      expect(types).toContain('training');
      expect(types).toContain('exercise');
      expect(types).toContain('operation');
    });
  });

  describe('getActivityTypeColor', () => {
    it('should return info color for training', () => {
      const color = getActivityTypeColor('training', lightTheme);
      expect(color).toBe(lightTheme.colors.info);
    });

    it('should return warning color for exercise', () => {
      const color = getActivityTypeColor('exercise', lightTheme);
      expect(color).toBe(lightTheme.colors.warning);
    });

    it('should return error color for operation', () => {
      const color = getActivityTypeColor('operation', lightTheme);
      expect(color).toBe(lightTheme.colors.error);
    });

    it('should work with dark theme', () => {
      const color = getActivityTypeColor('training', darkTheme);
      expect(color).toBe(darkTheme.colors.info);
    });

    it('should return primary color for unknown type', () => {
      const color = getActivityTypeColor('unknown' as any, lightTheme);
      expect(color).toBe(lightTheme.colors.primary);
    });
  });

  describe('getActivityTypeBackgroundColor', () => {
    it('should return info background color for training', () => {
      const color = getActivityTypeBackgroundColor('training', lightTheme);
      expect(color).toBe(lightTheme.colors.info + '20');
    });

    it('should return warning background color for exercise', () => {
      const color = getActivityTypeBackgroundColor('exercise', lightTheme);
      expect(color).toBe(lightTheme.colors.warning + '20');
    });

    it('should return error background color for operation', () => {
      const color = getActivityTypeBackgroundColor('operation', lightTheme);
      expect(color).toBe(lightTheme.colors.error + '20');
    });

    it('should return primary background color for unknown type', () => {
      const color = getActivityTypeBackgroundColor('unknown' as any, lightTheme);
      expect(color).toBe(lightTheme.colors.primary + '20');
    });
  });

  describe('getActivityTypeIcon', () => {
    it('should return book-outline for training', () => {
      expect(getActivityTypeIcon('training')).toBe('book-outline');
    });

    it('should return fitness-outline for exercise', () => {
      expect(getActivityTypeIcon('exercise')).toBe('fitness-outline');
    });

    it('should return flash-outline for operation', () => {
      expect(getActivityTypeIcon('operation')).toBe('flash-outline');
    });

    it('should return flag-outline for unknown type', () => {
      expect(getActivityTypeIcon('unknown' as any)).toBe('flag-outline');
    });
  });

  describe('getActivityTypeTranslationKey', () => {
    it('should return translation key for training', () => {
      expect(getActivityTypeTranslationKey('training')).toBe('activity.typeTraining');
    });

    it('should return translation key for exercise', () => {
      expect(getActivityTypeTranslationKey('exercise')).toBe('activity.typeExercise');
    });

    it('should return translation key for operation', () => {
      expect(getActivityTypeTranslationKey('operation')).toBe('activity.typeOperation');
    });

    it('should return generic translation key for unknown type', () => {
      expect(getActivityTypeTranslationKey('unknown' as any)).toBe('activity.type');
    });
  });

  describe('getAllActivityTypes', () => {
    it('should return array of all activity types', () => {
      const types = getAllActivityTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types).toHaveLength(3);
    });

    it('should include training, exercise, and operation', () => {
      const types = getAllActivityTypes();
      expect(types).toContain('training');
      expect(types).toContain('exercise');
      expect(types).toContain('operation');
    });

    it('should return same order each time', () => {
      const types1 = getAllActivityTypes();
      const types2 = getAllActivityTypes();
      expect(types1).toEqual(types2);
    });
  });

  describe('getActivityTypeGradient', () => {
    it('should return info to warning gradient for training', () => {
      const gradient = getActivityTypeGradient('training', lightTheme);
      expect(gradient).toEqual([lightTheme.colors.info, lightTheme.colors.warning]);
    });

    it('should return warning to primary gradient for exercise', () => {
      const gradient = getActivityTypeGradient('exercise', lightTheme);
      expect(gradient).toEqual([lightTheme.colors.warning, lightTheme.colors.primary]);
    });

    it('should return error to primaryDark gradient for operation', () => {
      const gradient = getActivityTypeGradient('operation', lightTheme);
      expect(gradient).toEqual([lightTheme.colors.error, lightTheme.colors.primaryDark]);
    });

    it('should return default gradient for unknown type', () => {
      const gradient = getActivityTypeGradient('unknown' as any, lightTheme);
      expect(gradient).toEqual([lightTheme.colors.gradientStart, lightTheme.colors.gradientEnd]);
    });

    it('should work with dark theme', () => {
      const gradient = getActivityTypeGradient('training', darkTheme);
      expect(gradient).toEqual([darkTheme.colors.info, darkTheme.colors.warning]);
    });

    it('should return tuple of exactly 2 colors', () => {
      const gradient = getActivityTypeGradient('training', lightTheme);
      expect(gradient).toHaveLength(2);
      expect(typeof gradient[0]).toBe('string');
      expect(typeof gradient[1]).toBe('string');
    });
  });
});
