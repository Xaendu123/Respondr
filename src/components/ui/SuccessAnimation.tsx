/**
 * SUCCESS ANIMATION COMPONENT
 *
 * A satisfying completion animation with confetti burst and checkmark.
 * Shows a celebratory animation when an activity is successfully logged.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { hapticSuccess } from '../../utils/haptics';
import { Text } from './Text';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'triangle';
}

interface SuccessAnimationProps {
  visible: boolean;
  onAnimationComplete?: () => void;
  message?: string;
  subtitle?: string;
}

const CONFETTI_COUNT = 50;
const CONFETTI_COLORS = [
  '#f97316', // Orange (brand)
  '#dc2626', // Red
  '#fde047', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
];

export function SuccessAnimation({
  visible,
  onAnimationComplete,
  message = 'Success!',
  subtitle,
}: SuccessAnimationProps) {
  const { theme } = useTheme();
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Create confetti pieces
  const confettiPieces = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(SCREEN_WIDTH / 2),
      y: new Animated.Value(SCREEN_HEIGHT / 2),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 6,
      shape: (['square', 'circle', 'triangle'] as const)[Math.floor(Math.random() * 3)],
    }))
  ).current;

  const animateConfetti = useCallback(() => {
    const animations = confettiPieces.map((piece, index) => {
      // Reset position to center
      piece.x.setValue(SCREEN_WIDTH / 2);
      piece.y.setValue(SCREEN_HEIGHT / 2 - 50);
      piece.rotation.setValue(0);
      piece.scale.setValue(0);

      // Random angle for burst direction
      const angle = (Math.PI * 2 * index) / CONFETTI_COUNT + Math.random() * 0.5;
      const distance = 150 + Math.random() * 200;
      const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
      const targetY = SCREEN_HEIGHT / 2 - 50 + Math.sin(angle) * distance;

      const delay = Math.random() * 100;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Burst out
          Animated.sequence([
            Animated.timing(piece.scale, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(piece.x, {
            toValue: targetX,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(piece.y, {
              toValue: targetY - 100,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            // Fall with gravity
            Animated.timing(piece.y, {
              toValue: SCREEN_HEIGHT + 50,
              duration: 1200,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(piece.rotation, {
            toValue: Math.random() * 10 - 5,
            duration: 1500,
            useNativeDriver: true,
          }),
          // Fade out at end
          Animated.sequence([
            Animated.delay(1000),
            Animated.timing(piece.scale, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    return Animated.parallel(animations);
  }, [confettiPieces]);

  useEffect(() => {
    if (visible) {
      // Reset all values
      checkmarkScale.setValue(0);
      checkmarkOpacity.setValue(0);
      ringScale.setValue(0);
      ringOpacity.setValue(0.8);
      textOpacity.setValue(0);
      textTranslateY.setValue(20);
      overlayOpacity.setValue(0);

      // Trigger haptic
      hapticSuccess();

      // Build animation sequence
      const animationSequence: Animated.CompositeAnimation[] = [
        // Fade in overlay
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Show checkmark with bounce
        Animated.parallel([
          Animated.spring(checkmarkScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(checkmarkOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Expanding ring
          Animated.parallel([
            Animated.timing(ringScale, {
              toValue: 2.5,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          // Start confetti
          animateConfetti(),
        ]),
        // Show text
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(textTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        // Hold for a moment
        Animated.delay(800),
        // Fade everything out
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(checkmarkOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ];

      Animated.sequence(animationSequence).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [visible, animateConfetti, onAnimationComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: overlayOpacity,
          backgroundColor: theme.colors.background + 'F0',
        }
      ]}
      pointerEvents="auto"
    >
      {/* Confetti */}
      {confettiPieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              transform: [
                { translateX: Animated.subtract(piece.x, SCREEN_WIDTH / 2) },
                { translateY: Animated.subtract(piece.y, SCREEN_HEIGHT / 2) },
                { rotate: piece.rotation.interpolate({
                  inputRange: [-5, 5],
                  outputRange: ['-180deg', '180deg'],
                }) },
                { scale: piece.scale },
              ],
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
              borderRadius: piece.shape === 'circle' ? piece.size / 2 : 2,
              borderLeftWidth: piece.shape === 'triangle' ? piece.size / 2 : 0,
              borderRightWidth: piece.shape === 'triangle' ? piece.size / 2 : 0,
              borderBottomWidth: piece.shape === 'triangle' ? piece.size : 0,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: piece.shape === 'triangle' ? piece.color : 'transparent',
            },
          ]}
        />
      ))}

      {/* Expanding ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: theme.colors.primary,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />

      {/* Checkmark circle */}
      <Animated.View
        style={[
          styles.checkmarkContainer,
          {
            backgroundColor: theme.colors.primary,
            transform: [{ scale: checkmarkScale }],
            opacity: checkmarkOpacity,
          },
        ]}
      >
        <Ionicons name="checkmark" size={60} color="#FFFFFF" />
      </Animated.View>

      {/* Success text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text variant="headingLarge" style={styles.successText}>
          {message}
        </Text>
        {subtitle && (
          <Text variant="body" color="textSecondary" style={styles.subtitleText}>
            {subtitle}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2,
    top: SCREEN_HEIGHT / 2,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    position: 'absolute',
    bottom: '25%',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    textAlign: 'center',
  },
});
