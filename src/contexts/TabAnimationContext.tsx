/**
 * TAB ANIMATION CONTEXT
 * 
 * Tracks tab navigation state to enable directional slide animations.
 * Provides current and previous tab indices to determine slide direction.
 */

import { createContext, ReactNode, useContext, useRef, useState } from 'react';

// Tab order mapping
const TAB_ORDER: Record<string, number> = {
  'logbook': 0,
  'log': 1,
  'feed': 2,
  'profile': 3,
};

const ANIMATION_DURATION = 400; // Must match or exceed animation duration

interface TabAnimationContextValue {
  currentTabIndex: number;
  previousTabIndex: number | null;
  setCurrentTab: (tabName: string) => void;
  getTabIndex: (tabName: string) => number;
}

const TabAnimationContext = createContext<TabAnimationContextValue | undefined>(undefined);

export function TabAnimationProvider({ children }: { children: ReactNode }) {
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(1); // Default to 'log'
  const [previousTabIndex, setPreviousTabIndex] = useState<number | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSetIndexRef = useRef<number>(1); // Track the last index we actually set
  const isTransitioningRef = useRef<boolean>(false); // Prevent interruptions during transition

  const setCurrentTab = (tabName: string) => {
    const newIndex = TAB_ORDER[tabName] ?? 1;
    console.log(`[Context] setCurrentTab: ${tabName} (${newIndex}), current: ${currentTabIndex}, previous: ${previousTabIndex}, lastSet: ${lastSetIndexRef.current}, isTransitioning: ${isTransitioningRef.current}`);
    
    // Ignore calls during an active transition
    if (isTransitioningRef.current && newIndex === lastSetIndexRef.current) {
      console.log(`[Context] Ignoring redundant call during transition`);
      return;
    }
    
    // Check against the last index we set, not the current state (which may have already updated)
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
      
      // Update our tracking ref
      lastSetIndexRef.current = newIndex;

      // Clear previous tab after animation completes
      clearTimeoutRef.current = setTimeout(() => {
        console.log(`[Context] Clearing previousTabIndex after animation`);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5580bc91-4b94-4dc0-ad56-07169103db0f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabAnimationContext.tsx:66',message:'Clearing previousTabIndex in context',data:{previousTabIndex:lastSetIndexRef.current,currentTabIndex:newIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setPreviousTabIndex(null);
        isTransitioningRef.current = false;
        clearTimeoutRef.current = null;
      }, ANIMATION_DURATION);
    }
  };

  const getTabIndex = (tabName: string) => {
    return TAB_ORDER[tabName] ?? 1;
  };

  return (
    <TabAnimationContext.Provider
      value={{
        currentTabIndex,
        previousTabIndex,
        setCurrentTab,
        getTabIndex,
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