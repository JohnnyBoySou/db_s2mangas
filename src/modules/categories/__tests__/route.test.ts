import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { CategoriesRouter, AdminCategoriesRouter } from '../routes/CategoriesRouter';

jest.mock('../controllers/CategoriesController', () => ({
  CategoryController: {
    create: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('@/middlewares/auth', () => ({
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user-123', role: 'admin' };
    next();
  }),
  requireAdmin: jest.fn((req: any, res: any, next: any) => {
    if (req.user?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Acesso negado' });
    }
  })
}));

const mockedCategoryController = require('../controllers/CategoriesController').CategoryController;

describe('Categories Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/categories', CategoriesRouter);
    jest.clearAllMocks();
  });

  describe('GET /categories', () => {
    it('deve listar categorias com sucesso', async () => {
      const mockResponse = {
        data: [
          {
            id: 'cat-1',
            name: 'Ação',
            _count: { mangas: 5 }
          },
          {
            id: 'cat-2',
            name: 'Comédia',
            _count: { mangas: 3 }
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      };

      mockedCategoryController.list.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/categories')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedCategoryController.list).toHaveBeenCalled();
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

      mockedCategoryController.list.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      await request(app)
        .get('/categories?page=2&limit=5')
        .expect(200);

      expect(mockedCategoryController.list).toHaveBeenCalled();
    });
  });

  describe('GET /categories/:id', () => {
    it('deve buscar categoria por ID com sucesso', async () => {
      const mockResponse = {
        id: 'cat-1',
        name: 'Ação',
        mangas: [
          {
            id: 'manga-1',
            title: 'Manga Teste',
            cover: 'cover.jpg'
          }
        ]
      };

      mockedCategoryController.getById.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/categories/cat-1')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedCategoryController.getById).toHaveBeenCalled();
    });

    it('deve tratar categoria não encontrada', async () => {
      mockedCategoryController.getById.mockImplementation((req: any, res: any) => {
        res.status(404).json({ error: 'Categoria não encontrada' });
      });

      const response = await request(app)
        .get('/categories/cat-inexistente')
        .expect(404);

      expect(response.body).toEqual({ error: 'Categoria não encontrada' });
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erros do controller corretamente', async () => {
      mockedCategoryController.list.mockImplementation((req: any, res: any) => {
        res.status(500).json({ error: 'Erro interno do servidor' });
      });

      const response = await request(app)
        .get('/categories')
        .expect(500);

      expect(response.body).toEqual({ error: 'Erro interno do servidor' });
    });
  });
});

describe('Admin Categories Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/admin/categories', AdminCategoriesRouter);
    jest.clearAllMocks();
  });

  describe('POST /admin/categories', () => {
    it('deve criar categoria com sucesso', async () => {
      const mockResponse = {
        id: 'cat-new',
        name: 'Nova Categoria',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockedCategoryController.create.mockImplementation((req: any, res: any) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app)
        .post('/admin/categories')
        .send({ name: 'Nova Categoria' })
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(mockedCategoryController.create).toHaveBeenCalled();
    });

    it('deve aplicar middleware de autenticação', async () => {
      const { requireAuth } = require('@/middlewares/auth');

      await request(app)
        .post('/admin/categories')
        .send({ name: 'Nova Categoria' })
        .expect(201);

      expect(requireAuth).toHaveBeenCalled();
    });

    it('deve aplicar middleware de admin', async () => {
      const { requireAdmin } = require('@/middlewares/auth');

      await request(app)
        .post('/admin/categories')
        .send({ name: 'Nova Categoria' })
        .expect(201);

      expect(requireAdmin).toHaveBeenCalled();
    });
  });

  describe('PUT /admin/categories/:id', () => {
    it('deve atualizar categoria com sucesso', async () => {
      const mockResponse = {
        id: 'cat-1',
        name: 'Categoria Atualizada',
        updatedAt: new Date().toISOString()
      };

      mockedCategoryController.update.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .put('/admin/categories/cat-1')
        .send({ name: 'Categoria Atualizada' })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedCategoryController.update).toHaveBeenCalled();
    });

    it('deve aplicar middlewares de autenticação e admin', async () => {
      const { requireAuth, requireAdmin } = require('@/middlewares/auth');

      await request(app)
        .put('/admin/categories/cat-1')
        .send({ name: 'Categoria Atualizada' })
        .expect(200);

      expect(requireAuth).toHaveBeenCalled();
      expect(requireAdmin).toHaveBeenCalled();
    });
  });

  describe('DELETE /admin/categories/:id', () => {
    it('deve deletar categoria com sucesso', async () => {
      const mockResponse = {
        message: 'Categoria deletada com sucesso!',
        data: { message: 'Categoria deletada com sucesso' }
      };

      mockedCategoryController.delete.mockImplementation((req: any, res: any) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .delete('/admin/categories/cat-1')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedCategoryController.delete).toHaveBeenCalled();
    });

    it('deve aplicar middlewares de autenticação e admin', async () => {
      const { requireAuth, requireAdmin } = require('@/middlewares/auth');

      await request(app)
        .delete('/admin/categories/cat-1')
        .expect(200);

      expect(requireAuth).toHaveBeenCalled();
      expect(requireAdmin).toHaveBeenCalled();
    });
  });

  describe('Middleware Integration', () => {
    it('deve aplicar middleware de autenticação em todas as rotas admin', async () => {
      const { requireAuth } = require('@/middlewares/auth');

      await request(app).post('/admin/categories').send({ name: 'Test' });
      await request(app).put('/admin/categories/cat-1').send({ name: 'Test' });
      await request(app).delete('/admin/categories/cat-1');

      expect(requireAuth).toHaveBeenCalledTimes(3);
    });

    it('deve aplicar middleware de admin em todas as rotas admin', async () => {
      const { requireAdmin } = require('@/middlewares/auth');

      await request(app).post('/admin/categories').send({ name: 'Test' });
      await request(app).put('/admin/categories/cat-1').send({ name: 'Test' });
      await request(app).delete('/admin/categories/cat-1');

      expect(requireAdmin).toHaveBeenCalledTimes(3);
    });
  });
});
