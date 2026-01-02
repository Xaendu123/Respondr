/**
 * USE BADGES HOOK
 *
 * React hook for managing user badges, streaks, and achievements.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import * as supabaseBadges from '../services/supabase/badgesService';
import { Badge } from '../types';

export interface BadgeStats {
  earned: Badge[];
  locked: Badge[];
  totalPoints: number;
  streak: supabaseBadges.UserStreak | null;
  recentlyEarned: Badge[];
}

export interface NewlyAwardedBadge {
  id: string;
  name: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export function useBadges() {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [lockedBadges, setLockedBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState<supabaseBadges.UserStreak | null>(null);
  const [recentlyEarned, setRecentlyEarned] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBadges = useCallback(async () => {
    if (!user) {
      setEarnedBadges([]);
      setLockedBadges([]);
      setAllBadges([]);
      setTotalPoints(0);
      setStreak(null);
      setRecentlyEarned([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load comprehensive badge stats
      const stats = await supabaseBadges.getUserBadgeStats(user.id);
      setEarnedBadges(stats.earned);
      setLockedBadges(stats.locked);
      setAllBadges([...stats.earned, ...stats.locked]);
      setTotalPoints(stats.totalPoints);
      setStreak(stats.streak);
      setRecentlyEarned(stats.recentlyEarned);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load badges';
      setError(errorMessage);
      console.error('Error loading badges:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Check and award any new badges based on current user stats.
   * Returns list of newly awarded badges.
   */
  const checkAndAward = useCallback(async (): Promise<NewlyAwardedBadge[]> => {
    if (!user) return [];

    try {
      const results = await supabaseBadges.checkAndAwardBadges(user.id);
      const newlyAwarded = results
        .filter(r => r.newly_awarded)
        .map(r => ({
          id: r.badge_id,
          name: r.badge_name,
          icon: r.badge_icon,
          level: r.badge_level,
        }));

      // Refresh badges if any were newly awarded
      if (newlyAwarded.length > 0) {
        await loadBadges();
      }

      return newlyAwarded;
    } catch (err: any) {
      console.error('Error checking badges:', err);
      return [];
    }
  }, [user, loadBadges]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  return {
    earnedBadges,
    lockedBadges,
    allBadges,
    totalPoints,
    streak,
    recentlyEarned,
    loading,
    error,
    refresh: loadBadges,
    checkAndAward,
  };
}

