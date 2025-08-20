import { Request, Response } from 'express';
import * as profileController from '../controllers/ProfileController';
import * as profileHandler from '../handlers/ProfileHandler';
import { z } from 'zod';

// Mock do profileHandler
jest.mock('../handlers/ProfileHandler');
const mockedProfileHandler = profileHandler as jest.Mocked<typeof profileHandler>;

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

describe('Profile Controller', () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        
        mockResponse = {
            json: mockJson,
            status: mockStatus
        };

        mockRequest = {
            params: {},
            query: {},
            user: { id: 'user-id' }
        };

        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should get profile successfully', async () => {
            // Given
            const mockProfile = {
                id: 'profile-id',
                name: 'Test User',
                username: 'testuser',
                avatar: 'avatar.jpg',
                bio: 'Test bio',
                cover: null,
                createdAt: new Date(),
                isFollowing: false,
                isLiked: false,
                _count: {
                    likes: 0,
                    comments: 0,
                    libraryEntries: 0,
                    following: 0,
                    followers: 0
                },
                collections: []
            };

            mockRequest.params = { username: 'testuser' };
            mockedProfileHandler.getProfileData.mockResolvedValue(mockProfile);

            // When
            await profileController.getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockedProfileHandler.getProfileData).toHaveBeenCalledWith('testuser', 'user-id');
            expect(mockResponse.json).toHaveBeenCalledWith(mockProfile);
        });

        it('should return 401 when user not authenticated', async () => {
            // Given
            mockRequest.user = undefined;
            mockRequest.params = { username: 'testuser' };

            // When
            await profileController.getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
        });

        it('should return 400 when username is missing', async () => {
            // Given
            mockRequest.params = {};

            // When
            await profileController.getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Username é obrigatório' });
        });

        it('should return 404 when profile not found', async () => {
            // Given
            mockRequest.params = { username: 'nonexistent' };
            mockedProfileHandler.getProfileData.mockRejectedValue(new Error('Perfil não encontrado'));

            // When
            await profileController.getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Perfil não encontrado' });
        });

        it('should return 500 for other errors', async () => {
            // Given
            mockRequest.params = { username: 'testuser' };
            mockedProfileHandler.getProfileData.mockRejectedValue(new Error('Database error'));

            // When
            await profileController.getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('likeProfile', () => {
        it('should like profile successfully', async () => {
            // Given
            const mockLike = { id: 'like-id', userId: 'user-id', targetId: 'target-id', createdAt: new Date() };
            mockRequest.params = { username: 'testuser' };
            mockedProfileHandler.likeProfile.mockResolvedValue(mockLike);

            // When
            await profileController.likeProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockedProfileHandler.likeProfile).toHaveBeenCalledWith('user-id', 'testuser');
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(mockLike);
        });

        it('should return 401 when user not authenticated', async () => {
            // Given
            mockRequest.user = undefined;
            mockRequest.params = { username: 'testuser' };

            // When
            await profileController.likeProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
        });

        it('should return 404 when profile not found', async () => {
            // Given
            mockRequest.params = { username: 'nonexistent' };
            mockedProfileHandler.likeProfile.mockRejectedValue(new Error('Perfil não encontrado'));

            // When
            await profileController.likeProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Perfil não encontrado' });
        });

        it('should return 400 for other errors', async () => {
            // Given
            mockRequest.params = { username: 'testuser' };
            mockedProfileHandler.likeProfile.mockRejectedValue(new Error('Você já curtiu este perfil'));

            // When
            await profileController.likeProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Você já curtiu este perfil' });
        });
    });

    describe('searchProfiles', () => {
        it('should search profiles successfully', async () => {
            // Given
            const mockResult = {
                profiles: [{
                    id: 'profile-1',
                    username: 'user1',
                    name: 'User One',
                    createdAt: new Date(),
                    avatar: null,
                    bio: null,
                    _count: {
                        likes: 0,
                        collections: 0,
                        libraryEntries: 0,
                        following: 0,
                        followers: 0,
                        profileLikedBy: 0
                    }
                }],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1
            };

            mockRequest.query = { q: 'test', page: '1', limit: '10' };
            mockedProfileHandler.searchProfiles.mockResolvedValue(mockResult);

            // When
            await profileController.searchProfiles(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockedProfileHandler.searchProfiles).toHaveBeenCalledWith({
                query: 'test',
                page: 1,
                limit: 10,
                authenticatedUserId: 'user-id'
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
        });

        it('should return 400 for invalid query parameters', async () => {
            // Given
            mockRequest.query = { q: '' }; // Empty query

            // When
            await profileController.searchProfiles(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: 'Dados inválidos',
                details: expect.any(Array)
            });
        });

        it('should return 500 for handler errors', async () => {
            // Given
            mockRequest.query = { q: 'test' };
            mockedProfileHandler.searchProfiles.mockRejectedValue(new Error('Database error'));

            // When
            await profileController.searchProfiles(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('listProfiles', () => {
        it('should list profiles successfully', async () => {
            // Given
            const mockResult = {
                profiles: [{
                    id: 'profile-1',
                    username: 'user1',
                    name: 'User One',
                    createdAt: new Date(),
                    avatar: null,
                    bio: null,
                    _count: {
                        likes: 0,
                        collections: 0,
                        libraryEntries: 0,
                        following: 0,
                        followers: 0,
                        profileLikedBy: 0
                    }
                }],
                total: 1,
                totalPages: 1,
                currentPage: 1
            };

            mockRequest.query = { page: '1', limit: '10' };
            mockedProfileHandler.listProfiles.mockResolvedValue(mockResult);

            // When
            await profileController.listProfiles(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockedProfileHandler.listProfiles).toHaveBeenCalledWith(1, 10);
            expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
        });

        it('should handle default pagination values', async () => {
            // Given
            const mockResult = {
                profiles: [],
                total: 0,
                totalPages: 0,
                currentPage: 1
            };

            mockRequest.query = {};
            mockedProfileHandler.listProfiles.mockResolvedValue(mockResult);

            // When
            await profileController.listProfiles(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockedProfileHandler.listProfiles).toHaveBeenCalledWith(1, 10);
            expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
        });
    });

    describe('toggleFollowProfile', () => {
        it('should toggle follow profile successfully', async () => {
            // Given
            const mockResult = { followed: true };
            mockRequest.params = { username: 'testuser' };
            mockedProfileHandler.toggleFollowProfile.mockResolvedValue(mockResult);

            // When
            await profileController.toggleFollowProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockedProfileHandler.toggleFollowProfile).toHaveBeenCalledWith('user-id', 'testuser');
            expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
        });

        it('should return 400 when user not authenticated', async () => {
            // Given
            mockRequest.user = undefined;
            mockRequest.params = { username: 'testuser' };

            // When
            await profileController.toggleFollowProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
        });
    });

    describe('toggleLikeProfile', () => {
        it('should toggle like profile successfully', async () => {
            // Given
            const mockResult = { liked: true };
            mockRequest.params = { username: 'testuser' };
            mockedProfileHandler.toggleLikeProfile.mockResolvedValue(mockResult);

            // When
            await profileController.toggleLikeProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockedProfileHandler.toggleLikeProfile).toHaveBeenCalledWith('user-id', 'testuser');
            expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
        });

        it('should return 400 when user not authenticated', async () => {
            // Given
            mockRequest.user = undefined;
            mockRequest.params = { username: 'testuser' };

            // When
            await profileController.toggleLikeProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, jest.fn());

            // Then
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
        });
    });
});