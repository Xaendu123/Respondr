/**
 * THEMED BUTTON COMPONENT
 *
 * Button component using theme tokens with satisfying press animation.
 *
 * Usage:
 * <Button variant="primary" onPress={handlePress}>Save</Button>
 * <Button variant="secondary" onPress={handlePress}>Cancel</Button>
 */

import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { hapticLight } from '../../utils/haptics';
import { Text, TextColor } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const animateOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [scaleAnim]);

  const getButtonStyle = () => {
    const baseStyle = {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 48,
    };
    
    if (disabled || loading) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.disabledBackground,
      };
    }
    
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceElevated,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };
  
  const getTextColor = (): TextColor => {
    if (disabled || loading) {
      return 'disabled';
    }
    
    switch (variant) {
      case 'primary':
        return 'textInverse';
      case 'secondary':
      case 'outline':
      case 'ghost':
        return 'textPrimary';
      default:
        return 'textPrimary';
    }
  };
  
  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      animateIn();
    }
  }, [disabled, loading, animateIn]);

  const handlePressOut = useCallback(() => {
    animateOut();
  }, [animateOut]);

  const handlePress = useCallback(
    (e: any) => {
      if (!disabled && !loading) {
        hapticLight();
      }
      if (props.onPress) {
        props.onPress(e);
      }
    },
    [disabled, loading, props.onPress]
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[getButtonStyle(), style]}
        disabled={disabled || loading}
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? theme.colors.textInverse : theme.colors.textPrimary}
          />
        ) : (
          <Text variant="label" color={getTextColor()}>
            {children}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

