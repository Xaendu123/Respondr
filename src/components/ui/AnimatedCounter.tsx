/**
 * ANIMATED COUNTER COMPONENT
 *
 * Displays a number that animates from 0 to the target value.
 * Creates a satisfying counting effect when stats load.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, TextStyle } from 'react-native';
import { Text, TextVariant, TextColor } from './Text';

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  variant?: TextVariant;
  color?: TextColor;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1200,
  delay = 0,
  variant = 'headingLarge',
  color,
  style,
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Reset and animate when value changes
    animatedValue.setValue(0);
    setDisplayValue(0);

    const timeout = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // We need to update text, can't use native driver
      }).start();
    }, delay);

    // Listen to animated value changes
    const listenerId = animatedValue.addListener(({ value: animValue }) => {
      setDisplayValue(Math.round(animValue));
    });

    return () => {
      clearTimeout(timeout);
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration, delay, animatedValue]);

  return (
    <Text variant={variant} color={color} style={style}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
}
