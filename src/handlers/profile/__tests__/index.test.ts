import { prismaMock } from '../../../test/mocks/prisma';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock,
}));

import {
  getProfileData,
  likeProfile,
  unlikeProfile,
  followProfile,
  unfollowProfile,
  toggleLikeProfile,
  toggleFollowProfile,
} from '../index';

describe('Profile Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfileData', () => {
    it('should get profile data with collections and counts', async () => {
      // Given
      const username = 'testuser';
      const authenticatedUserId = 'auth-user-id';
      const mockProfile = {
        id: 'user-id',
        name: 'Test User',
        username: 'testuser',
        avatar: 'avatar.jpg',
        bio: 'Test bio',
        cover: 'cover.jpg',
        createdAt: new Date(),
        collections: [
          {
            id: 'collection-1',
            name: 'My Collection',
            cover: 'collection-cover.jpg',
            description: 'Test collection',
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: {
              likes: 5,
              mangas: 10
            }
          }
        ],
        _count: {
          libraryEntries: 20,
          profileLikedBy: 15,
          comments: 8,
          followers: 12,
          following: 18
        }
      };

      prismaMock.user.findUnique.mockResolvedValueOnce(mockProfile);
      prismaMock.profileFollow.findUnique.mockResolvedValueOnce({ id: 'follow-id' });
      prismaMock.profileLike.findUnique.mockResolvedValueOnce({ id: 'like-id' });

      // When
      const result = await getProfileData(username, authenticatedUserId);

      // Then
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { username },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          cover: true,
          createdAt: true,
          collections: {
            where: {
              status: 'PUBLIC'
            },
            select: {
              id: true,
              name: true,
              cover: true,
              description: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  likes: true,
                  mangas: true
                }
              }
            }
          },
          _count: {
            select: {
              libraryEntries: true,
              profileLikedBy: true,
              comments: true,
              followers: true,
              following: true
            }
          }
        }
      });

      expect(result).toEqual({
        ...mockProfile,
        _count: {
          libraryEntries: 20,
          comments: 8,
          followers: 12,
          following: 18,
          likes: 15
        },
        isFollowing: true,
        isLiked: true
      });
    });

    it('should throw error when profile not found', async () => {
      // Given
      const username = 'nonexistent';
      const authenticatedUserId = 'auth-user-id';
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getProfileData(username, authenticatedUserId)).rejects.toThrow('Perfil não encontrado');
    });

    it('should return profile with isFollowing and isLiked as false when not following/liking', async () => {
      // Given
      const username = 'testuser';
      const authenticatedUserId = 'auth-user-id';
      const mockProfile = {
        id: 'user-id',
        name: 'Test User',
        username: 'testuser',
        avatar: 'avatar.jpg',
        bio: 'Test bio',
        cover: 'cover.jpg',
        createdAt: new Date(),
        collections: [],
        _count: {
          libraryEntries: 0,
          profileLikedBy: 0,
          comments: 0,
          followers: 0,
          following: 0
        }
      };

      prismaMock.user.findUnique.mockResolvedValueOnce(mockProfile);
      prismaMock.profileFollow.findUnique.mockResolvedValueOnce(null);
      prismaMock.profileLike.findUnique.mockResolvedValueOnce(null);

      // When
      const result = await getProfileData(username, authenticatedUserId);

      // Then
      expect(result.isFollowing).toBe(false);
      expect(result.isLiked).toBe(false);
    });
  });

  describe('likeProfile', () => {
    it('should like profile successfully', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const mockLike = {
        id: 'like-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileLike.findUnique.mockResolvedValue(null);
      prismaMock.profileLike.create.mockResolvedValue(mockLike);

      // When
      const result = await likeProfile(userId, targetUsername);

      // Then
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { username: targetUsername }
      });
      expect(prismaMock.profileLike.create).toHaveBeenCalledWith({
        data: {
          userId,
          targetId: 'target-id'
        }
      });
      expect(result).toEqual(mockLike);
    });

    it('should throw error when target profile not found', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'nonexistent';
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(likeProfile(userId, targetUsername)).rejects.toThrow('Perfil não encontrado');
    });

    it('should throw error when trying to like own profile', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: userId, // Same as userId
        username: targetUsername,
        name: 'Target User'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);

      // When & Then
      await expect(likeProfile(userId, targetUsername)).rejects.toThrow('Não é possível curtir seu próprio perfil');
    });

    it('should throw error when already liked', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const existingLike = {
        id: 'like-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileLike.findUnique.mockResolvedValue(existingLike);

      // When & Then
      await expect(likeProfile(userId, targetUsername)).rejects.toThrow('Você já curtiu este perfil');
    });
  });

  describe('unlikeProfile', () => {
    it('should unlike profile successfully', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const existingLike = {
        id: 'like-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileLike.findUnique.mockResolvedValue(existingLike);
      prismaMock.profileLike.delete.mockResolvedValue(existingLike);

      // When
      const result = await unlikeProfile(userId, targetUsername);

      // Then
      expect(prismaMock.profileLike.delete).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId,
            targetId: 'target-id'
          }
        }
      });
      expect(result).toEqual(existingLike);
    });

    it('should throw error when profile not found', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'nonexistent';
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(unlikeProfile(userId, targetUsername)).rejects.toThrow('Perfil não encontrado');
    });

    it('should throw error when not liked yet', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileLike.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(unlikeProfile(userId, targetUsername)).rejects.toThrow('Você ainda não curtiu este perfil');
    });
  });

  describe('followProfile', () => {
    it('should follow profile successfully', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const mockFollow = {
        id: 'follow-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileFollow.findUnique.mockResolvedValue(null);
      prismaMock.profileFollow.create.mockResolvedValue(mockFollow);

      // When
      const result = await followProfile(userId, targetUsername);

      // Then
      expect(prismaMock.profileFollow.create).toHaveBeenCalledWith({
        data: {
          userId,
          targetId: 'target-id'
        }
      });
      expect(result).toEqual(mockFollow);
    });

    it('should throw error when trying to follow own profile', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: userId, // Same as userId
        username: targetUsername,
        name: 'Target User'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);

      // When & Then
      await expect(followProfile(userId, targetUsername)).rejects.toThrow('Não é possível seguir seu próprio perfil');
    });

    it('should throw error when already following', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const existingFollow = {
        id: 'follow-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileFollow.findUnique.mockResolvedValue(existingFollow);

      // When & Then
      await expect(followProfile(userId, targetUsername)).rejects.toThrow('Você já segue este perfil');
    });
  });

  describe('unfollowProfile', () => {
    it('should unfollow profile successfully', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const existingFollow = {
        id: 'follow-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileFollow.findUnique.mockResolvedValue(existingFollow);
      prismaMock.profileFollow.delete.mockResolvedValue(existingFollow);

      // When
      const result = await unfollowProfile(userId, targetUsername);

      // Then
      expect(prismaMock.profileFollow.delete).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId,
            targetId: 'target-id'
          }
        }
      });
      expect(result).toEqual(existingFollow);
    });

    it('should throw error when not following yet', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileFollow.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(unfollowProfile(userId, targetUsername)).rejects.toThrow('Você ainda não segue este perfil');
    });
  });

  describe('toggleLikeProfile', () => {
    it('should add like when not liked yet', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const mockLike = {
        id: 'like-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileLike.findUnique.mockResolvedValue(null);
      prismaMock.profileLike.create.mockResolvedValue(mockLike);

      // When
      const result = await toggleLikeProfile(userId, targetUsername);

      // Then
      expect(prismaMock.profileLike.create).toHaveBeenCalledWith({
        data: {
          userId,
          targetId: 'target-id'
        }
      });
      expect(result).toEqual({ liked: true });
    });

    it('should remove like when already liked', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const existingLike = {
        id: 'like-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileLike.findUnique.mockResolvedValue(existingLike);
      prismaMock.profileLike.delete.mockResolvedValue(existingLike);

      // When
      const result = await toggleLikeProfile(userId, targetUsername);

      // Then
      expect(prismaMock.profileLike.delete).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId,
            targetId: 'target-id'
          }
        }
      });
      expect(result).toEqual({ liked: false });
    });

    it('should throw error when trying to like own profile', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: userId, // Same as userId
        username: targetUsername,
        name: 'Target User'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);

      // When & Then
      await expect(toggleLikeProfile(userId, targetUsername)).rejects.toThrow('Não é possível curtir seu próprio perfil');
    });
  });

  describe('toggleFollowProfile', () => {
    it('should add follow when not following yet', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const mockFollow = {
        id: 'follow-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileFollow.findUnique.mockResolvedValue(null);
      prismaMock.profileFollow.create.mockResolvedValue(mockFollow);

      // When
      const result = await toggleFollowProfile(userId, targetUsername);

      // Then
      expect(prismaMock.profileFollow.create).toHaveBeenCalledWith({
        data: {
          userId,
          targetId: 'target-id'
        }
      });
      expect(result).toEqual({ followed: true });
    });

    it('should remove follow when already following', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: 'target-id',
        username: targetUsername,
        name: 'Target User'
      };
      const existingFollow = {
        id: 'follow-id',
        userId,
        targetId: 'target-id'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);
      prismaMock.profileFollow.findUnique.mockResolvedValue(existingFollow);
      prismaMock.profileFollow.delete.mockResolvedValue(existingFollow);

      // When
      const result = await toggleFollowProfile(userId, targetUsername);

      // Then
      expect(prismaMock.profileFollow.delete).toHaveBeenCalledWith({
        where: {
          userId_targetId: {
            userId,
            targetId: 'target-id'
          }
        }
      });
      expect(result).toEqual({ followed: false });
    });

    it('should throw error when trying to follow own profile', async () => {
      // Given
      const userId = 'user-id';
      const targetUsername = 'target-user';
      const mockTarget = {
        id: userId, // Same as userId
        username: targetUsername,
        name: 'Target User'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockTarget);

      // When & Then
      await expect(toggleFollowProfile(userId, targetUsername)).rejects.toThrow('Não é possível seguir seu próprio perfil');
    });
  });
});