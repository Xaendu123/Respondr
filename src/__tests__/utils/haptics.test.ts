/**
 * Haptics Utility Tests
 */

import * as Haptics from 'expo-haptics';
import {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticSelect,
} from '../../utils/haptics';

// Mock is already set up in setup.ts

describe('Haptics Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hapticLight', () => {
    it('should call impactAsync with Light style', () => {
      hapticLight();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should call impactAsync exactly once', () => {
      hapticLight();
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });

    it('should silently fail when haptics throws', () => {
      (Haptics.impactAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Haptics not available');
      });

      expect(() => hapticLight()).not.toThrow();
    });
  });

  describe('hapticMedium', () => {
    it('should call impactAsync with Medium style', () => {
      hapticMedium();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should silently fail when haptics throws', () => {
      (Haptics.impactAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Haptics not available');
      });

      expect(() => hapticMedium()).not.toThrow();
    });
  });

  describe('hapticHeavy', () => {
    it('should call impactAsync with Heavy style', () => {
      hapticHeavy();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('should silently fail when haptics throws', () => {
      (Haptics.impactAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Haptics not available');
      });

      expect(() => hapticHeavy()).not.toThrow();
    });
  });

  describe('hapticSuccess', () => {
    it('should call notificationAsync with Success type', () => {
      hapticSuccess();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should call notificationAsync exactly once', () => {
      hapticSuccess();
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    });

    it('should silently fail when haptics throws', () => {
      (Haptics.notificationAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Haptics not available');
      });

      expect(() => hapticSuccess()).not.toThrow();
    });
  });

  describe('hapticError', () => {
    it('should call notificationAsync with Error type', () => {
      hapticError();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });

    it('should silently fail when haptics throws', () => {
      (Haptics.notificationAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Haptics not available');
      });

      expect(() => hapticError()).not.toThrow();
    });
  });

  describe('hapticWarning', () => {
    it('should call notificationAsync with Warning type', () => {
      hapticWarning();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    });

    it('should silently fail when haptics throws', () => {
      (Haptics.notificationAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Haptics not available');
      });

      expect(() => hapticWarning()).not.toThrow();
    });
  });

  describe('hapticSelect', () => {
    it('should call impactAsync with Light style (same as hapticLight)', () => {
      hapticSelect();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should silently fail when haptics throws', () => {
      (Haptics.impactAsync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Haptics not available');
      });

      expect(() => hapticSelect()).not.toThrow();
    });
  });

  describe('multiple calls', () => {
    it('should allow calling multiple haptic functions in sequence', () => {
      hapticLight();
      hapticMedium();
      hapticHeavy();
      hapticSuccess();
      hapticError();
      hapticWarning();
      hapticSelect();

      expect(Haptics.impactAsync).toHaveBeenCalledTimes(4); // light, medium, heavy, select
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(3); // success, error, warning
    });
  });
});
