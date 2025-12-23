/**
 * THEMED TEXT COMPONENT
 * 
 * Text component that uses theme tokens and typography system.
 * All text should use this component instead of React Native's Text.
 * 
 * Usage:
 * <Text variant="headingLarge">Title</Text>
 * <Text variant="body" color="textSecondary">Description</Text>
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export type TextVariant = 
  | 'headingLarge'
  | 'headingMedium'
  | 'headingSmall'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label';

export type TextColor = 
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'textInverse'
  | 'primary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'disabled';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
}> = {
  headingLarge: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  headingMedium: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  headingSmall: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
};

export function Text({ 
  variant = 'body', 
  color = 'textPrimary',
  style,
  children,
  ...props 
}: TextProps) {
  const { theme } = useTheme();
  
  const variantStyle = variantStyles[variant];
  const colorMap: Record<TextColor, keyof typeof theme.colors> = {
    textPrimary: 'textPrimary',
    textSecondary: 'textSecondary',
    textTertiary: 'textTertiary',
    textInverse: 'textInverse',
    primary: 'primary',
    error: 'error',
    success: 'success',
    warning: 'warning',
    info: 'info',
    disabled: 'disabled',
  };
  const colorKey = color ? colorMap[color] : 'textPrimary';
  const colorValue = theme.colors[colorKey] || theme.colors.textPrimary;
  
  return (
    <RNText
      style={[
        {
          fontSize: variantStyle.fontSize,
          lineHeight: variantStyle.lineHeight,
          fontWeight: variantStyle.fontWeight,
          color: colorValue,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

