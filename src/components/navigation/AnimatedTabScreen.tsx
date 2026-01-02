/**
 * ANIMATED TAB SCREEN
 *
 * Wrapper for tab screens. Keeps all tabs mounted but only shows the current one.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTabAnimation } from '../../contexts/TabAnimationContext';

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  tabName: string;
}

export function AnimatedTabScreen({ children, tabName }: AnimatedTabScreenProps) {
  const { currentTabIndex, getTabIndex } = useTabAnimation();

  const tabIndex = getTabIndex(tabName);
  const isCurrentTab = tabIndex === currentTabIndex;

  // Keep all tabs mounted but hide non-current tabs to prevent white flash
  return (
    <View style={[styles.container, !isCurrentTab && styles.hidden]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
});
