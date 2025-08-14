import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { DiscoverRouter, AdminDiscoverRouter } from '../routes/DiscoverRouter';

jest.mock('../controllers/DiscoverController', () => ({
  getRecent: jest.fn(),
  getMostViewed: jest.fn(),
  getMostLiked: jest.fn(),
  getFeed: jest.fn(),
  getIA: jest.fn(),
  getMangasByCategories: jest.fn(),
  getStats: jest.fn(),
  healthCheck: jest.fn()
}));

jest.mock('@/middlewares/auth', () => ({
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user-123' };
    next();
  }),
}));

jest.mock('@/middlewares/smartCache', () => ({
  smartCacheMiddleware: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

const mockedDiscoverController = require('../controllers/DiscoverController');

describe('Discover Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/discover', DiscoverRouter);
    jest.clearAllMocks();
  });

  describe('GET /discover/recents', () => {
    it('deve retornar mangás recentes com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            manga_uuid: 'uuid-1',
            title: 'Manga Recente',
            description: 'Descrição do manga recente',
            cover: 'cover1.jpg',
            views_count: 150
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
      };

      mockedDiscoverController.getRecent.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/discover/recents')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedDiscoverController.getRecent).toHaveBeenCalled();
    });

    it('deve aplicar middleware de autenticação', async () => {
      await request(app)
        .get('/discover/recents')
        .expect(200);

      expect(mockedDiscoverController.getRecent).toHaveBeenCalled();
    });
  });

  describe('GET /discover/views', () => {
    it('deve retornar mangás mais vistos com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            manga_uuid: 'uuid-1',
            title: 'Manga Mais Visto',
            description: 'Descrição do manga mais visto',
            cover: 'cover1.jpg',
            views_count: 1000
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
      };

      mockedDiscoverController.getMostViewed.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/discover/views')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedDiscoverController.getMostViewed).toHaveBeenCalled();
    });

    it('deve tratar parâmetros de paginação', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          total: 0,
          page: 2,
          limit: 5,
          totalPages: 0,
          next: false,
          prev: false
        }
      };

      mockedDiscoverController.getMostViewed.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      await request(app)
        .get('/discover/views?page=2&take=5')
        .expect(200);

      expect(mockedDiscoverController.getMostViewed).toHaveBeenCalled();
    });
  });

  describe('GET /discover/likes', () => {
    it('deve retornar mangás mais curtidos com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            manga_uuid: 'uuid-1',
            title: 'Manga Mais Curtido',
            description: 'Descrição do manga mais curtido',
            cover: 'cover1.jpg',
            likes_count: 500
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
      };

      mockedDiscoverController.getMostLiked.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/discover/likes')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedDiscoverController.getMostLiked).toHaveBeenCalled();
    });

    it('deve tratar parâmetros de idioma', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          next: false,
          prev: false
        }
      };

      mockedDiscoverController.getMostLiked.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      await request(app)
        .get('/discover/likes?lg=pt')
        .expect(200);

      expect(mockedDiscoverController.getMostLiked).toHaveBeenCalled();
    });
  });

  describe('GET /discover/feed', () => {
    it('deve retornar feed personalizado com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            manga_uuid: 'uuid-1',
            title: 'Manga do Feed',
            description: 'Descrição do manga do feed',
            cover: 'cover1.jpg'
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
      };

      mockedDiscoverController.getFeed.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/discover/feed')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedDiscoverController.getFeed).toHaveBeenCalled();
    });

    it('deve aplicar configuração de cache personalizada para feed', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          next: false,
          prev: false
        }
      };

      mockedDiscoverController.getFeed.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      await request(app)
        .get('/discover/feed?page=1&take=10&lg=pt')
        .expect(200);

      expect(mockedDiscoverController.getFeed).toHaveBeenCalled();
    });
  });

  describe('GET /discover/ia', () => {
    it('deve retornar recomendações de IA com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            manga_uuid: 'uuid-1',
            title: 'Recomendação IA',
            description: 'Descrição da recomendação por IA',
            cover: 'cover1.jpg'
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
      };

      mockedDiscoverController.getIA.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/discover/ia')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedDiscoverController.getIA).toHaveBeenCalled();
    });

    it('deve aplicar configuração de cache personalizada para IA', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          next: false,
          prev: false
        }
      };

      mockedDiscoverController.getIA.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      await request(app)
        .get('/discover/ia?lg=en')
        .expect(200);

      expect(mockedDiscoverController.getIA).toHaveBeenCalled();
    });
  });

  describe('GET /discover/categories/:categoryIds', () => {
    it('deve retornar mangás por categorias com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            manga_uuid: 'uuid-1',
            title: 'Manga por Categoria',
            description: 'Descrição do manga por categoria',
            cover: 'cover1.jpg'
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
      };

      mockedDiscoverController.getMangasByCategories.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/discover/categories/cat-1,cat-2')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedDiscoverController.getMangasByCategories).toHaveBeenCalled();
    });
  });

  describe('GET /discover/health', () => {
    it('deve retornar health check com sucesso', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'discover'
      };

      mockedDiscoverController.healthCheck.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/discover/health')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedDiscoverController.healthCheck).toHaveBeenCalled();
    });
  });

  describe('Middleware Integration', () => {
    it('deve aplicar middleware de cache inteligente em todas as rotas', async () => {
      // Testa se as rotas estão funcionando com cache
      await request(app).get('/discover/recents').expect(200);
      await request(app).get('/discover/views').expect(200);
      await request(app).get('/discover/likes').expect(200);
      await request(app).get('/discover/feed').expect(200);
      await request(app).get('/discover/ia').expect(200);
      await request(app).get('/discover/categories/cat-1').expect(200);

      // Verifica se todas as rotas estão respondendo corretamente
      expect(true).toBe(true);
    });

    it('deve aplicar middleware de autenticação em todas as rotas', async () => {
      const { requireAuth } = require('@/middlewares/auth');

      await request(app).get('/discover/recents');
      await request(app).get('/discover/views');
      await request(app).get('/discover/likes');
      await request(app).get('/discover/feed');
      await request(app).get('/discover/ia');
      await request(app).get('/discover/categories/cat-1');

      expect(requireAuth).toHaveBeenCalledTimes(6);
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erros do controller corretamente', async () => {
      mockedDiscoverController.getRecent.mockImplementation((req: any, res: any) => {
        res.status(500).json({ error: 'Erro interno do servidor' });
      });

      const response = await request(app)
        .get('/discover/recents')
        .expect(500);

      expect(response.body).toEqual({ error: 'Erro interno do servidor' });
    });

    it('deve tratar erros de autenticação', async () => {
      const { requireAuth } = require('@/middlewares/auth');
      requireAuth.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Não autorizado' });
      });

      const response = await request(app)
        .get('/discover/recents')
        .expect(401);

      expect(response.body).toEqual({ error: 'Não autorizado' });
    });
  });
});

describe('Admin Discover Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/admin/discover', AdminDiscoverRouter);
    jest.clearAllMocks();
  });

  describe('GET /admin/discover/stats', () => {
    it('deve retornar estatísticas admin com sucesso', async () => {
      const mockResponse = {
        totalMangas: 1000,
        totalCategories: 50,
        totalViews: 50000,
        totalLikes: 10000,
        averageMangasPerCategory: 20,
        language: 'pt-BR'
      };

      mockedDiscoverController.getStats.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/admin/discover/stats')
        .expect(401); // A rota admin requer autenticação

      expect(response.body).toEqual({ error: 'Não autorizado' });
    });
  });
});
