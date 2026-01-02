/**
 * CUSTOM TOAST COMPONENT
 *
 * A refined toast notification component with smooth animations and polished visuals.
 * Supports success, error, warning, and info variants.
 *
 * Usage:
 * import { useToast } from '../../providers/ToastProvider';
 *
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: 'Operation completed!' });
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { Text } from './Text';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps extends ToastConfig {
  visible: boolean;
  onHide: () => void;
}

const TOAST_DURATION = 3500;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Refined color palette for each toast type
const TOAST_THEMES = {
  success: {
    gradient: ['#059669', '#10B981'] as const,
    iconBg: 'rgba(255, 255, 255, 0.2)',
    accent: '#34D399',
    icon: 'checkmark' as const,
  },
  error: {
    gradient: ['#DC2626', '#EF4444'] as const,
    iconBg: 'rgba(255, 255, 255, 0.2)',
    accent: '#F87171',
    icon: 'close' as const,
  },
  warning: {
    gradient: ['#D97706', '#F59E0B'] as const,
    iconBg: 'rgba(255, 255, 255, 0.2)',
    accent: '#FBBF24',
    icon: 'alert' as const,
  },
  info: {
    gradient: ['#2563EB', '#3B82F6'] as const,
    iconBg: 'rgba(255, 255, 255, 0.2)',
    accent: '#60A5FA',
    icon: 'information' as const,
  },
} as const;

export function Toast({
  type,
  title,
  message,
  duration = TOAST_DURATION,
  visible,
  onHide,
}: ToastProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const progressWidth = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      // Reset progress bar
      progressWidth.setValue(100);

      // Entrance animation - smooth spring with scale
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress bar animation
      Animated.timing(progressWidth, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();

      // Auto hide
      const timer = setTimeout(hideToast, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const toastTheme = TOAST_THEMES[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 12,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={hideToast}
        style={styles.touchable}
      >
        <LinearGradient
          colors={toastTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Decorative glow effect */}
          <View style={[styles.glowOrb, { backgroundColor: toastTheme.accent }]} />

          {/* Content wrapper */}
          <View style={styles.contentWrapper}>
            {/* Icon with frosted background */}
            <View style={[styles.iconContainer, { backgroundColor: toastTheme.iconBg }]}>
              <Ionicons
                name={toastTheme.icon}
                size={20}
                color="#FFFFFF"
              />
            </View>

            {/* Text content */}
            <View style={styles.textContent}>
              {title && (
                <Text
                  style={styles.title}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              <Text
                style={[styles.message, !title && styles.messageOnly]}
                numberOfLines={2}
              >
                {message}
              </Text>
            </View>

            {/* Dismiss button */}
            <TouchableOpacity
              onPress={hideToast}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.closeButtonInner}>
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: 'rgba(255,255,255,0.35)',
                },
              ]}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 999,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
    // Soft shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.3,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 19,
    letterSpacing: 0.1,
  },
  messageOnly: {
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});