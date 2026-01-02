/**
 * ANIMATED AVATAR COMPONENT
 *
 * User avatar component with shared element transition support.
 * Uses react-native-reanimated for smooth morph transitions between screens.
 *
 * Usage:
 * <AnimatedAvatar size={48} name="John Doe" sharedTransitionTag="profile-avatar" />
 */

import React from 'react';
import { Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { Text } from './Text';

export interface AnimatedAvatarProps {
  size?: number;
  name?: string;
  imageUrl?: string;
  /** Shared transition tag for morph animation between screens */
  sharedTransitionTag?: string;
}

export function AnimatedAvatar({ size = 40, name, imageUrl, sharedTransitionTag }: AnimatedAvatarProps) {
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

  const content = imageUrl ? (
    <Image
      source={{ uri: imageUrl }}
      style={{ width: size, height: size }}
      resizeMode="cover"
    />
  ) : (
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
  );

  // Use Animated.View with sharedTransitionTag for shared element transitions
  // The tag must match between source and destination screens
  return (
    <Animated.View
      style={containerStyle}
      // @ts-ignore - sharedTransitionTag is available in reanimated but types may be incomplete
      sharedTransitionTag={sharedTransitionTag}
    >
      {content}
    </Animated.View>
  );
}
