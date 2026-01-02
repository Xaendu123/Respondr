/**
 * Auth Storage Service Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  storeAuthTokens,
  getAuthToken,
  getRefreshToken,
  storeUser,
  getStoredUser,
  clearAuthData,
} from '../../services/auth/authStorage';

// AsyncStorage mock is set up in setup.ts

describe('Auth Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeAuthTokens', () => {
    it('should store both access and refresh tokens', async () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      await storeAuthTokens(accessToken, refreshToken);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@respondr:auth_token', accessToken);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@respondr:refresh_token', refreshToken);
    });

    it('should store tokens in parallel', async () => {
      const accessToken = 'access';
      const refreshToken = 'refresh';

      // Both calls should be made before either resolves
      await storeAuthTokens(accessToken, refreshToken);

      // Verify both were called (Promise.all behavior)
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAuthToken', () => {
    it('should retrieve access token from storage', async () => {
      const expectedToken = 'stored-access-token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(expectedToken);

      const token = await getAuthToken();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@respondr:auth_token');
      expect(token).toBe(expectedToken);
    });

    it('should return null when no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const token = await getAuthToken();

      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve refresh token from storage', async () => {
      const expectedToken = 'stored-refresh-token';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(expectedToken);

      const token = await getRefreshToken();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@respondr:refresh_token');
      expect(token).toBe(expectedToken);
    });

    it('should return null when no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const token = await getRefreshToken();

      expect(token).toBeNull();
    });
  });

  describe('storeUser', () => {
    it('should store user as JSON string', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      await storeUser(user);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@respondr:user',
        JSON.stringify(user)
      );
    });

    it('should handle complex user objects', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: new Date('2024-01-01'),
      };

      await storeUser(user);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@respondr:user',
        JSON.stringify(user)
      );
    });
  });

  describe('getStoredUser', () => {
    it('should retrieve and parse user from storage', async () => {
      const storedUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedUser));

      const user = await getStoredUser();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@respondr:user');
      expect(user).toEqual(storedUser);
    });

    it('should return null when no user exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const user = await getStoredUser();

      expect(user).toBeNull();
    });

    it('should convert createdAt string to Date object', async () => {
      const dateString = '2024-01-15T10:30:00.000Z';
      const storedUser = {
        id: 'user-123',
        createdAt: dateString,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedUser));

      const user = await getStoredUser();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.toISOString()).toBe(dateString);
    });

    it('should convert updatedAt string to Date object', async () => {
      const dateString = '2024-01-15T10:30:00.000Z';
      const storedUser = {
        id: 'user-123',
        updatedAt: dateString,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedUser));

      const user = await getStoredUser();

      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.updatedAt.toISOString()).toBe(dateString);
    });

    it('should handle user without date fields', async () => {
      const storedUser = {
        id: 'user-123',
        email: 'test@example.com',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedUser));

      const user = await getStoredUser();

      expect(user.createdAt).toBeUndefined();
      expect(user.updatedAt).toBeUndefined();
    });
  });

  describe('clearAuthData', () => {
    it('should remove all auth-related items', async () => {
      await clearAuthData();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@respondr:auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@respondr:refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@respondr:user');
    });

    it('should clear items in parallel', async () => {
      await clearAuthData();

      // All three calls should be made (Promise.all behavior)
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(3);
    });
  });
});
