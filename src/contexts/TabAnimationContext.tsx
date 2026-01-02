/**
 * TAB ANIMATION CONTEXT
 *
 * Tracks tab navigation state to enable directional slide animations.
 * Provides current and previous tab indices to determine slide direction.
 */

import { createContext, ReactNode, useContext, useRef, useState } from 'react';

// Tab order mapping (left to right): Feed → Log → Logbook
const TAB_ORDER: Record<string, number> = {
  feed: 0,
  log: 1,
  logbook: 2,
};

const ANIMATION_DURATION = 300; // Animation duration in ms

interface TabAnimationContextValue {
  currentTabIndex: number;
  previousTabIndex: number | null;
  setCurrentTab: (tabName: string) => void;
  getTabIndex: (tabName: string) => number;
  getSlideDirection: (tabName: string) => 'left' | 'right' | null;
}

const TabAnimationContext = createContext<TabAnimationContextValue | undefined>(undefined);

export function TabAnimationProvider({ children }: { children: ReactNode }) {
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0); // Default to 'feed'
  const [previousTabIndex, setPreviousTabIndex] = useState<number | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSetIndexRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

  const setCurrentTab = (tabName: string) => {
    const newIndex = TAB_ORDER[tabName] ?? 0;

    // Ignore calls during an active transition for the same tab
    if (isTransitioningRef.current && newIndex === lastSetIndexRef.current) {
      return;
    }

    if (newIndex !== lastSetIndexRef.current) {
      // Clear any pending timeout
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }

      // Mark as transitioning
      isTransitioningRef.current = true;

      // Set previous tab to the last active tab
      setPreviousTabIndex(lastSetIndexRef.current);

      // Update current tab immediately
      setCurrentTabIndex(newIndex);

      // Update tracking ref
      lastSetIndexRef.current = newIndex;

      // Clear previous tab after animation completes
      clearTimeoutRef.current = setTimeout(() => {
        setPreviousTabIndex(null);
        isTransitioningRef.current = false;
        clearTimeoutRef.current = null;
      }, ANIMATION_DURATION);
    }
  };

  const getTabIndex = (tabName: string) => {
    return TAB_ORDER[tabName] ?? 0;
  };

  // Determine slide direction for a specific tab
  const getSlideDirection = (tabName: string): 'left' | 'right' | null => {
    if (previousTabIndex === null) return null;

    const tabIndex = TAB_ORDER[tabName] ?? 0;

    // If this tab is the current tab, determine how it should enter
    if (tabIndex === currentTabIndex) {
      // Current tab slides in from the direction of navigation
      // If we navigated right (higher index), slide in from right
      // If we navigated left (lower index), slide in from left
      return currentTabIndex > previousTabIndex ? 'right' : 'left';
    }

    // If this tab is the previous tab, determine how it should exit
    if (tabIndex === previousTabIndex) {
      // Previous tab slides out in the opposite direction
      return currentTabIndex > previousTabIndex ? 'left' : 'right';
    }

    return null;
  };

  return (
    <TabAnimationContext.Provider
      value={{
        currentTabIndex,
        previousTabIndex,
        setCurrentTab,
        getTabIndex,
        getSlideDirection,
      }}
    >
      {children}
    </TabAnimationContext.Provider>
  );
}

export function useTabAnimation() {
  const context = useContext(TabAnimationContext);
  if (!context) {
    throw new Error('useTabAnimation must be used within TabAnimationProvider');
  }
  return context;
}
