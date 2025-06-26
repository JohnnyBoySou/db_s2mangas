import request from 'supertest';
import express from 'express';
import * as reviewController from '../index';
import * as reviewHandlers from '../../../handlers/review';
import { handleZodError } from '../../../utils/zodError';
import { getPaginationParams } from '../../../utils/pagination';

// Mock das dependências
jest.mock('@/handlers/review');
jest.mock('@/utils/zodError');
jest.mock('@/utils/pagination');

const mockedReviewHandlers = reviewHandlers as jest.Mocked<typeof reviewHandlers>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;
const mockedGetPaginationParams = getPaginationParams as jest.MockedFunction<typeof getPaginationParams>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Middleware para simular usuário autenticado
app.use((req, res, next) => {
  (req as any).user = { id: 'user-123' };
  next();
});

// Rotas para teste
app.post('/reviews', reviewController.createReview);
app.put('/reviews/:reviewId', reviewController.updateReview);
app.delete('/reviews/:reviewId', reviewController.deleteReview);
app.get('/manga/:mangaId/reviews', reviewController.getMangaReviews);
app.get('/manga/:mangaId/my-review', reviewController.getUserReview);
app.post('/reviews/:reviewId/upvote', reviewController.toggleUpvote);
app.post('/reviews/:reviewId/downvote', reviewController.toggleDownvote);
app.get('/reviews/:reviewId', reviewController.getReview);

