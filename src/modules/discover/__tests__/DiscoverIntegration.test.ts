import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { DiscoverRouter as discoverRouter } from '../routes/DiscoverRouter';
import { prismaMock } from '../../../test/mocks/prisma';

// Mock dos middlewares
jest.mock('@/middlewares/auth', () => ({
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user-123' };
    next();
  }),
}));

jest.mock('@/middlewares/smartCache', () => ({
  smartCacheMiddleware: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Define os tipos dos mocks
const mockMangaFindMany = prismaMock.manga.findMany as jest.MockedFunction<any>;
const mockMangaCount = prismaMock.manga.count as jest.MockedFunction<any>;
const mockUserFindUnique = prismaMock.user.findUnique as jest.MockedFunction<any>;

describe('Discover Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/discover', discoverRouter);
    jest.clearAllMocks();
  });

  const mockMangaData = {
    id: 'manga-123',
    manga_uuid: 'uuid-123',
    cover: 'cover.jpg',
    translations: [
      {
        language: 'pt',
        name: 'Manga Teste',
        description: 'Descrição do manga teste'
      }
    ],
    _count: { views: 100, likes: 50 }
  };

  describe('GET /discover/recents', () => {
    it('deve retornar mangás recentes com sucesso', async () => {
      mockMangaFindMany.mockResolvedValue([mockMangaData]);
      mockMangaCount.mockResolvedValue(1);

      const response = await request(app)
        .get('/discover/recents?lg=pt&page=1&take=10')
        .expect(200);

      expect(response.body).toEqual({
        data: [
          {
            id: 'manga-123',
            manga_uuid: 'uuid-123',
            title: 'Manga Teste',
            description: 'Descrição do manga teste',
            cover: 'cover.jpg',
            views_count: 100
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      });
    });

    it('deve usar idioma padrão quando não especificado', async () => {
      (mockPrisma.manga.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.manga.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/discover/recents')
        .expect(200);

      expect(mockPrisma.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            translations: {
              some: {
                language: 'en'
              }
            }
          }
        })
      );
    });

    it('deve retornar erro 400 para parâmetros inválidos', async () => {
      const response = await request(app)
        .get('/discover/recents?page=0')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /discover/views', () => {
    it('deve retornar mangás mais vistos ordenados corretamente', async () => {
      (mockPrisma.manga.findMany as jest.Mock).mockResolvedValue([mockMangaData]);
      (mockPrisma.manga.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/discover/views?lg=pt')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            views: {
              _count: 'desc'
            }
          }
        })
      );
    });
  });

  describe('GET /discover/likes', () => {
    it('deve retornar mangás mais curtidos ordenados corretamente', async () => {
      (mockPrisma.manga.findMany as jest.Mock).mockResolvedValue([mockMangaData]);
      (mockPrisma.manga.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/discover/likes?lg=pt')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            likes: {
              _count: 'desc'
            }
          }
        })
      );
    });
  });

  describe('GET /discover/feed', () => {
    it('deve retornar feed personalizado para usuário com categorias', async () => {
      const mockUser = {
        id: 'user-123',
        categories: [
          { id: 'cat-1', name: 'Ação' }
        ]
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.manga.findMany as jest.Mock).mockResolvedValue([mockMangaData]);
      (mockPrisma.manga.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/discover/feed?lg=pt')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { categories: true }
      });
    });

    it('deve retornar array vazio para usuário sem categorias', async () => {
      const mockUser = {
        id: 'user-123',
        categories: []
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/discover/feed')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('deve retornar erro 401 quando usuário não está autenticado', async () => {
      const { requireAuth } = require('@/middlewares/auth');
      requireAuth.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Não autenticado.' });
      });

      const response = await request(app)
        .get('/discover/feed')
        .expect(401);

      expect(response.body).toEqual({ error: 'Não autenticado.' });
    });
  });

  describe('GET /discover/ia', () => {
    it('deve retornar recomendações de IA baseadas no histórico do usuário', async () => {
      const mockUser = {
        id: 'user-123',
        categories: [{ id: 'cat-1', name: 'Ação' }],
        views: [
          {
            mangaId: 'viewed-manga',
            manga: {
              categories: [{ id: 'cat-2', name: 'Romance' }],
              translations: []
            }
          }
        ],
        likes: []
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.manga.findMany as jest.Mock).mockResolvedValue([mockMangaData]);
      (mockPrisma.manga.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/discover/ia?lg=pt')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(mockPrisma.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: {
              notIn: ['viewed-manga']
            }
          })
        })
      );
    });

    it('deve retornar array vazio para usuário sem preferências', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/discover/ia')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('Validação de entrada', () => {
    it('deve normalizar idiomas pt-br para pt', async () => {
      (mockPrisma.manga.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.manga.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/discover/recents?lg=pt-br')
        .expect(200);

      expect(mockPrisma.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            translations: {
              some: {
                language: 'pt'
              }
            }
          }
        })
      );
    });

    it('deve validar limites de paginação', async () => {
      const response = await request(app)
        .get('/discover/recents?take=101')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Limite máximo é 100');
    });

    it('deve validar página mínima', async () => {
      const response = await request(app)
        .get('/discover/recents?page=-1')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Cache middleware', () => {
    it('deve aplicar cache inteligente em todas as rotas', async () => {
      const { smartCacheMiddleware } = require('@/middlewares/smartCache');

      (mockPrisma.manga.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.manga.count as jest.Mock).mockResolvedValue(0);

      await request(app).get('/discover/recents');
      await request(app).get('/discover/views');
      await request(app).get('/discover/likes');

      expect(smartCacheMiddleware).toHaveBeenCalledTimes(3);
    });

    it('deve aplicar configuração específica de cache para feed', async () => {
      const { smartCacheMiddleware } = require('@/middlewares/smartCache');

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ categories: [] });

      await request(app).get('/discover/feed');

      expect(smartCacheMiddleware).toHaveBeenCalledWith('discover', {
        varyBy: ['userId', 'page', 'take', 'lg'],
        ttl: 300
      });
    });
  });

  describe('Error handling', () => {
    it('deve tratar erros do banco de dados', async () => {
      (mockPrisma.manga.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/discover/recents')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('deve tratar erros de validação Zod', async () => {
      const response = await request(app)
        .get('/discover/recents?lg=invalid-language')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Idioma não suportado');
    });
  });
}); 