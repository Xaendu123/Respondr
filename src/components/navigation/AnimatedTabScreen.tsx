/**
 * TAB SCREEN WRAPPER
 * 
 * Simple wrapper for tab screens (animations disabled).
 */

import React from 'react';

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  tabName: string;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  // Simply render children without any animation logic
  return <>{children}</>;
}