describe('Review Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const mockReviewData = {
      mangaId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Excelente mangá',
      rating: 9,
      content: 'Uma história incrível com personagens bem desenvolvidos.',
      art: 8,
      story: 9,
      characters: 10,
      worldbuilding: 8,
      pacing: 7,
      emotion: 9,
      originality: 8,
      dialogues: 9
    };

    const mockCreatedReview = {
      id: 'review-123',
      userId: 'user-123',
      ...mockReviewData,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-123',
        name: 'João Silva',
        username: 'joao123',
        avatar: 'avatar.jpg'
      }
    };

    it('deve criar uma review com sucesso', async () => {
      mockedReviewHandlers.createReview.mockResolvedValue(mockCreatedReview);

      const response = await request(app)
        .post('/reviews')
        .send(mockReviewData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: 'review-123',
        title: 'Excelente mangá',
        rating: 9,
        content: 'Uma história incrível com personagens bem desenvolvidos.'
      });
      expect(mockedReviewHandlers.createReview).toHaveBeenCalledWith({
        ...mockReviewData,
        userId: 'user-123'
      });
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        mangaId: 'invalid-uuid',
        rating: 11, // rating inválido
        content: ''
      };

      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ message: 'Dados inválidos' });
      });

      await request(app)
        .post('/reviews')
        .send(invalidData)
        .expect(400);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });

    it('deve lidar com erro do handler', async () => {
      mockedReviewHandlers.createReview.mockRejectedValue(new Error('Você já fez uma review para este manga'));
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(409).json({ message: 'Você já fez uma review para este manga' });
      });

      await request(app)
        .post('/reviews')
        .send(mockReviewData)
        .expect(409);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('updateReview', () => {
    const mockUpdateData = {
      title: 'Título atualizado',
      rating: 8,
      content: 'Conteúdo atualizado'
    };

    const mockUpdatedReview = {
      id: 'review-123',
      userId: 'user-123',
      mangaId: '123e4567-e89b-12d3-a456-426614174000',
      ...mockUpdateData,
      art: 8,
      story: 9,
      characters: 10,
      worldbuilding: 8,
      pacing: 7,
      emotion: 9,
      originality: 8,
      dialogues: 9,
      upvotes: 5,
      downvotes: 1,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-123',
        name: 'João Silva',
        username: 'joao123',
        avatar: 'avatar.jpg'
      }
    };

    it('deve atualizar uma review com sucesso', async () => {
      mockedReviewHandlers.updateReview.mockResolvedValue(mockUpdatedReview);

      const response = await request(app)
        .put('/reviews/review-123')
        .send(mockUpdateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'review-123',
        title: 'Título atualizado',
        rating: 8,
        content: 'Conteúdo atualizado'
      });
      expect(mockedReviewHandlers.updateReview).toHaveBeenCalledWith('review-123', mockUpdateData);
    });

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        rating: 15 // rating inválido
      };

      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ message: 'Dados inválidos' });
      });

      await request(app)
        .put('/reviews/review-123')
        .send(invalidData)
        .expect(400);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    it('deve deletar uma review com sucesso', async () => {
      mockedReviewHandlers.deleteReview.mockResolvedValue(undefined);

      await request(app)
        .delete('/reviews/review-123')
        .expect(204);

      expect(mockedReviewHandlers.deleteReview).toHaveBeenCalledWith('review-123');
    });

    it('deve lidar com erro do handler', async () => {
      mockedReviewHandlers.deleteReview.mockRejectedValue(new Error('Review não encontrada'));
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(404).json({ message: 'Review não encontrada' });
      });

      await request(app)
        .delete('/reviews/review-123')
        .expect(404);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('getMangaReviews', () => {
    const mockReviews = {
      data: [
        {
          id: 'review-1',
          userId: 'user-1',
          mangaId: 'manga-1',
          title: 'Ótimo mangá',
          rating: 9,
          content: 'Excelente história',
          art: 9,
          story: 9,
          characters: 9,
          worldbuilding: 9,
          pacing: 9,
          emotion: 9,
          originality: 9,
          dialogues: 9,
          upvotes: 10,
          downvotes: 1,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-01T00:00:00.000Z'),
          user: {
            id: 'user-1',
            name: 'João',
            username: 'joao123',
            avatar: 'avatar.jpg'
          }
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        next: null,
        prev: null
      }
    };

    it('deve retornar reviews de um mangá com paginação', async () => {
      mockedGetPaginationParams.mockReturnValue({ page: 1, take: 10, skip: 0 });
      mockedReviewHandlers.getMangaReviews.mockResolvedValue(mockReviews);

      const response = await request(app)
        .get('/manga/manga-123/reviews')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            rating: expect.any(Number),
            content: expect.any(String),
            upvotes: expect.any(Number),
            downvotes: expect.any(Number),
            user: expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              username: expect.any(String)
            })
          })
        ]),
        pagination: expect.objectContaining({
          total: expect.any(Number),
          page: expect.any(Number),
          totalPages: expect.any(Number)
        })
      });
      expect(mockedReviewHandlers.getMangaReviews).toHaveBeenCalledWith('manga-123', 1, 10);
    });

    it('deve lidar com erro do handler', async () => {
      mockedGetPaginationParams.mockReturnValue({ page: 1, take: 10, skip: 0 });
      mockedReviewHandlers.getMangaReviews.mockRejectedValue(new Error('Erro interno'));
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(500).json({ message: 'Erro interno' });
      });

      await request(app)
        .get('/manga/manga-123/reviews')
        .expect(500);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('getUserReview', () => {
    const mockUserReview = {
      id: 'review-123',
      title: 'Minha review',
      rating: 8,
      content: 'Boa história',
      userId: 'user-123',
      mangaId: 'manga-123',
      art: 8,
      story: 8,
      characters: 8,
      worldbuilding: 8,
      pacing: 8,
      emotion: 8,
      originality: 8,
      dialogues: 8,
      upvotes: 5,
      downvotes: 1,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-123',
        name: 'João Silva',
        username: 'joao123',
        avatar: 'avatar.jpg'
      }
    };

    it('deve retornar a review do usuário para um mangá', async () => {
      mockedReviewHandlers.getUserReview.mockResolvedValue(mockUserReview);

      const response = await request(app)
        .get('/manga/manga-123/my-review')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockUserReview.id,
        title: mockUserReview.title,
        rating: mockUserReview.rating,
        content: mockUserReview.content,
        upvotes: mockUserReview.upvotes,
        downvotes: mockUserReview.downvotes,
        user: mockUserReview.user
      });
      expect(mockedReviewHandlers.getUserReview).toHaveBeenCalledWith('user-123', 'manga-123');
    });

    it('deve retornar 404 quando review não encontrada', async () => {
      mockedReviewHandlers.getUserReview.mockResolvedValue(null);

      const response = await request(app)
        .get('/manga/manga-123/my-review')
        .expect(404);

      expect(response.body).toEqual({ message: 'Review não encontrada' });
    });
  });

  describe('toggleUpvote', () => {
    const mockReviewWithVote = {
      id: 'review-123',
      userId: 'user-456',
      mangaId: 'manga-123',
      title: 'Review com upvote',
      rating: 9,
      content: 'Conteúdo da review',
      art: 9,
      story: 9,
      characters: 9,
      worldbuilding: 9,
      pacing: 9,
      emotion: 9,
      originality: 9,
      dialogues: 9,
      upvotes: 1,
      downvotes: 0,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-456',
        name: 'Maria',
        username: 'maria123',
        avatar: 'avatar2.jpg'
      }
    };

    it('deve fazer toggle do upvote com sucesso', async () => {
      mockedReviewHandlers.toggleUpvote.mockResolvedValue(mockReviewWithVote);

      const response = await request(app)
        .post('/reviews/review-123/upvote')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockReviewWithVote.id,
        title: mockReviewWithVote.title,
        rating: mockReviewWithVote.rating,
        content: mockReviewWithVote.content,
        upvotes: mockReviewWithVote.upvotes,
        downvotes: mockReviewWithVote.downvotes,
        user: mockReviewWithVote.user
      });
      expect(mockedReviewHandlers.toggleUpvote).toHaveBeenCalledWith('user-123', 'review-123');
    });

    it('deve lidar com erro do handler', async () => {
      mockedReviewHandlers.toggleUpvote.mockRejectedValue(new Error('Review não encontrada'));
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(404).json({ message: 'Review não encontrada' });
      });

      await request(app)
        .post('/reviews/review-123/upvote')
        .expect(404);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('toggleDownvote', () => {
    const mockReviewWithDownvote = {
      id: 'review-123',
      userId: 'user-456',
      mangaId: 'manga-123',
      title: 'Review com downvote',
      rating: 5,
      content: 'Conteúdo da review',
      art: 5,
      story: 5,
      characters: 5,
      worldbuilding: 5,
      pacing: 5,
      emotion: 5,
      originality: 5,
      dialogues: 5,
      upvotes: 0,
      downvotes: 1,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-456',
        name: 'Maria',
        username: 'maria123',
        avatar: 'avatar2.jpg'
      }
    };

    it('deve fazer toggle do downvote com sucesso', async () => {
      mockedReviewHandlers.toggleDownvote.mockResolvedValue(mockReviewWithDownvote);

      const response = await request(app)
        .post('/reviews/review-123/downvote')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockReviewWithDownvote.id,
        title: mockReviewWithDownvote.title,
        rating: mockReviewWithDownvote.rating,
        content: mockReviewWithDownvote.content,
        upvotes: mockReviewWithDownvote.upvotes,
        downvotes: mockReviewWithDownvote.downvotes,
        user: mockReviewWithDownvote.user
      });
      expect(mockedReviewHandlers.toggleDownvote).toHaveBeenCalledWith('user-123', 'review-123');
    });

    it('deve lidar com erro do handler', async () => {
      mockedReviewHandlers.toggleDownvote.mockRejectedValue(new Error('Review não encontrada'));
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(404).json({ message: 'Review não encontrada' });
      });

      await request(app)
        .post('/reviews/review-123/downvote')
        .expect(404);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('getReview', () => {
    const mockReview = {
      id: 'review-123',
      userId: 'user-456',
      mangaId: 'manga-123',
      title: 'Review detalhada',
      rating: 8,
      content: 'Análise completa do mangá',
      art: 8,
      story: 8,
      characters: 8,
      worldbuilding: 8,
      pacing: 8,
      emotion: 8,
      originality: 8,
      dialogues: 8,
      upvotes: 15,
      downvotes: 2,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      user: {
        id: 'user-456',
        name: 'Maria',
        username: 'maria123',
        avatar: 'avatar2.jpg'
      },
      votes: []
    };

    it('deve retornar uma review específica', async () => {
      mockedReviewHandlers.getReview.mockResolvedValue(mockReview);

      const response = await request(app)
        .get('/reviews/review-123')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockReview.id,
        title: mockReview.title,
        rating: mockReview.rating,
        content: mockReview.content,
        upvotes: mockReview.upvotes,
        downvotes: mockReview.downvotes,
        user: mockReview.user
      });
      expect(mockedReviewHandlers.getReview).toHaveBeenCalledWith('review-123');
    });

    it('deve retornar 404 quando review não encontrada', async () => {
      mockedReviewHandlers.getReview.mockResolvedValue(null as any);

      const response = await request(app)
        .get('/reviews/review-123')
        .expect(404);

      expect(response.body).toEqual({ message: 'Review não encontrada' });
    });

    it('deve lidar com erro do handler', async () => {
      mockedReviewHandlers.getReview.mockRejectedValue(new Error('Erro interno'));
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(500).json({ message: 'Erro interno' });
      });

      await request(app)
        .get('/reviews/review-123')
        .expect(500);

      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });
});