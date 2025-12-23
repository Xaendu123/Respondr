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
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            overflow: 'hidden',
          },
          elevated && theme.shadows.lg,
          style,
        ]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }
  
  return (
    <View
      style={[
        {
          backgroundColor: glass ? theme.colors.glassBackground : (elevated ? theme.colors.surfaceElevated : theme.colors.surface),
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: glass ? theme.colors.glassBorder : theme.colors.border,
        },
        elevated && theme.shadows.md,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

