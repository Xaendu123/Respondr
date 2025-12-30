/**
 * THEMED INPUT COMPONENT
 * 
 * Text input component using theme tokens.
 */

import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(({ label, error, style, ...props }, ref) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="textPrimary" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            color: theme.colors.textPrimary,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily.regular,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textTertiary}
        {...props}
      />
      {error && (
        <Text variant="caption" color="error" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  error: {
    marginTop: 4,
  },
});

