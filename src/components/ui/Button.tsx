/**
 * THEMED BUTTON COMPONENT
 * 
 * Button component using theme tokens.
 * 
 * Usage:
 * <Button variant="primary" onPress={handlePress}>Save</Button>
 * <Button variant="secondary" onPress={handlePress}>Cancel</Button>
 */

import React from 'react';
import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { hapticLight } from '../../utils/haptics';
import { Text, TextColor } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
  style?: TouchableOpacityProps['style'];
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
  
  const handlePress = (e: any) => {
    if (!disabled && !loading) {
      hapticLight();
    }
    if (props.onPress) {
      props.onPress(e);
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
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
    </TouchableOpacity>
  );
}

