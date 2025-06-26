import request from 'supertest';
import express from 'express';
import * as analyticsController from '../index';
import * as analyticsHandlers from '../../../handlers/analytics';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('@/handlers/analytics');
jest.mock('@/utils/zodError');

// Mock do prisma global
(global as any).prisma = {
  $connect: jest.fn(),
  $disconnect: jest.fn()
} as any;

const mockedAnalyticsHandlers = analyticsHandlers as jest.Mocked<typeof analyticsHandlers>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Rotas para teste
app.get('/ping', analyticsController.ping);
app.get('/analytics/general', analyticsController.getGeneralStats);
app.get('/analytics/views', analyticsController.getViewsByPeriod);
app.get('/analytics/most-viewed', analyticsController.getMostViewedMangas);
app.get('/analytics/most-liked', analyticsController.getMostLikedMangas);
app.get('/analytics/most-commented', analyticsController.getMostCommentedMangas);
app.get('/analytics/users', analyticsController.getUsersByPeriod);
app.get('/analytics/active-users', analyticsController.getMostActiveUsers);
app.get('/analytics/categories', analyticsController.getCategoryStats);
app.get('/analytics/languages', analyticsController.getLanguageStats);
app.get('/analytics/manga-types', analyticsController.getMangaTypeStats);
app.get('/analytics/manga-status', analyticsController.getMangaStatusStats);

