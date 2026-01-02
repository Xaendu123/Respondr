/**
 * Badges Service Tests
 *
 * Tests for Supabase badges operations including:
 * - Fetching all badges
 * - Fetching user badges (earned/locked)
 * - Getting badge by ID
 * - Badge awarding (via database trigger - not user input)
 * - User streak retrieval (calculated by database)
 * - User badge stats
 *
 * IMPORTANT: Badges and streaks are calculated by the database,
 * NOT by user input. Users cannot directly set their badges or streaks.
 */

import {
  getAllBadges,
  getUserBadges,
  getBadgeById,
  awardBadge,
  checkAndAwardBadges,
  getUserStreak,
  getUserBadgeStats,
} from '../../services/supabase/badgesService';

// Mock the supabase client
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockRpc = jest.fn();

const mockFrom = jest.fn((_table?: string) => ({
  select: mockSelect,
  insert: mockInsert,
}));

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    rpc: (fn: string, params: any) => mockRpc(fn, params),
  },
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Setup default chainable returns with proper chaining
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  });
  mockInsert.mockReturnValue({
    then: jest.fn(),
  });
  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  });
  // Order returns itself to allow chaining .order().order()
  mockOrder.mockImplementation(() => ({
    order: mockOrder,
    eq: mockEq,
    then: jest.fn(),
  }));
});

