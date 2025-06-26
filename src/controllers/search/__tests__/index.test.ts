import request from 'supertest';
import express from 'express';
import * as searchController from '../index';
import * as searchHandlers from '../../../handlers/search';
import { handleZodError } from '../../../utils/zodError';
// Mock das dependências
jest.mock('@/handlers/search');
jest.mock('@/utils/zodError');

const mockedSearchHandlers = searchHandlers as jest.Mocked<typeof searchHandlers>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Rotas para teste
app.post('/search', searchController.searchManga);
app.post('/search/:lg', searchController.searchManga);
app.get('/categories', searchController.listCategories);
app.post('/search/categories', searchController.searchCategories);
app.post('/search/categories/:lg', searchController.searchCategories);
app.get('/search/advanced', searchController.searchAdvanced);
app.get('/search/advanced/:lg', searchController.searchAdvanced);
app.get('/types', searchController.listTypes);
app.get('/languages', searchController.listLanguages);

describe('Controlador de Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /search/:lg? - searchManga', () => {
    const mockSearchResult = {
      mangas: [
        {
          id: '1',
          title: 'Naruto',
          category: 'Action',
          status: 'completed',
          type: 'manga'
        },
        {
          id: '2',
          title: 'One Piece',
          category: 'Adventure',
          status: 'Em andamento' as const,
          type: 'manga'
        }
      ],
      total: 2,
      page: 1,
      totalPages: 1
    };

    it('deve buscar mangás com sucesso', async () => {
      // Given
      const searchData = {
        name: 'Naruto',
        category: 'Action',
        status: 'completed',
        type: 'manga',
        page: 1,
        limit: 10
      };
      mockedSearchHandlers.searchManga.mockResolvedValue(mockSearchResult as any);

      // When
      const response = await request(app)
        .post('/search/pt-BR')
        .send(searchData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSearchResult);
      expect(mockedSearchHandlers.searchManga).toHaveBeenCalledWith({
        name: 'Naruto',
        category: 'Action',
        status: 'completed',
        type: 'manga',
        page: 1,
        limit: 10,
        language: 'pt-BR'
      });
    });

    it('deve buscar mangás com idioma padrão quando não especificado', async () => {
      // Given
      const searchData = {
        name: 'One Piece'
      };
      mockedSearchHandlers.searchManga.mockResolvedValue(mockSearchResult as any);

      // When
      const response = await request(app)
        .post('/search')
        .send(searchData);

      // Then
      expect(response.status).toBe(200);
      expect(mockedSearchHandlers.searchManga).toHaveBeenCalledWith({
        name: 'One Piece',
        page: 1,
        limit: 10,
        language: 'pt-BR'
      });
    });

    it('deve retornar erro quando handler falha', async () => {
      // Given
      const searchData = { name: 'Test' };
      const error = new Error('Search failed');
      mockedSearchHandlers.searchManga.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Internal server error' });
      });

      // When
      const response = await request(app)
        .post('/search')
        .send(searchData);

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('GET /categories - listCategories', () => {
    const mockCategories = [
      { id: '1', name: 'Action' },
      { id: '2', name: 'Romance' },
      { id: '3', name: 'Comedy' }
    ];

    it('deve listar categorias com sucesso', async () => {
      // Given
      mockedSearchHandlers.listCategories.mockResolvedValue(mockCategories as any);

      // When
      const response = await request(app)
        .get('/categories');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategories);
      expect(mockedSearchHandlers.listCategories).toHaveBeenCalled();
    });

    it('deve retornar erro quando handler falha', async () => {
      // Given
      const error = new Error('Database error');
      mockedSearchHandlers.listCategories.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Internal server error' });
      });

      // When
      const response = await request(app)
        .get('/categories');

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('POST /search/categories/:lg? - searchCategories', () => {
    const mockCategoriesResult = {
      categories: [
        { id: '1', name: 'Action' },
        { id: '2', name: 'Adventure' }
      ],
      total: 2,
      page: 1,
      totalPages: 1
    };

    it('deve buscar categorias com sucesso', async () => {
      // Given
      const searchData = {
        name: 'Act',
        page: 1,
        limit: 10
      };
      mockedSearchHandlers.searchCategories.mockResolvedValue(mockCategoriesResult as any);

      // When
      const response = await request(app)
        .post('/search/categories/pt-BR')
        .send(searchData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategoriesResult);
      expect(mockedSearchHandlers.searchCategories).toHaveBeenCalledWith(
        'Act',
        1,
        10,
        'pt-BR'
      );
    });

    /*

    it('deve retornar erro 400 quando nome não é fornecido', async () => {
      // Given
      const searchData = {
        page: 1,
        limit: 10
      };

      // When
      const response = await request(app)
        .post('/search/categories')
        .send(searchData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Nome da categoria é obrigatório.'
      });
    });

    it('deve retornar erro 400 quando nome não é string', async () => {
      // Given
      const searchData = {
        name: 123, // não é string
        page: 1,
        limit: 10
      };

      // When
      const response = await request(app)
        .post('/search/categories')
        .send(searchData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Nome da categoria é obrigatório.'
      });
    });

    it('deve usar idioma padrão quando não especificado', async () => {
      // Given
      const searchData = {
        name: 'Action'
      };
      mockedSearchHandlers.searchCategories.mockResolvedValue(mockCategoriesResult as any);

      // When
      const response = await request(app)
        .post('/search/categories')
        .send(searchData);

      // Then
      expect(response.status).toBe(200);
      expect(mockedSearchHandlers.searchCategories).toHaveBeenCalledWith(
        'Action',
        1,
        10,
        'pt-BR'
      );
    });
    */
  });

  describe('POST /search/advanced', () => {
    it('deve realizar busca avançada com sucesso', async () => {
      const mockResults = {
        data: [{
          id: '1',
          title: 'Test Manga',
          description: 'Test description',
          translations: undefined,
          categories: [{ id: '1', name: 'Action' }],
          _count: { likes: 0, views: 0 },
          cover: 'test-cover.jpg',
          status: 'Em andamento',
          type: 'manga',
          createdAt: new Date('2023-01-01T00:00:00.000Z'),
          updatedAt: new Date('2023-01-01T00:00:00.000Z'),
          releaseDate: new Date('2023-01-01T00:00:00.000Z'),
          manga_uuid: null
        }],
        pagination: {
          total: 1,
          to: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      };

      mockedSearchHandlers.searchManga.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/search/advanced')
        .send({
          name: 'test',
          categories: ['action'],
          status: 'Em andamento',
          type: 'manga',
          languages: ['pt']
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            title: 'Test Manga',
            description: 'Test description',
            status: 'Em andamento',
            type: 'manga'
          })
        ]),
        pagination: expect.objectContaining({
          total: 1,
          page: 1,
          limit: 10
        })
      });
      expect(mockedSearchHandlers.searchManga).toHaveBeenCalled();
    });


  });

  describe('GET /types - listTypes', () => {
    it('deve listar tipos de manga com sucesso', async () => {
      // When
      const response = await request(app)
        .get('/types');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(['Manga', 'Manhwa', 'Manhua', 'Webtoon']);
    });

    it('deve retornar erro quando handler falha', async () => {
      // Given
      // Mockamos Object.values para simular um erro
      const originalObjectValues = Object.values;
      Object.values = jest.fn().mockImplementation(() => {
        throw new Error('Object.values failed');
      });
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Internal server error' });
      });

      // When
      const response = await request(app)
        .get('/types');

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalled();

      // Restauramos Object.values
      Object.values = originalObjectValues;
    });
  });

  describe('GET /languages - listLanguages', () => {
    const mockLanguages = [
      { code: 'pt-BR', name: 'Português (Brasil)' },
      { code: 'en-US', name: 'English (United States)' },
      { code: 'ja-JP', name: '日本語 (日本)' }
    ];

    it('deve listar idiomas com sucesso', async () => {
      // Given
      mockedSearchHandlers.listLanguages.mockResolvedValue(mockLanguages as any);

      // When
      const response = await request(app)
        .get('/languages');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLanguages);
      expect(mockedSearchHandlers.listLanguages).toHaveBeenCalled();
    });

    it('deve retornar erro quando handler falha', async () => {
      // Given
      const error = new Error('Database error');
      mockedSearchHandlers.listLanguages.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Internal server error' });
      });

      // When
      const response = await request(app)
        .get('/languages');

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });
});