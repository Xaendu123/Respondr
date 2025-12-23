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

