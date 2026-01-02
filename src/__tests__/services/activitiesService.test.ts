/**
 * Activities Service Tests
 *
 * Tests for Supabase activities CRUD operations including:
 * - Creating activities
 * - Reading activities (single and list)
 * - Updating activities
 * - Deleting activities
 * - Adding/removing reactions
 * - Adding comments
 *
 * IMPORTANT: These tests verify that ONLY user-controllable data
 * is passed to Supabase. Calculated fields (view_count, streaks, badges)
 * are handled by database triggers.
 */

import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  addReaction,
  removeReaction,
  addComment,
  CreateActivityData,
  UpdateActivityData,
} from '../../services/supabase/activitiesService';

// Create chainable mock that resolves to a value
const createChainableMock = (resolvedValue: any = { data: null, error: null }) => {
  const chainable: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'single', 'order'];

  methods.forEach(method => {
    chainable[method] = jest.fn(() => chainable);
  });

  // Make it thenable
  chainable.then = (resolve: any) => resolve(resolvedValue);

  return chainable;
};

// Track insert calls for data integrity tests
let lastInsertData: any = null;
let lastUpdateData: any = null;

const mockGetUser = jest.fn();

const mockFrom = jest.fn((table: string) => {
  const chain = createChainableMock();

  // Capture insert data
  chain.insert = jest.fn((data: any) => {
    lastInsertData = data;
    return chain;
  });

  // Capture update data
  chain.update = jest.fn((data: any) => {
    lastUpdateData = data;
    return chain;
  });

  return chain;
});

jest.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  lastInsertData = null;
  lastUpdateData = null;
});