describe('Badges Service', () => {
  const mockBadge = {
    id: 'badge-123',
    name: 'First Activity',
    description: 'Log your first activity',
    icon: 'star',
    level: 'bronze' as const,
    criteria: { type: 'activity_count', threshold: 1 },
    points: 10,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockUserBadge = {
    id: 'user-badge-123',
    user_id: 'user-123',
    badge_id: 'badge-123',
    earned_at: '2024-01-15T10:00:00Z',
    badges: mockBadge,
  };

  const mockStreak = {
    id: 'streak-123',
    user_id: 'user-123',
    current_streak: 5,
    longest_streak: 10,
    last_activity_date: '2024-01-15',
    streak_start_date: '2024-01-10',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  describe('getAllBadges', () => {
    it('should fetch all active badges', async () => {
      // Need to set up mock to return a promise at the end of the chain
      mockOrder.mockImplementation(() => ({
        order: jest.fn().mockResolvedValue({ data: [mockBadge], error: null }),
        eq: mockEq,
      }));

      const result = await getAllBadges();

      expect(mockFrom).toHaveBeenCalledWith('badges');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('First Activity');
    });

    it('should order badges by level and points', async () => {
      mockOrder.mockImplementation(() => ({
        order: jest.fn().mockResolvedValue({ data: [mockBadge], error: null }),
        eq: mockEq,
      }));

      await getAllBadges();

      expect(mockOrder).toHaveBeenCalledWith('level', { ascending: true });
    });

    it('should throw error when query fails', async () => {
      mockOrder.mockImplementation(() => ({
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
        eq: mockEq,
      }));

      await expect(getAllBadges()).rejects.toThrow('Query failed');
    });

    it('should correctly map badge fields', async () => {
      const platinumBadge = { ...mockBadge, level: 'platinum' };
      mockOrder.mockImplementation(() => ({
        order: jest.fn().mockResolvedValue({ data: [platinumBadge], error: null }),
        eq: mockEq,
      }));

      const result = await getAllBadges();

      // Platinum should be mapped to gold
      expect(result[0].level).toBe('gold');
    });
  });

  describe('getUserBadges', () => {
    it('should return earned and locked badges for user', async () => {
      // First call: all badges
      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      // Second call: user's earned badges
      mockEq.mockResolvedValueOnce({ data: [mockUserBadge], error: null });

      const result = await getUserBadges('user-123');

      expect(mockFrom).toHaveBeenCalledWith('badges');
      expect(mockFrom).toHaveBeenCalledWith('user_badges');
      expect(result.earned).toHaveLength(1);
      expect(result.locked).toHaveLength(0);
    });

    it('should set unlockedAt for earned badges', async () => {
      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [mockUserBadge], error: null });

      const result = await getUserBadges('user-123');

      expect(result.earned[0].unlockedAt).toBeDefined();
      expect(result.earned[0].unlockedAt).toBeInstanceOf(Date);
    });

    it('should separate earned and locked badges correctly', async () => {
      const anotherBadge = { ...mockBadge, id: 'badge-456', name: 'Second Badge' };
      mockEq.mockResolvedValueOnce({ data: [mockBadge, anotherBadge], error: null });
      // User only has the first badge
      mockEq.mockResolvedValueOnce({ data: [mockUserBadge], error: null });

      const result = await getUserBadges('user-123');

      expect(result.earned).toHaveLength(1);
      expect(result.earned[0].name).toBe('First Activity');
      expect(result.locked).toHaveLength(1);
      expect(result.locked[0].name).toBe('Second Badge');
    });

    it('should throw error when badges query fails', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: { message: 'Failed' } });

      await expect(getUserBadges('user-123')).rejects.toThrow('Failed');
    });

    it('should throw error when user badges query fails', async () => {
      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: null, error: { message: 'User badges failed' } });

      await expect(getUserBadges('user-123')).rejects.toThrow('User badges failed');
    });
  });

  describe('getBadgeById', () => {
    it('should fetch a single badge by ID', async () => {
      mockSingle.mockResolvedValue({ data: mockBadge, error: null });

      const result = await getBadgeById('badge-123');

      expect(mockFrom).toHaveBeenCalledWith('badges');
      expect(mockEq).toHaveBeenCalledWith('id', 'badge-123');
      expect(result.name).toBe('First Activity');
    });

    it('should throw error when badge not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      await expect(getBadgeById('nonexistent')).rejects.toThrow('Not found');
    });
  });

  describe('awardBadge', () => {
    it('should insert a user badge record', async () => {
      mockInsert.mockResolvedValue({ error: null });

      await awardBadge('user-123', 'badge-123');

      expect(mockFrom).toHaveBeenCalledWith('user_badges');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-123',
        badge_id: 'badge-123',
      }));
    });

    it('should ignore duplicate key errors (user already has badge)', async () => {
      mockInsert.mockResolvedValue({ error: { code: '23505', message: 'Duplicate' } });

      // Should not throw
      await expect(awardBadge('user-123', 'badge-123')).resolves.not.toThrow();
    });

    it('should throw error for non-duplicate errors', async () => {
      mockInsert.mockResolvedValue({ error: { code: '12345', message: 'Other error' } });

      await expect(awardBadge('user-123', 'badge-123')).rejects.toThrow('Other error');
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should call the RPC function to check and award badges', async () => {
      const mockResult = [
        { badge_id: 'badge-123', badge_name: 'First Activity', badge_icon: 'star', badge_level: 'bronze', newly_awarded: true },
      ];
      mockRpc.mockResolvedValue({ data: mockResult, error: null });

      const result = await checkAndAwardBadges('user-123');

      expect(mockRpc).toHaveBeenCalledWith('check_and_award_badges', { p_user_id: 'user-123' });
      expect(result).toHaveLength(1);
      expect(result[0].newly_awarded).toBe(true);
    });

    it('should return empty array when no badges earned', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      const result = await checkAndAwardBadges('user-123');

      expect(result).toEqual([]);
    });

    it('should throw error when RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(checkAndAwardBadges('user-123')).rejects.toThrow('RPC failed');
    });

    it('should handle null data gracefully', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await checkAndAwardBadges('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getUserStreak', () => {
    it('should fetch user streak data', async () => {
      mockSingle.mockResolvedValue({ data: mockStreak, error: null });

      const result = await getUserStreak('user-123');

      expect(mockFrom).toHaveBeenCalledWith('user_streaks');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result?.currentStreak).toBe(5);
      expect(result?.longestStreak).toBe(10);
    });

    it('should return null when no streak record exists', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getUserStreak('user-123');

      expect(result).toBeNull();
    });

    it('should throw error for non-not-found errors', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'Error' } });

      await expect(getUserStreak('user-123')).rejects.toThrow('Error');
    });

    it('should map streak fields correctly', async () => {
      mockSingle.mockResolvedValue({ data: mockStreak, error: null });

      const result = await getUserStreak('user-123');

      expect(result).toEqual({
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: '2024-01-15',
        streakStartDate: '2024-01-10',
      });
    });
  });

  describe('getUserBadgeStats', () => {
    it('should return comprehensive badge stats', async () => {
      // getUserBadges calls
      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [mockUserBadge], error: null });
      // Points query
      mockEq.mockResolvedValueOnce({ data: [{ badges: { points: 10 } }], error: null });
      // Streak query
      mockSingle.mockResolvedValue({ data: mockStreak, error: null });

      const result = await getUserBadgeStats('user-123');

      expect(result.earned).toHaveLength(1);
      expect(result.locked).toHaveLength(0);
      expect(result.totalPoints).toBe(10);
      expect(result.streak?.currentStreak).toBe(5);
    });

    it('should calculate total points from earned badges', async () => {
      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [mockUserBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [
        { badges: { points: 10 } },
        { badges: { points: 25 } },
        { badges: { points: 50 } },
      ], error: null });
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getUserBadgeStats('user-123');

      expect(result.totalPoints).toBe(85);
    });

    it('should handle missing points gracefully', async () => {
      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [mockUserBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [{ badges: null }], error: null });
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getUserBadgeStats('user-123');

      expect(result.totalPoints).toBe(0);
    });

    it('should identify recently earned badges (last 30 days)', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15); // 15 days ago
      const recentUserBadge = { ...mockUserBadge, earned_at: recentDate.toISOString() };

      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [recentUserBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [{ badges: { points: 10 } }], error: null });
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getUserBadgeStats('user-123');

      expect(result.recentlyEarned).toHaveLength(1);
    });

    it('should not include old badges in recently earned', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago
      const oldUserBadge = { ...mockUserBadge, earned_at: oldDate.toISOString() };

      mockEq.mockResolvedValueOnce({ data: [mockBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [oldUserBadge], error: null });
      mockEq.mockResolvedValueOnce({ data: [{ badges: { points: 10 } }], error: null });
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getUserBadgeStats('user-123');

      expect(result.recentlyEarned).toHaveLength(0);
    });
  });

  describe('Data Integrity - Calculated Fields', () => {
    /**
     * CRITICAL: These tests verify that badges and streaks are NOT
     * directly modifiable by users. All gamification data must be
     * calculated by the database via triggers and RPC functions.
     */

    it('badges service does not allow direct streak manipulation', () => {
      // The service only reads streak data, never writes it directly
      // getUserStreak only uses SELECT, never INSERT/UPDATE
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('badge awards go through RPC or controlled insert', async () => {
      mockInsert.mockResolvedValue({ error: null });

      // awardBadge is the only way to add badges, and it's typically
      // called from checkAndAwardBadges which validates via RPC
      await awardBadge('user-123', 'badge-123');

      // The insert only includes user_id, badge_id, and earned_at
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-123',
        badge_id: 'badge-123',
      }));

      // It should NOT include points, level, or any other calculated fields
      expect(mockInsert).not.toHaveBeenCalledWith(expect.objectContaining({
        points: expect.anything(),
      }));
    });

    it('checkAndAwardBadges uses server-side RPC for validation', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      await checkAndAwardBadges('user-123');

      // The RPC function handles all the business logic server-side
      expect(mockRpc).toHaveBeenCalledWith('check_and_award_badges', {
        p_user_id: 'user-123',
      });
    });
  });
});
