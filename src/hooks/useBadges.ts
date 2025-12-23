/**
 * USE BADGES HOOK
 * 
 * React hook for managing user badges.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import * as supabaseBadges from '../services/supabase/badgesService';
import { Badge } from '../types';

export function useBadges() {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [lockedBadges, setLockedBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBadges = useCallback(async () => {
    if (!user) {
      setEarnedBadges([]);
      setLockedBadges([]);
      setAllBadges([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load user's badges (earned and locked)
      const userBadges = await supabaseBadges.getUserBadges(user.id);
      setEarnedBadges(userBadges.earned);
      setLockedBadges(userBadges.locked);
      setAllBadges([...userBadges.earned, ...userBadges.locked]);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load badges';
      setError(errorMessage);
      console.error('Error loading badges:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  return {
    earnedBadges,
    lockedBadges,
    allBadges,
    loading,
    error,
    refresh: loadBadges,
  };
}

