/**
 * HAPTICS UTILITY
 * 
 * Centralized haptic feedback functions for satisfying user interactions.
 * Designed to make interactions feel addicting and responsive.
 */

import * as Haptics from 'expo-haptics';

/**
 * Light impact for button presses, card taps, and general interactions
 */
export const hapticLight = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail if haptics not available
  }
};

/**
 * Medium impact for more significant actions
 */
export const hapticMedium = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Silently fail if haptics not available
  }
};

/**
 * Heavy impact for important actions like confirmations
 */
export const hapticHeavy = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Silently fail if haptics not available
  }
};

/**
 * Success feedback - satisfying double tap feel
 */
export const hapticSuccess = () => {
  try {
    // Use notification success for a satisfying feel
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Silently fail if haptics not available
  }
};

/**
 * Error/warning feedback
 */
export const hapticError = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Silently fail if haptics not available
  }
};

/**
 * Warning feedback
 */
export const hapticWarning = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Silently fail if haptics not available
  }
};

/**
 * Selection feedback - for picking options, toggles, etc.
 * Uses a light impact that feels satisfying
 */
export const hapticSelect = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail if haptics not available
  }
};