describe('Controlador de Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /analytics/general - getGeneralStats', () => {
    const mockGeneralStats = {
      totalUsers: 100,
      totalMangas: 50,
      totalChapters: 500,
      totalViews: 1000,
      totalLikes: 200,
      totalComments: 150
    };

    it('deve retornar estatísticas gerais com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getGeneralStats.mockResolvedValue(mockGeneralStats);

      // When
      const response = await request(app)
        .get('/analytics/general');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGeneralStats);
      expect(mockedAnalyticsHandlers.getGeneralStats).toHaveBeenCalled();
    });

    it('deve retornar erro quando handler falha', async () => {
      // Given
      const error = new Error('Database error');
      mockedAnalyticsHandlers.getGeneralStats.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Internal server error' });
      });

      // When
      const response = await request(app)
        .get('/analytics/general');

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('GET /analytics/views - getViewsByPeriod', () => {
    const mockViewsData = [
      { date: '2024-01-01', views: 100 },
      { date: '2024-01-02', views: 150 }
    ];

    it('deve retornar visualizações por período com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getViewsByPeriod.mockResolvedValue(mockViewsData as any);

      // When
      const response = await request(app)
        .get('/analytics/views')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockViewsData);
      expect(mockedAnalyticsHandlers.getViewsByPeriod).toHaveBeenCalledWith({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });
    });

    it('deve retornar erro 400 quando datas não são fornecidas', async () => {
      // When
      const response = await request(app)
        .get('/analytics/views');

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Data inicial e final são obrigatórias'
      });
    });

    it('deve retornar erro 400 quando apenas startDate é fornecida', async () => {
      // When
      const response = await request(app)
        .get('/analytics/views')
        .query({ startDate: '2024-01-01' });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Data inicial e final são obrigatórias'
      });
    });
  });

  describe('GET /analytics/most-viewed - getMostViewedMangas', () => {
    const mockMostViewedMangas = [
      { id: '1', title: 'Manga 1', views: 1000 },
      { id: '2', title: 'Manga 2', views: 800 }
    ];

    it('deve retornar mangás mais visualizados com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getMostViewedMangas.mockResolvedValue(mockMostViewedMangas as any);

      // When
      const response = await request(app)
        .get('/analytics/most-viewed');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMostViewedMangas);
      expect(mockedAnalyticsHandlers.getMostViewedMangas).toHaveBeenCalledWith(10);
    });

    it('deve retornar mangás mais visualizados com limite customizado', async () => {
      // Given
      mockedAnalyticsHandlers.getMostViewedMangas.mockResolvedValue(mockMostViewedMangas as any);

      // When
      const response = await request(app)
        .get('/analytics/most-viewed')
        .query({ limit: '5' });

      // Then
      expect(response.status).toBe(200);
      expect(mockedAnalyticsHandlers.getMostViewedMangas).toHaveBeenCalledWith(5);
    });
  });

  describe('GET /analytics/most-liked - getMostLikedMangas', () => {
    const mockMostLikedMangas = [
      { id: '1', title: 'Manga 1', likes: 500 },
      { id: '2', title: 'Manga 2', likes: 400 }
    ];

    it('deve retornar mangás mais curtidos com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getMostLikedMangas.mockResolvedValue(mockMostLikedMangas as any);

      // When
      const response = await request(app)
        .get('/analytics/most-liked');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMostLikedMangas);
      expect(mockedAnalyticsHandlers.getMostLikedMangas).toHaveBeenCalledWith(10);
    });
  });

  describe('GET /analytics/most-commented - getMostCommentedMangas', () => {
    const mockMostCommentedMangas = [
      { id: '1', title: 'Manga 1', comments: 300 },
      { id: '2', title: 'Manga 2', comments: 250 }
    ];

    it('deve retornar mangás mais comentados com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getMostCommentedMangas.mockResolvedValue(mockMostCommentedMangas as any);

      // When
      const response = await request(app)
        .get('/analytics/most-commented');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMostCommentedMangas);
      expect(mockedAnalyticsHandlers.getMostCommentedMangas).toHaveBeenCalledWith(10);
    });
  });

  describe('GET /analytics/users - getUsersByPeriod', () => {
    const mockUsersData = [
      { date: '2024-01-01', users: 10 },
      { date: '2024-01-02', users: 15 }
    ];

    it('deve retornar usuários por período com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getUsersByPeriod.mockResolvedValue(mockUsersData as any);

      // When
      const response = await request(app)
        .get('/analytics/users')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsersData);
      expect(mockedAnalyticsHandlers.getUsersByPeriod).toHaveBeenCalledWith({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });
    });

    it('deve retornar erro 400 quando datas não são fornecidas', async () => {
      // When
      const response = await request(app)
        .get('/analytics/users');

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Data inicial e final são obrigatórias'
      });
    });
  });

  describe('GET /analytics/active-users - getMostActiveUsers', () => {
    const mockActiveUsers = [
      { id: '1', name: 'User 1', activity: 100 },
      { id: '2', name: 'User 2', activity: 80 }
    ];

    it('deve retornar usuários mais ativos com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getMostActiveUsers.mockResolvedValue(mockActiveUsers as any);

      // When
      const response = await request(app)
        .get('/analytics/active-users');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActiveUsers);
      expect(mockedAnalyticsHandlers.getMostActiveUsers).toHaveBeenCalledWith(10);
    });
  });

  describe('GET /analytics/categories - getCategoryStats', () => {
    const mockCategoryStats = [
      { category: 'Action', count: 50 },
      { category: 'Romance', count: 30 }
    ];

    it('deve retornar estatísticas de categorias com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getCategoryStats.mockResolvedValue(mockCategoryStats as any);

      // When
      const response = await request(app)
        .get('/analytics/categories');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategoryStats);
      expect(mockedAnalyticsHandlers.getCategoryStats).toHaveBeenCalled();
    });
  });

  describe('GET /analytics/languages - getLanguageStats', () => {
    const mockLanguageStats = [
      { language: 'pt-BR', count: 80 },
      { language: 'en-US', count: 20 }
    ];

    it('deve retornar estatísticas de idiomas com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getLanguageStats.mockResolvedValue(mockLanguageStats as any);

      // When
      const response = await request(app)
        .get('/analytics/languages');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLanguageStats);
      expect(mockedAnalyticsHandlers.getLanguageStats).toHaveBeenCalled();
    });
  });

  describe('GET /analytics/manga-types - getMangaTypeStats', () => {
    const mockMangaTypeStats = [
      { type: 'manga', count: 60 },
      { type: 'manhwa', count: 40 }
    ];

    it('deve retornar estatísticas de tipos de manga com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getMangaTypeStats.mockResolvedValue(mockMangaTypeStats as any);

      // When
      const response = await request(app)
        .get('/analytics/manga-types');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMangaTypeStats);
      expect(mockedAnalyticsHandlers.getMangaTypeStats).toHaveBeenCalled();
    });
  });

  describe('GET /analytics/manga-status - getMangaStatusStats', () => {
    const mockMangaStatusStats = [
      { status: 'ongoing', count: 70 },
      { status: 'completed', count: 30 }
    ];

    it('deve retornar estatísticas de status de manga com sucesso', async () => {
      // Given
      mockedAnalyticsHandlers.getMangaStatusStats.mockResolvedValue(mockMangaStatusStats as any);

      // When
      const response = await request(app)
        .get('/analytics/manga-status');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMangaStatusStats);
      expect(mockedAnalyticsHandlers.getMangaStatusStats).toHaveBeenCalled();
    });
  });
});