describe('Activities Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockProfile = { display_name: 'Test User', avatar: 'avatar.jpg', unit_id: 'unit-123' };

  const mockActivity = {
    id: 'activity-123',
    user_id: 'user-123',
    type: 'training',
    title: 'Test Training',
    description: 'A test training session',
    duration: 60,
    date: '2024-01-15T10:00:00Z',
    location: 'Test Location',
    visibility: 'unit',
    category: null,
    false_alarm: false,
    tags: ['test'],
    images: [],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    profiles: { id: 'user-123', display_name: 'Test User', avatar: 'avatar.jpg' },
    reactions: [],
    comments: [],
  };

  describe('getActivities', () => {
    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(getActivities()).rejects.toThrow('No authenticated user');
    });

    it('should call supabase from activities table', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });

      // Create mock that returns activities
      mockFrom.mockImplementation(() => {
        const chain = createChainableMock({ data: [mockActivity], error: null });
        return chain;
      });

      const result = await getActivities('all');

      expect(mockFrom).toHaveBeenCalledWith('activities');
      expect(result).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => createChainableMock({ data: [], error: null }));

      const result = await getActivities('all');

      expect(result).toHaveLength(0);
    });
  });

  describe('getActivity', () => {
    it('should fetch activity by ID', async () => {
      mockFrom.mockImplementation(() => createChainableMock({ data: mockActivity, error: null }));

      const result = await getActivity('activity-123');

      expect(mockFrom).toHaveBeenCalledWith('activities');
      expect(result.id).toBe('activity-123');
      expect(result.title).toBe('Test Training');
    });

    it('should throw error when not found', async () => {
      // The service throws when error is returned from Supabase
      // We need the mock to properly return an error that the service will throw
      mockFrom.mockImplementation(() => {
        const chain: any = {};
        ['select', 'eq', 'single', 'order'].forEach(m => {
          chain[m] = jest.fn(() => chain);
        });
        // Return a promise that resolves with an error
        chain.then = (resolve: any, reject: any) => {
          // Simulate Supabase returning an error object
          return Promise.resolve({ data: null, error: { message: 'Not found' } }).then(resolve, reject);
        };
        return chain;
      });

      // The getActivity function throws when there's an error
      await expect(getActivity('nonexistent')).rejects.toBeDefined();
    });
  });

  describe('createActivity', () => {
    const createData: CreateActivityData = {
      type: 'training',
      title: 'New Training',
      description: 'Description',
      duration: 90,
      date: new Date('2024-01-20T14:00:00Z'),
      location: 'Training Center',
      visibility: 'unit',
    };

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(createActivity(createData)).rejects.toThrow('No authenticated user');
    });

    it('should create activity with user input data', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => {
        const chain = createChainableMock({ data: mockActivity, error: null });
        chain.insert = jest.fn((data: any) => {
          lastInsertData = data;
          return chain;
        });
        return chain;
      });

      await createActivity(createData);

      expect(mockFrom).toHaveBeenCalledWith('activities');
      expect(lastInsertData).toBeDefined();
      expect(lastInsertData.title).toBe('New Training');
      expect(lastInsertData.user_id).toBe('user-123');
    });

    it('should include all user-provided fields', async () => {
      const fullData: CreateActivityData = {
        type: 'operation',
        title: 'Full Test',
        description: 'Full description',
        situation: 'Emergency situation',
        lessonsLearned: 'Learned something',
        duration: 120,
        date: new Date('2024-01-20T14:00:00Z'),
        location: 'Location',
        latitude: 47.0,
        longitude: 8.0,
        unitId: 'unit-123',
        visibility: 'public',
        category: 'A1',
        falseAlarm: true,
        tags: ['tag1', 'tag2'],
        images: ['image.jpg'],
      };

      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => {
        const chain = createChainableMock({ data: mockActivity, error: null });
        chain.insert = jest.fn((data: any) => {
          lastInsertData = data;
          return chain;
        });
        return chain;
      });

      await createActivity(fullData);

      expect(lastInsertData.type).toBe('operation');
      expect(lastInsertData.situation).toBe('Emergency situation');
      expect(lastInsertData.lessons_learned).toBe('Learned something');
      expect(lastInsertData.category).toBe('A1');
      expect(lastInsertData.false_alarm).toBe(true);
    });
  });

  describe('updateActivity', () => {
    const updateData: UpdateActivityData = {
      id: 'activity-123',
      title: 'Updated Training',
      description: 'Updated description',
    };

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(updateActivity(updateData)).rejects.toThrow('No authenticated user');
    });

    it('should update activity with user input', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => {
        const chain = createChainableMock({ data: mockActivity, error: null });
        chain.update = jest.fn((data: any) => {
          lastUpdateData = data;
          return chain;
        });
        return chain;
      });

      await updateActivity(updateData);

      expect(mockFrom).toHaveBeenCalledWith('activities');
      expect(lastUpdateData).toBeDefined();
      expect(lastUpdateData.title).toBe('Updated Training');
    });
  });

  describe('deleteActivity', () => {
    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(deleteActivity('activity-123')).rejects.toThrow('No authenticated user');
    });

    it('should delete activity', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => createChainableMock({ error: null }));

      await deleteActivity('activity-123');

      expect(mockFrom).toHaveBeenCalledWith('activities');
    });
  });

  describe('addReaction', () => {
    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(addReaction('activity-123', 'respect')).rejects.toThrow('No authenticated user');
    });

    it('should add reaction to reactions table', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => {
        const chain = createChainableMock({ error: null });
        chain.insert = jest.fn((data: any) => {
          lastInsertData = data;
          return chain;
        });
        return chain;
      });

      await addReaction('activity-123', 'respect');

      expect(mockFrom).toHaveBeenCalledWith('reactions');
      expect(lastInsertData.activity_id).toBe('activity-123');
      expect(lastInsertData.user_id).toBe('user-123');
      expect(lastInsertData.type).toBe('respect');
    });

    it('should support all reaction types', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });

      const reactionTypes: Array<'respect' | 'strong' | 'teamwork' | 'impressive'> =
        ['respect', 'strong', 'teamwork', 'impressive'];

      for (const type of reactionTypes) {
        mockFrom.mockImplementation(() => {
          const chain = createChainableMock({ error: null });
          chain.insert = jest.fn((data: any) => {
            lastInsertData = data;
            return chain;
          });
          return chain;
        });

        await addReaction('activity-123', type);
        expect(lastInsertData.type).toBe(type);
      }
    });
  });

  describe('removeReaction', () => {
    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(removeReaction('activity-123')).rejects.toThrow('No authenticated user');
    });

    it('should delete reaction from reactions table', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => createChainableMock({ error: null }));

      await removeReaction('activity-123');

      expect(mockFrom).toHaveBeenCalledWith('reactions');
    });
  });

  describe('addComment', () => {
    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await expect(addComment('activity-123', 'Test comment')).rejects.toThrow('No authenticated user');
    });

    it('should add comment to comments table', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });

      // First call returns profile, second returns the comment
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'profiles') {
          return createChainableMock({ data: mockProfile, error: null });
        }
        const chain = createChainableMock({
          data: {
            id: 'comment-123',
            activity_id: 'activity-123',
            user_id: 'user-123',
            text: 'Test comment',
            created_at: '2024-01-15T10:00:00Z',
          },
          error: null
        });
        chain.insert = jest.fn((data: any) => {
          lastInsertData = data;
          return chain;
        });
        return chain;
      });

      const result = await addComment('activity-123', 'Test comment');

      expect(result.content).toBe('Test comment');
      expect(lastInsertData.text).toBe('Test comment');
      expect(lastInsertData.activity_id).toBe('activity-123');
    });
  });

  describe('Data Integrity - User Input Only', () => {
    /**
     * CRITICAL: These tests verify that the activities service ONLY
     * passes user-controllable data to Supabase. Calculated fields like
     * view_count, streaks, and badges must be handled by the database.
     */

    const userInputData: CreateActivityData = {
      type: 'training',
      title: 'User Input Test',
      description: 'Description from user',
      situation: 'Situation from user',
      lessonsLearned: 'Lessons from user',
      duration: 60,
      date: new Date('2024-01-20T14:00:00Z'),
      location: 'User specified location',
      latitude: 47.3769,
      longitude: 8.5417,
      unitId: 'unit-123',
      visibility: 'unit',
      category: 'A1',
      falseAlarm: false,
      tags: ['tag1', 'tag2'],
      images: ['image1.jpg'],
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockFrom.mockImplementation(() => {
        const chain = createChainableMock({ data: mockActivity, error: null });
        chain.insert = jest.fn((data: any) => {
          lastInsertData = data;
          return chain;
        });
        chain.update = jest.fn((data: any) => {
          lastUpdateData = data;
          return chain;
        });
        return chain;
      });
    });

    it('should NOT include view_count in create activity data', async () => {
      await createActivity(userInputData);

      expect(lastInsertData).not.toHaveProperty('view_count');
    });

    it('should NOT include streak data in create activity data', async () => {
      await createActivity(userInputData);

      expect(lastInsertData).not.toHaveProperty('current_streak');
      expect(lastInsertData).not.toHaveProperty('longest_streak');
      expect(lastInsertData).not.toHaveProperty('streak_start_date');
    });

    it('should NOT include badge/points data in create activity data', async () => {
      await createActivity(userInputData);

      expect(lastInsertData).not.toHaveProperty('badge_id');
      expect(lastInsertData).not.toHaveProperty('points');
      expect(lastInsertData).not.toHaveProperty('badges');
    });

    it('should NOT include reaction/comment counts in create activity data', async () => {
      await createActivity(userInputData);

      expect(lastInsertData).not.toHaveProperty('reaction_count');
      expect(lastInsertData).not.toHaveProperty('comment_count');
    });

    it('should only include user-controllable fields in insert', async () => {
      await createActivity(userInputData);

      // These are the ONLY fields that should be passed from user input
      const allowedFields = [
        'user_id',
        'type',
        'title',
        'description',
        'situation',
        'lessons_learned',
        'duration',
        'date',
        'location',
        'latitude',
        'longitude',
        'unit_id',
        'visibility',
        'category',
        'false_alarm',
        'tags',
        'images',
        'created_at',
        'updated_at',
      ];

      const insertKeys = Object.keys(lastInsertData || {});
      insertKeys.forEach(key => {
        expect(allowedFields).toContain(key);
      });
    });

    it('should NOT allow updating view_count via updateActivity', async () => {
      const updateData: UpdateActivityData = {
        id: 'activity-123',
        title: 'Updated Title',
      };

      await updateActivity(updateData);

      expect(lastUpdateData).not.toHaveProperty('view_count');
    });

    it('should NOT allow updating streak data via updateActivity', async () => {
      const updateData: UpdateActivityData = {
        id: 'activity-123',
        title: 'Updated Title',
      };

      await updateActivity(updateData);

      expect(lastUpdateData).not.toHaveProperty('current_streak');
      expect(lastUpdateData).not.toHaveProperty('longest_streak');
    });
  });

  describe('Activity Data Mapping', () => {
    it('should correctly map activity fields from Supabase format', async () => {
      const supabaseActivity = {
        ...mockActivity,
        lessons_learned: 'Important lessons',
        false_alarm: true,
        profiles: { id: 'user-123', display_name: 'Mapper Test', avatar: 'avatar.jpg' },
      };

      mockFrom.mockImplementation(() => createChainableMock({ data: supabaseActivity, error: null }));

      const result = await getActivity('activity-123');

      expect(result.lessonsLearned).toBe('Important lessons');
      expect(result.falseAlarm).toBe(true);
      expect(result.userDisplayName).toBe('Mapper Test');
    });

    it('should handle null/undefined optional fields', async () => {
      const minimalActivity = {
        id: 'activity-123',
        user_id: 'user-123',
        type: 'training',
        title: 'Minimal',
        duration: 30,
        date: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        description: null,
        situation: null,
        lessons_learned: null,
        location: null,
        latitude: null,
        longitude: null,
        visibility: 'private',
        category: null,
        false_alarm: false,
        tags: null,
        images: null,
        profiles: null,
        reactions: null,
        comments: null,
      };

      mockFrom.mockImplementation(() => createChainableMock({ data: minimalActivity, error: null }));

      const result = await getActivity('activity-123');

      expect(result.description).toBeNull();
      expect(result.tags).toEqual([]);
      expect(result.images).toEqual([]);
      expect(result.reactions).toEqual([]);
      expect(result.comments).toEqual([]);
      expect(result.userDisplayName).toBe('Unknown');
    });

    it('should map reactions correctly', async () => {
      const activityWithReactions = {
        ...mockActivity,
        reactions: [
          { id: 'r1', activity_id: 'activity-123', user_id: 'user-1', type: 'respect', created_at: '2024-01-15T10:00:00Z' },
          { id: 'r2', activity_id: 'activity-123', user_id: 'user-2', type: 'strong', created_at: '2024-01-15T11:00:00Z' },
        ],
      };

      mockFrom.mockImplementation(() => createChainableMock({ data: activityWithReactions, error: null }));

      const result = await getActivity('activity-123');

      expect(result.reactions).toHaveLength(2);
      expect(result.reactions[0].type).toBe('respect');
      expect(result.reactions[1].type).toBe('strong');
    });

    it('should map comments correctly', async () => {
      const activityWithComments = {
        ...mockActivity,
        comments: [
          { id: 'c1', activity_id: 'activity-123', user_id: 'user-1', text: 'Great work!', created_at: '2024-01-15T10:00:00Z' },
        ],
      };

      mockFrom.mockImplementation(() => createChainableMock({ data: activityWithComments, error: null }));

      const result = await getActivity('activity-123');

      expect(result.comments).toHaveLength(1);
    });
  });
});
