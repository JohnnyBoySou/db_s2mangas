import { prismaMock } from '../../../test/mocks/prisma';
import * as profileHandler from '../handlers/ProfileHandler';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

// Mock das notificações
jest.mock('../../notifications/handlers/NotificationsHandler', () => ({
    createFollowNotification: jest.fn(),
}));

import { createFollowNotification } from '../../notifications/handlers/NotificationsHandler';
const mockedCreateFollowNotification = createFollowNotification as jest.MockedFunction<typeof createFollowNotification>;

describe('Profile Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProfileData', () => {
        const mockUser = {
            id: 'user-id-1',
            name: 'Test User',
            username: 'testuser',
            avatar: 'avatar-url',
            bio: 'Test bio',
            cover: 'cover-url',
            createdAt: new Date('2024-01-01'),
            collections: [
                {
                    id: 'collection-1',
                    name: 'My Collection',
                    cover: 'collection-cover',
                    description: 'Test collection',
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
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

        it('should return profile data with follow and like status', async () => {
            // Given
            const username = 'testuser';
            const authenticatedUserId = 'auth-user-id';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaMock.profileFollow.findUnique as jest.Mock).mockResolvedValue({ id: 'follow-id' });
            (prismaMock.profileLike.findUnique as jest.Mock).mockResolvedValue({ id: 'like-id' });

            // When
            const result = await profileHandler.getProfileData(username, authenticatedUserId);

            // Then
            expect(result).toEqual({
                ...mockUser,
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

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { username },
                select: expect.objectContaining({
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                    bio: true,
                    cover: true,
                    createdAt: true
                })
            });
        });

        it('should throw error when profile not found', async () => {
            // Given
            const username = 'nonexistent';
            const authenticatedUserId = 'auth-user-id';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(profileHandler.getProfileData(username, authenticatedUserId))
                .rejects.toThrow('Perfil não encontrado');
        });

        it('should return false for follow and like status when not following/liking', async () => {
            // Given
            const username = 'testuser';
            const authenticatedUserId = 'auth-user-id';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaMock.profileFollow.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaMock.profileLike.findUnique as jest.Mock).mockResolvedValue(null);

            // When
            const result = await profileHandler.getProfileData(username, authenticatedUserId);

            // Then
            expect(result.isFollowing).toBe(false);
            expect(result.isLiked).toBe(false);
        });
    });

    describe('likeProfile', () => {
        const mockTargetUser = {
            id: 'target-user-id',
            username: 'targetuser'
        };

        it('should like a profile successfully', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
            (prismaMock.profileLike.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaMock.profileLike.create as jest.Mock).mockResolvedValue({
                id: 'like-id',
                userId,
                targetId: mockTargetUser.id
            });

            // When
            const result = await profileHandler.likeProfile(userId, targetUsername);

            // Then
            expect(result).toEqual({
                id: 'like-id',
                userId: 'user-id',
                targetId: 'target-user-id'
            });

            expect(prismaMock.profileLike.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    targetId: mockTargetUser.id
                }
            });
        });

        it('should throw error when target user not found', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'nonexistent';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(profileHandler.likeProfile(userId, targetUsername))
                .rejects.toThrow('Perfil não encontrado');
        });

        it('should throw error when trying to like own profile', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';
            const mockUser = { id: userId, username: targetUsername };

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            // When & Then
            await expect(profileHandler.likeProfile(userId, targetUsername))
                .rejects.toThrow('Não é possível curtir seu próprio perfil');
        });

        it('should throw error when profile already liked', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
            (prismaMock.profileLike.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-like' });

            // When & Then
            await expect(profileHandler.likeProfile(userId, targetUsername))
                .rejects.toThrow('Você já curtiu este perfil');
        });
    });

    describe('unlikeProfile', () => {
        const mockTargetUser = {
            id: 'target-user-id',
            username: 'targetuser'
        };

        it('should unlike a profile successfully', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
            (prismaMock.profileLike.findUnique as jest.Mock).mockResolvedValue({ id: 'like-id' });
            (prismaMock.profileLike.delete as jest.Mock).mockResolvedValue({ id: 'like-id' });

            // When
            const result = await profileHandler.unlikeProfile(userId, targetUsername);

            // Then
            expect(result).toEqual({
                id: 'like-id'
            });

            expect(prismaMock.profileLike.delete).toHaveBeenCalledWith({
                where: {
                    userId_targetId: {
                        userId,
                        targetId: mockTargetUser.id
                    }
                }
            });
        });

        it('should throw error when profile not liked', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
            (prismaMock.profileLike.findUnique as jest.Mock).mockResolvedValue(null);

            // When & Then
            await expect(profileHandler.unlikeProfile(userId, targetUsername))
                .rejects.toThrow('Você ainda não curtiu este perfil');
        });
    });

    describe('followProfile', () => {
        const mockTargetUser = {
            id: 'target-user-id',
            username: 'targetuser'
        };

        it('should follow a profile successfully', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';
            const mockFollower = {
                id: userId,
                name: 'Test User',
                username: 'testuser'
            };

            (prismaMock.user.findUnique as jest.Mock)
                .mockResolvedValueOnce(mockTargetUser) // First call for target user
                .mockResolvedValueOnce(mockFollower);  // Second call for follower
            (prismaMock.profileFollow.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaMock.profileFollow.create as jest.Mock).mockResolvedValue({
                id: 'follow-id',
                userId,
                targetId: mockTargetUser.id
            });
            mockedCreateFollowNotification.mockResolvedValue({
                id: 'notification-id',
                message: 'Test notification',
                title: 'Test title',
                type: 'FOLLOW',
                data: {},
                cover: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // When
            const result = await profileHandler.followProfile(userId, targetUsername);

            // Then
            expect(result).toEqual({
                id: 'follow-id',
                userId: 'user-id',
                targetId: 'target-user-id'
            });

            expect(prismaMock.profileFollow.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    targetId: mockTargetUser.id
                }
            });

            expect(mockedCreateFollowNotification).toHaveBeenCalledWith(
                userId,
                mockTargetUser.id,
                mockFollower.name
            );
        });

        it('should throw error when trying to follow own profile', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';
            const mockUser = { id: userId, username: targetUsername };

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            // When & Then
            await expect(profileHandler.followProfile(userId, targetUsername))
                .rejects.toThrow('Não é possível seguir seu próprio perfil');
        });

        it('should throw error when already following', async () => {
            // Given
            const userId = 'user-id';
            const targetUsername = 'targetuser';

            (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
            (prismaMock.profileFollow.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-follow' });

            // When & Then
            await expect(profileHandler.followProfile(userId, targetUsername))
                .rejects.toThrow('Você já segue este perfil');
        });
    });

    describe('searchProfiles', () => {
        const mockProfiles = [
            {
                id: 'user-1',
                name: 'Test User 1',
                username: 'testuser1',
                avatar: 'avatar1.jpg',
                bio: 'Bio 1',
                _count: {
                    profileLikedBy: 5,
                    followers: 10
                }
            },
            {
                id: 'user-2',
                name: 'Test User 2',
                username: 'testuser2',
                avatar: 'avatar2.jpg',
                bio: 'Bio 2',
                _count: {
                    profileLikedBy: 3,
                    followers: 8
                }
            }
        ];

        it('should search profiles successfully', async () => {
            // Given
            const searchParams = {
                query: 'test',
                page: 1,
                limit: 10,
                authenticatedUserId: 'auth-user-id'
            };

            (prismaMock.user.findMany as jest.Mock).mockResolvedValue(mockProfiles);
            (prismaMock.user.count as jest.Mock).mockResolvedValue(2);
            (prismaMock.profileFollow.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.profileLike.findMany as jest.Mock).mockResolvedValue([]);

            // When
            const result = await profileHandler.searchProfiles(searchParams);

            // Then
            expect(result.profiles).toHaveLength(2);
            expect(result.page).toBe(1);
             expect(result.limit).toBe(10);
             expect(result.total).toBe(2);
             expect(result.totalPages).toBe(1);

            expect(prismaMock.user.findMany).toHaveBeenCalled();
             expect(prismaMock.user.count).toHaveBeenCalled();
        });

        it('should return empty results when no profiles found', async () => {
            // Given
            const searchParams = {
                query: 'nonexistent',
                page: 1,
                limit: 10
            };

            (prismaMock.user.findMany as jest.Mock).mockResolvedValue([]);
            (prismaMock.user.count as jest.Mock).mockResolvedValue(0);

            // When
            const result = await profileHandler.searchProfiles(searchParams);

            // Then
            expect(result.profiles).toHaveLength(0);
            expect(result.page).toBe(1);
             expect(result.limit).toBe(10);
             expect(result.total).toBe(0);
             expect(result.totalPages).toBe(0);
        });
    });

    describe('listProfiles', () => {
        it('should list profiles with pagination', async () => {
            // Given
            const mockProfiles = [
                {
                    id: 'user-1',
                    name: 'User 1',
                    username: 'user1',
                    avatar: 'avatar1.jpg',
                    _count: { profileLikedBy: 5, followers: 10 }
                }
            ];

            (prismaMock.user.findMany as jest.Mock).mockResolvedValue(mockProfiles);
            (prismaMock.user.count as jest.Mock).mockResolvedValue(1);

            // When
            const result = await profileHandler.listProfiles(1, 10);

            // Then
            expect(result.profiles).toHaveLength(1);
            expect(result.total).toBe(1);
             expect(result.totalPages).toBe(1);
             expect(result.currentPage).toBe(1);

            expect(prismaMock.user.findMany).toHaveBeenCalled();
             expect(prismaMock.user.count).toHaveBeenCalled();
        });
    });
});