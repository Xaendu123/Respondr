/**
 * THEMED CARD COMPONENT
 * 
 * Card component using theme tokens with glassmorphism support.
 * 
 * Usage:
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 * 
 * <Card glass>
 *   <Text>Glass effect card</Text>
 * </Card>
 */

import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = false, glass = false, style, children, ...props }: CardProps) {
  const { theme } = useTheme();
  
  if (glass && Platform.OS !== 'web') {
    return (
      <BlurView
        intensity={20}
        tint="light"
        style={[
          {
            backgroundColor: theme.colors.glassBackground,
            borderRadius: theme.borderRadius.xl, // Larger radius for modern look
            padding: theme.spacing.lg, // More padding for spacious feel
            borderWidth: 1, // Subtle border for glassmorphism
            borderColor: theme.colors.glassBorder,
            overflow: 'hidden',
            // Remove shadows for glass cards
            elevation: 0,
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }
  
  // For web or when glass is requested but BlurView isn't available
  return (
    <View
      style={[
        {
          backgroundColor: glass ? theme.colors.glassBackground : (elevated ? theme.colors.surfaceElevated : theme.colors.surface),
          borderRadius: theme.borderRadius.xl, // Larger radius for modern look
          padding: theme.spacing.lg, // More padding for spacious feel
          borderWidth: glass ? 1 : 1, // Border for both glass and regular cards
          borderColor: glass ? theme.colors.glassBorder : theme.colors.border, // Use appropriate border color
          // Remove shadows for glass cards (glassmorphism replaces shadows)
          ...(glass && {
            elevation: 0,
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
          }),
        },
        // Shadows only for non-glass cards
        !glass && elevated && theme.shadows.lg, // Shadow only for non-glass elevated cards
        !glass && !elevated && theme.shadows.md, // Medium shadow for non-glass non-elevated cards
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

