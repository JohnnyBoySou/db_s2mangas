import { prismaMock } from '../../../test/mocks/prisma';
import { Request, Response } from 'express';
import * as profileController from '../index';
import * as profileHandler from '@/handlers/profile';

// Mock do handler
jest.mock('@/handlers/profile');

const mockedProfileHandler = profileHandler as jest.Mocked<typeof profileHandler>;

// Mock das funções Request e Response
const mockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 'user-123' },
  ...overrides,
}) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Profile Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    const mockProfileData = {
      id: 'profile-123',
      name: 'Test User',
      username: 'testuser',
      avatar: 'avatar.jpg',
      bio: 'Test bio',
      cover: 'cover.jpg',
      createdAt: new Date(),
      collections: [],
      _count: {
        libraryEntries: 10,
        likes: 5,
        comments: 3,
        followers: 15,
        following: 8
      },
      isFollowing: false,
      isLiked: false
    };

    it('deve retornar dados do perfil com sucesso', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'testuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.getProfileData.mockResolvedValue(mockProfileData);

      // When
      await profileController.getProfile(req, res, jest.fn());

      // Then
      expect(mockedProfileHandler.getProfileData).toHaveBeenCalledWith('testuser', 'user-123');
      expect(res.json).toHaveBeenCalledWith(mockProfileData);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando usuário não estiver autenticado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'testuser' },
        user: undefined
      });
      const res = mockResponse();

      // When
      await profileController.getProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
      expect(mockedProfileHandler.getProfileData).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando username não for fornecido', async () => {
      // Given
      const req = mockRequest({
        params: {},
        user: { id: 'user-123' }
      });
      const res = mockResponse();

      // When
      await profileController.getProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username é obrigatório' });
      expect(mockedProfileHandler.getProfileData).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando perfil não for encontrado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'nonexistent' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.getProfileData.mockRejectedValue(new Error('Perfil não encontrado'));

      // When
      await profileController.getProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Perfil não encontrado' });
    });

    it('deve retornar erro 500 para outros erros', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'testuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.getProfileData.mockRejectedValue(new Error('Erro interno'));

      // When
      await profileController.getProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno' });
    });
  });

  describe('likeProfile', () => {
    const mockLike = {
      id: 'like-123',
      userId: 'user-123',
      targetId: 'target-123',
      createdAt: new Date()
    };

    it('deve curtir perfil com sucesso', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.likeProfile.mockResolvedValue(mockLike);

      // When
      await profileController.likeProfile(req, res, jest.fn());

      // Then
      expect(mockedProfileHandler.likeProfile).toHaveBeenCalledWith('user-123', 'targetuser');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockLike);
    });

    it('deve retornar erro 401 quando usuário não estiver autenticado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: undefined
      });
      const res = mockResponse();

      // When
      await profileController.likeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
      expect(mockedProfileHandler.likeProfile).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando perfil não for encontrado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'nonexistent' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.likeProfile.mockRejectedValue(new Error('Perfil não encontrado'));

      // When
      await profileController.likeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Perfil não encontrado' });
    });

    it('deve retornar erro 400 para outros erros', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.likeProfile.mockRejectedValue(new Error('Você já curtiu este perfil'));

      // When
      await profileController.likeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Você já curtiu este perfil' });
    });
  });

  describe('unlikeProfile', () => {
    it('deve descurtir perfil com sucesso', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.unlikeProfile.mockResolvedValue({
        id: 'like-123',
        userId: 'user-123',
        targetId: 'target-123',
        createdAt: new Date()
      });

      // When
      await profileController.unlikeProfile(req, res, jest.fn());

      // Then
      expect(mockedProfileHandler.unlikeProfile).toHaveBeenCalledWith('user-123', 'targetuser');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando usuário não estiver autenticado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: undefined
      });
      const res = mockResponse();

      // When
      await profileController.unlikeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
      expect(mockedProfileHandler.unlikeProfile).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando perfil não for encontrado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'nonexistent' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.unlikeProfile.mockRejectedValue(new Error('Perfil não encontrado'));

      // When
      await profileController.unlikeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Perfil não encontrado' });
    });

    it('deve retornar erro 400 para outros erros', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.unlikeProfile.mockRejectedValue(new Error('Você ainda não curtiu este perfil'));

      // When
      await profileController.unlikeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Você ainda não curtiu este perfil' });
    });
  });

  describe('toggleFollowProfile', () => {
    it('deve alternar seguir perfil com sucesso', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      const mockResult = { followed: true };
      
      mockedProfileHandler.toggleFollowProfile.mockResolvedValue(mockResult);

      // When
      await profileController.toggleFollowProfile(req, res, jest.fn());

      // Then
      expect(mockedProfileHandler.toggleFollowProfile).toHaveBeenCalledWith('user-123', 'targetuser');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve lançar erro quando usuário não estiver autenticado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: undefined
      });
      const res = mockResponse();

      // When
      await profileController.toggleFollowProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
    });

    it('deve retornar erro 404 quando perfil não for encontrado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'nonexistent' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.toggleFollowProfile.mockRejectedValue(new Error('Perfil não encontrado'));

      // When
      await profileController.toggleFollowProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Perfil não encontrado' });
    });

    it('deve retornar erro 400 para outros erros', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.toggleFollowProfile.mockRejectedValue(new Error('Não é possível seguir seu próprio perfil'));

      // When
      await profileController.toggleFollowProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Não é possível seguir seu próprio perfil' });
    });
  });

  describe('toggleLikeProfile', () => {
    it('deve alternar curtir perfil com sucesso', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      const mockResult = { liked: true };
      
      mockedProfileHandler.toggleLikeProfile.mockResolvedValue(mockResult);

      // When
      await profileController.toggleLikeProfile(req, res, jest.fn());

      // Then
      expect(mockedProfileHandler.toggleLikeProfile).toHaveBeenCalledWith('user-123', 'targetuser');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve lançar erro quando usuário não estiver autenticado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: undefined
      });
      const res = mockResponse();

      // When
      await profileController.toggleLikeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
    });

    it('deve lançar erro quando username não for fornecido', async () => {
      // Given
      const req = mockRequest({
        params: {},
        user: { id: 'user-123' }
      });
      const res = mockResponse();

      // When
      await profileController.toggleLikeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
    });

    it('deve retornar erro 404 quando perfil não for encontrado', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'nonexistent' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.toggleLikeProfile.mockRejectedValue(new Error('Perfil não encontrado'));

      // When
      await profileController.toggleLikeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Perfil não encontrado' });
    });

    it('deve retornar erro 400 para outros erros', async () => {
      // Given
      const req = mockRequest({
        params: { username: 'targetuser' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();
      
      mockedProfileHandler.toggleLikeProfile.mockRejectedValue(new Error('Não é possível curtir seu próprio perfil'));

      // When
      await profileController.toggleLikeProfile(req, res, jest.fn());

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Não é possível curtir seu próprio perfil' });
    });
  });
});