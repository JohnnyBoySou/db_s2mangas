import { jest } from '@jest/globals';
import { followProfile, unfollowProfile, toggleFollowProfile } from './index';
import prisma from '@/prisma/client';
import * as notificationHandlers from '@/handlers/notifications';

// Mock do Prisma Client
jest.mock('@/prisma/client', () => ({
  user: {
    findUnique: jest.fn(),
  },
  profileFollow: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock dos handlers de notificação
jest.mock('@/handlers/notifications', () => ({
  createFollowNotification: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockNotificationHandlers = notificationHandlers as jest.Mocked<typeof notificationHandlers>;

describe('Profile Handlers - Follow System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('followProfile', () => {
    it('should follow a user and create notification successfully', async () => {
      // Given
      const mockTarget = {
        id: 'target-user-id',
        username: 'targetuser',
        name: 'Target User',
      };

      const mockFollower = {
        id: 'follower-user-id',
        username: 'followeruser',
        name: 'Follower User',
      };

      const mockFollow = {
        id: 'follow-id',
        userId: 'follower-user-id',
        targetId: 'target-user-id',
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockTarget as any) // target user
        .mockResolvedValueOnce(mockFollower as any); // follower user
      
      mockPrisma.profileFollow.findUnique.mockResolvedValue(null); // não existe follow
      mockPrisma.profileFollow.create.mockResolvedValue(mockFollow as any);
      mockNotificationHandlers.createFollowNotification.mockResolvedValue({} as any);

      // When
      const result = await followProfile('follower-user-id', 'targetuser');

      // Then
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'targetuser' },
      });
      expect(mockPrisma.profileFollow.findUnique).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId: 'follower-user-id',
            targetId: 'target-user-id'
          }
        },
      });
      expect(mockPrisma.profileFollow.create).toHaveBeenCalledWith({
        data: {
          userId: 'follower-user-id',
          targetId: 'target-user-id',
        },
      });
      expect(mockNotificationHandlers.createFollowNotification).toHaveBeenCalledWith(
        'follower-user-id',
        'target-user-id',
        'Follower User'
      );
      expect(result).toEqual(mockFollow);
    });

    it('should throw error when trying to follow non-existent user', async () => {
      // Given
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(followProfile('user-id', 'nonexistent'))
        .rejects
        .toThrow('Usuário não encontrado');
    });

    it('should throw error when trying to follow yourself', async () => {
      // Given
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      // When & Then
      await expect(followProfile('user-id', 'testuser'))
        .rejects
        .toThrow('Você não pode seguir a si mesmo');
    });

    it('should throw error when already following user', async () => {
      // Given
      const mockTarget = {
        id: 'target-user-id',
        username: 'targetuser',
      };
      const mockExistingFollow = {
        id: 'existing-follow-id',
        userId: 'follower-user-id',
        targetId: 'target-user-id',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockTarget as any);
      mockPrisma.profileFollow.findUnique.mockResolvedValue(mockExistingFollow as any);

      // When & Then
      await expect(followProfile('follower-user-id', 'targetuser'))
        .rejects
        .toThrow('Você já segue este perfil');
    });

    it('should continue follow operation even if notification fails', async () => {
      // Given
      const mockTarget = {
        id: 'target-user-id',
        username: 'targetuser',
      };
      const mockFollower = {
        id: 'follower-user-id',
        username: 'followeruser',
        name: 'Follower User',
      };
      const mockFollow = {
        id: 'follow-id',
        userId: 'follower-user-id',
        targetId: 'target-user-id',
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockTarget as any)
        .mockResolvedValueOnce(mockFollower as any);
      mockPrisma.profileFollow.findFirst.mockResolvedValue(null);
      mockPrisma.profileFollow.create.mockResolvedValue(mockFollow as any);
      mockNotificationHandlers.createFollowNotification.mockRejectedValue(new Error('Notification error'));

      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // When
      const result = await followProfile('follower-user-id', 'targetuser');

      // Then
      expect(result).toEqual(mockFollow);
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao criar notificação de follow:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('toggleFollowProfile', () => {
    it('should follow user when not already following', async () => {
      const mockUser = { id: 'target-user-id', username: 'targetuser' };
      const mockFollower = { id: 'follower-user-id', username: 'follower', name: 'Follower User' };
      const mockFollow = { userId: 'follower-user-id', targetId: 'target-user-id' };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockFollower as any);
      mockPrisma.profileFollow.findUnique.mockResolvedValue(null);
      mockPrisma.profileFollow.create.mockResolvedValue(mockFollow as any);
      mockNotificationHandlers.createFollowNotification.mockResolvedValue({} as any);

      const result = await toggleFollowProfile('different-user-id', 'targetuser');

      expect(mockPrisma.profileFollow.create).toHaveBeenCalledWith({
        data: {
          userId: 'different-user-id',
          targetId: 'target-user-id'
        }
      });
      expect(result).toEqual({ followed: true });
    });

    it('should unfollow user when already following', async () => {
      const mockUser = { id: 'target-user-id', username: 'targetuser' };
      const mockFollower = { id: 'different-user-id', username: 'follower', name: 'Follower User' };
      const mockFollow = { userId: 'different-user-id', targetId: 'target-user-id' };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockFollower as any);
      mockPrisma.profileFollow.findUnique.mockResolvedValue(mockFollow as any);
      mockPrisma.profileFollow.delete.mockResolvedValue(mockFollow as any);

      const result = await toggleFollowProfile('different-user-id', 'targetuser');

      expect(mockPrisma.profileFollow.delete).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId: 'different-user-id',
            targetId: 'target-user-id'
          }
        }
      });
      expect(result).toEqual({ followed: false });
    });
  });

  describe('unfollowProfile', () => {
    it('should unfollow user successfully', async () => {
      const mockUser = { id: 'target-user-id', username: 'targetuser' };
      const mockFollow = { userId: 'follower-user-id', targetId: 'target-user-id' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.profileFollow.findUnique.mockResolvedValue(mockFollow as any);
      mockPrisma.profileFollow.delete.mockResolvedValue(mockFollow as any);

      const result = await unfollowProfile('follower-user-id', 'targetuser');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'targetuser' }
      });
      expect(mockPrisma.profileFollow.findUnique).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId: 'follower-user-id',
            targetId: 'target-user-id'
          }
        }
      });
      expect(mockPrisma.profileFollow.delete).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId: 'follower-user-id',
            targetId: 'target-user-id'
          }
        }
      });
      expect(result).toEqual(mockFollow);
    });

    it('should throw error if user is not following', async () => {
      const mockUser = { id: 'target-user-id', username: 'targetuser' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.profileFollow.findUnique.mockResolvedValue(null);

      await expect(unfollowProfile('follower-user-id', 'targetuser'))
        .rejects
        .toThrow('Você ainda não segue este perfil');
    });
  });
});