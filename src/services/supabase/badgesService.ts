/**
 * SUPABASE BADGES SERVICE
 * 
 * Handles badge-related operations with Supabase.
 */

import { supabase } from '../../config/supabase';
import { Badge } from '../../types';

// Type definitions for Supabase badge tables
type BadgeRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: any; // JSONB
  points: number;
  is_active: boolean;
  created_at: string;
};

type UserBadgeRow = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
};

/**
 * Maps a Supabase Badge row to the app's Badge type.
 */
const mapBadgeRowToBadge = (row: BadgeRow): Badge => {
  // Extract requirement from criteria if it exists
  let requirement = '';
  if (row.criteria) {
    if (typeof row.criteria === 'object') {
      // Try to extract meaningful requirement text
      requirement = JSON.stringify(row.criteria);
    } else {
      requirement = String(row.criteria);
    }
  }
  
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    level: (row.level === 'platinum' ? 'gold' : row.level) as Badge['level'], // Map platinum to gold
    requirement: requirement || row.description,
  };
};

/**
 * Fetches all available badges.
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('level', { ascending: true })
    .order('points', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapBadgeRowToBadge);
}

/**
 * Fetches user's earned and locked badges.
 */
export async function getUserBadges(userId: string): Promise<{ earned: Badge[]; locked: Badge[] }> {
  // Get all active badges
  const { data: allBadges, error: badgesError } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true);

  if (badgesError) {
    throw new Error(badgesError.message);
  }

  // Get user's earned badges
  const { data: userBadges, error: userBadgesError } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId);

  if (userBadgesError) {
    throw new Error(userBadgesError.message);
  }

  const earnedBadgeIds = new Set((userBadges || []).map(ub => ub.badge_id));

  // Separate earned and locked badges
  const earned: Badge[] = [];
  const locked: Badge[] = [];

  allBadges.forEach((badgeRow) => {
    const badge = mapBadgeRowToBadge(badgeRow);
    
    if (earnedBadgeIds.has(badgeRow.id)) {
      // Find when it was earned
      const userBadge = userBadges?.find(ub => ub.badge_id === badgeRow.id);
      if (userBadge) {
        badge.unlockedAt = new Date(userBadge.earned_at);
      }
      earned.push(badge);
    } else {
      locked.push(badge);
    }
  });

  return { earned, locked };
}

/**
 * Fetches a single badge by ID.
 */
export async function getBadgeById(badgeId: string): Promise<Badge> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapBadgeRowToBadge(data);
}

/**
 * Awards a badge to a user.
 */
export async function awardBadge(userId: string, badgeId: string): Promise<void> {
  const { error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      earned_at: new Date().toISOString(),
    });

  if (error) {
    // Ignore duplicate key errors (user already has badge)
    if (error.code !== '23505') {
      throw new Error(error.message);
    }
  }
}

/**
 * Result from checking and awarding badges
 */
export interface BadgeCheckResult {
  badge_id: string;
  badge_name: string;
  badge_icon: string;
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  newly_awarded: boolean;
}

/**
 * Checks user's stats and awards any earned badges.
 * Returns list of all earned badges with newly_awarded flag.
 */
export async function checkAndAwardBadges(userId: string): Promise<BadgeCheckResult[]> {
  const { data, error } = await supabase.rpc('check_and_award_badges', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking badges:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * User streak information
 */
export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
}

/**
 * Fetches user's streak information.
 */
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No streak record found
      return null;
    }
    throw new Error(error.message);
  }

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: data.last_activity_date,
    streakStartDate: data.streak_start_date,
  };
}

/**
 * Gets comprehensive user badge stats
 */
export interface UserBadgeStats {
  earned: Badge[];
  locked: Badge[];
  totalPoints: number;
  streak: UserStreak | null;
  recentlyEarned: Badge[];
}

/**
 * Fetches comprehensive badge stats for a user including points and streaks.
 */
export async function getUserBadgeStats(userId: string): Promise<UserBadgeStats> {
  // Get badges
  const { earned, locked } = await getUserBadges(userId);

  // Calculate total points from earned badges
  const { data: earnedWithPoints } = await supabase
    .from('user_badges')
    .select('badges(points)')
    .eq('user_id', userId);

  const totalPoints = (earnedWithPoints || []).reduce(
    (sum, ub: any) => sum + (ub.badges?.points || 0),
    0
  );

  // Get streak
  const streak = await getUserStreak(userId);

  // Get recently earned (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentlyEarned = earned.filter(
    badge => badge.unlockedAt && badge.unlockedAt > thirtyDaysAgo
  );

  return {
    earned,
    locked,
    totalPoints,
    streak,
    recentlyEarned,
  };
}

