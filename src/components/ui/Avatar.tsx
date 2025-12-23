/**
 * AVATAR COMPONENT
 * 
 * User avatar component with fallback to initials.
 * 
 * Usage:
 * <Avatar size={48} name="John Doe" />
 * <Avatar size={48} name="John Doe" imageUrl="https://..." />
 */

import React from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Text } from './Text';

export interface AvatarProps {
  size?: number;
  name?: string;
  imageUrl?: string;
}

export function Avatar({ size = 40, name, imageUrl }: AvatarProps) {
  const { theme } = useTheme();
  
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: theme.colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  };
  
  if (imageUrl) {
    return (
      <View style={containerStyle}>
        <Image 
          source={{ uri: imageUrl }} 
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }
  
  return (
    <View style={containerStyle}>
      <Text 
        variant="body" 
        style={{ 
          fontSize: size * 0.38, 
          fontWeight: '600',
          lineHeight: size * 0.38,
          includeFontPadding: false,
          color: '#FFFFFF',
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

