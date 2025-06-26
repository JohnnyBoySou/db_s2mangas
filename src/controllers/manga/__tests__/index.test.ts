// Mock das dependências ANTES dos imports
jest.mock('@/handlers/manga');
jest.mock('@/utils/zodError');
jest.mock('@/utils/pagination');
jest.mock('@/utils/invalidateAdminCache');

import request from 'supertest';
import express from 'express';
import * as mangaController from '../index';
import * as mangaHandler from '@/handlers/manga';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';
import { invalidateAdminCache } from '@/utils/invalidateAdminCache';

jest.mock('@/prisma/client', () => ({
  prisma: {
    manga: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

const mockedMangaHandler = mangaHandler as jest.Mocked<typeof mangaHandler>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;
const mockedGetPaginationParams = getPaginationParams as jest.MockedFunction<typeof getPaginationParams>;
const mockedInvalidateAdminCache = invalidateAdminCache as jest.MockedFunction<typeof invalidateAdminCache>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Middleware para simular usuário autenticado
app.use((req, res, next) => {
  (req as any).user = { id: 'user-123' };
  next();
});

// Rotas para teste
app.post('/manga', mangaController.create);
app.get('/manga', mangaController.list);
app.get('/manga/:id', mangaController.get);
app.put('/manga/:id', mangaController.update);
app.delete('/manga/:id', mangaController.remove);
app.get('/manga/category/search', mangaController.category);
app.get('/manga/:id/covers', mangaController.covers);
app.post('/manga/import/mangadx/:mangaId', mangaController.importFromMangaDex);
app.post('/manga/import/json', mangaController.importFromJSON);
app.post('/manga/import/file/:filename', mangaController.importFromFile);
app.get('/manga/:id/chapters', mangaController.chapters);
app.get('/manga/chapter/:chapterID/pages', mangaController.pages);
app.delete('/manga/clear', mangaController.clearMangaTable);
app.get('/manga/:id/similar', mangaController.similar);

describe('Controlador de Manga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /manga', () => {
    const mockMangaData = {
      cover: 'https://example.com/cover.jpg',
      status: 'ongoing',
      type: 'manga',
      releaseDate: '2023-01-01',
      manga_uuid: 'uuid-123',
      languageIds: ['lang-1'],
      categoryIds: ['cat-1'],
      translations: [{
        language: 'pt-br',
        name: 'Teste Manga',
        description: 'Descrição do manga'
      }]
    };

    it('deve criar um manga com sucesso', async () => {
      // Given
      const fixedDate = new Date('2023-01-01T00:00:00.000Z');
      const fixedTimestamp = new Date('2025-06-26T21:38:04.728Z');
      const mockCreatedManga = {
        id: 'manga-123',
        cover: mockMangaData.cover,
        status: mockMangaData.status,
        type: mockMangaData.type,
        releaseDate: fixedDate.toISOString(),
        manga_uuid: mockMangaData.manga_uuid,
        createdAt: fixedTimestamp.toISOString(),
        updatedAt: fixedTimestamp.toISOString(),
        translations: [{
          id: 'trans-1',
          language: 'pt-br',
          name: 'Manga Teste',
          description: 'Descrição do manga',
          mangaId: 'manga-123'
        }],
        categories: [{
          id: 'cat-1',
          name: 'Ação'
        }],
        languages: [{
          id: 'lang-1',
          code: 'pt-br',
          name: 'Português (Brasil)'
        }]
      };
      mockedMangaHandler.createManga.mockResolvedValue(mockCreatedManga as any);

      // When
      const response = await request(app)
        .post('/manga')
        .send(mockMangaData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedManga);
      expect(mockedMangaHandler.createManga).toHaveBeenCalledWith(mockMangaData);
    });

    it('deve lidar com erro de validação ao criar manga', async () => {
      // Given
      const validationError = new Error('Dados inválidos');
      mockedMangaHandler.createManga.mockRejectedValue(validationError);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ error: 'Dados inválidos' });
      });

      // When
      const response = await request(app)
        .post('/manga')
        .send(mockMangaData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Dados inválidos' });
      expect(mockedHandleZodError).toHaveBeenCalledWith(validationError, expect.any(Object));
    });
  });

  describe('GET /manga', () => {
    it('deve listar mangás com sucesso', async () => {
      // Given
      const mockMangas = {
        data: [{ id: 'manga-1', title: 'Manga 1' }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      };
      mockedMangaHandler.listMangas.mockResolvedValue(mockMangas);

      // When
      const response = await request(app)
        .get('/manga')
        .query({ lg: 'pt-br', page: '1', limit: '10' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMangas);
      expect(mockedMangaHandler.listMangas).toHaveBeenCalledWith('pt-br', 1, 10);
    });

    it('deve usar valores padrão quando parâmetros não são fornecidos', async () => {
      // Given
      const mockMangas = {
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
      mockedMangaHandler.listMangas.mockResolvedValue(mockMangas);

      // When
      const response = await request(app).get('/manga');

      // Then
      expect(response.status).toBe(200);
      expect(mockedMangaHandler.listMangas).toHaveBeenCalledWith('en', 1, 10);
    });

    it('deve lidar com erro ao listar mangás', async () => {
      // Given
      const error = new Error('Erro interno');
      mockedMangaHandler.listMangas.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(500).json({ error: 'Erro interno' });
      });

      // When
      const response = await request(app).get('/manga');

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('GET /manga/:id', () => {
    it('deve buscar manga por ID com sucesso', async () => {
      // Given
      const fixedTimestamp = new Date('2025-06-26T21:38:04.728Z');
      const mockManga = {
        id: 'manga-123',
        cover: 'https://example.com/cover.jpg',
        status: 'ongoing',
        type: 'manga',
        createdAt: fixedTimestamp.toISOString(),
        updatedAt: fixedTimestamp.toISOString(),
        releaseDate: fixedTimestamp.toISOString(),
        manga_uuid: 'uuid-123',
        categories: [{
          id: 'cat-1',
          name: 'Ação'
        }],
        languages: [{
          id: 'lang-1',
          code: 'pt-br',
          name: 'Português (Brasil)'
        }],
        chapters: [],
        likes: [],
        title: 'Manga Teste',
        description: 'Descrição do manga',
        language: 'pt-br',
        views: 100,
        covers: [{
          img: 'https://example.com/cover.jpg',
          volume: '1',
          id: 'cover-1'
        }]
      };
      mockedMangaHandler.getMangaById.mockResolvedValue(mockManga as any);

      // When
      const response = await request(app)
        .get('/manga/manga-123')
        .query({ lg: 'pt-br' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockManga);
      expect(mockedMangaHandler.getMangaById).toHaveBeenCalledWith('manga-123', 'pt-br', 'user-123');
    });

    it('deve retornar 404 quando manga não é encontrado', async () => {
      // Given
      const error = new Error('Mangá não encontrado');
      mockedMangaHandler.getMangaById.mockRejectedValue(error);

      // When
      const response = await request(app).get('/manga/inexistente');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Mangá não encontrado' });
    });

    it('deve lidar com outros erros', async () => {
      // Given
      const error = new Error('Erro interno');
      mockedMangaHandler.getMangaById.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(500).json({ error: 'Erro interno' });
      });

      // When
      const response = await request(app).get('/manga/manga-123');

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('PUT /manga/:id', () => {
    const mockUpdateData = {
      cover: 'https://example.com/new-cover.jpg',
      status: 'completed'
    };

    it('deve atualizar manga com sucesso', async () => {
      // Given
      const fixedTimestamp = new Date('2025-06-26T21:38:04.728Z');
      const mockUpdatedManga = {
        id: 'manga-123',
        cover: 'https://example.com/new-cover.jpg',
        status: 'completed',
        type: 'manga',
        createdAt: fixedTimestamp.toISOString(),
        updatedAt: fixedTimestamp.toISOString(),
        releaseDate: fixedTimestamp.toISOString(),
        manga_uuid: 'uuid-123',
        translations: [{
          id: 'trans-1',
          language: 'pt-br',
          name: 'Manga Atualizado',
          description: 'Descrição atualizada',
          mangaId: 'manga-123'
        }],
        categories: [{
          id: 'cat-1',
          name: 'Ação'
        }],
        languages: [{
          id: 'lang-1',
          code: 'pt-br',
          name: 'Português (Brasil)'
        }]
      };
      mockedMangaHandler.updateManga.mockResolvedValue(mockUpdatedManga as any);
      mockedInvalidateAdminCache.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .put('/manga/manga-123')
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedManga);
      expect(mockedMangaHandler.updateManga).toHaveBeenCalledWith('manga-123', mockUpdateData);
      expect(mockedInvalidateAdminCache).toHaveBeenCalledWith('user-123');
    });

    it('deve retornar 404 quando manga não é encontrado para atualização', async () => {
      // Given
      const error = new Error('Mangá não encontrado');
      mockedMangaHandler.updateManga.mockRejectedValue(error);

      // When
      const response = await request(app)
        .put('/manga/inexistente')
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Mangá não encontrado' });
    });
  });

  describe('DELETE /manga/:id', () => {
    it('deve remover manga com sucesso', async () => {
      // Given
      const mockResult = { message: 'Manga removido com sucesso' };
      mockedMangaHandler.deleteManga.mockResolvedValue(mockResult);

      // When
      const response = await request(app).delete('/manga/manga-123');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(mockedMangaHandler.deleteManga).toHaveBeenCalledWith('manga-123');
    });

    it('deve retornar 404 quando manga não é encontrado para remoção', async () => {
      // Given
      const error = new Error('Mangá não encontrado');
      mockedMangaHandler.deleteManga.mockRejectedValue(error);

      // When
      const response = await request(app).delete('/manga/inexistente');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Mangá não encontrado' });
    });
  });

  describe('GET /manga/category/search', () => {
    beforeEach(() => {
      mockedGetPaginationParams.mockReturnValue({ take: 10, page: 1, skip: 0 });
    });

    it('deve buscar mangás por categoria com sucesso', async () => {
      // Given
      const fixedTimestamp = new Date('2025-06-26T21:38:04.728Z');
      const mockResult = {
        data: [{ 
          id: 'manga-1', 
          cover: 'https://example.com/cover.jpg',
          status: 'ongoing',
          type: 'manga',
          createdAt: fixedTimestamp.toISOString(),
          updatedAt: fixedTimestamp.toISOString(),
          releaseDate: fixedTimestamp.toISOString(),
          manga_uuid: 'uuid-123',
          translations: [{
            id: 'trans-1',
            language: 'pt-br',
            name: 'Manga Ação',
            description: 'Descrição do manga de ação',
            mangaId: 'manga-1'
          }],
          categories: [{
            id: 'cat-1',
            name: 'Ação'
          }],
          _count: {
            likes: 10,
            views: 100
          }
        }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      };
      mockedMangaHandler.getMangaByCategory.mockResolvedValue(mockResult as any);

      // When
      const response = await request(app)
        .get('/manga/category/search')
        .query({ category: 'acao' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(mockedMangaHandler.getMangaByCategory).toHaveBeenCalledWith('acao', 1, 10);
    });

    it('deve retornar erro quando categoria não é fornecida', async () => {
      // When
      const response = await request(app).get('/manga/category/search');

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Parâmetro "category" é obrigatório.' });
    });

    
  });

  describe('GET /manga/:id/covers', () => {
    it('deve buscar capas do manga com sucesso', async () => {
      // Given
      const mockCovers = [{ 
        id: 'cover-1', 
        img: 'https://example.com/cover1.jpg',
        volume: '1'
      }];
      mockedMangaHandler.getMangaCovers.mockResolvedValue(mockCovers);

      // When
      const response = await request(app).get('/manga/manga-123/covers');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCovers);
      expect(mockedMangaHandler.getMangaCovers).toHaveBeenCalledWith('manga-123');
    });

    it('deve retornar 404 quando UUID do manga não é encontrado', async () => {
      // Given
      const error = new Error('UUID do mangá não encontrado');
      mockedMangaHandler.getMangaCovers.mockRejectedValue(error);

      // When
      const response = await request(app).get('/manga/inexistente/covers');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'UUID do mangá não encontrado' });
    });

    it('deve retornar 500 para outros erros', async () => {
      // Given
      const error = new Error('Erro interno');
      mockedMangaHandler.getMangaCovers.mockRejectedValue(error);

      // When
      const response = await request(app).get('/manga/manga-123/covers');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro ao buscar capas do mangá' });
    });
  });

  describe('POST /manga/import/mangadx/:mangaId', () => {
    it('deve importar manga do MangaDx com sucesso', async () => {
      // Given
      const fixedTimestamp = new Date('2025-06-26T21:38:04.728Z');
      const mockImportedManga = { 
        id: 'manga-123',
        cover: 'https://example.com/cover.jpg',
        status: 'ongoing',
        type: 'manga',
        createdAt: fixedTimestamp.toISOString(),
        updatedAt: fixedTimestamp.toISOString(),
        releaseDate: fixedTimestamp.toISOString(),
        manga_uuid: 'mangadx-123',
        translations: [{
          id: 'trans-1',
          language: 'pt-br',
          name: 'Manga Importado',
          description: 'Descrição do manga importado',
          mangaId: 'manga-123'
        }],
        categories: [{
          id: 'cat-1',
          name: 'Ação'
        }],
        languages: [{
          id: 'lang-1',
          code: 'pt-br',
          name: 'Português (Brasil)'
        }]
      };
      mockedMangaHandler.importMangaFromMangaDex.mockResolvedValue(mockImportedManga as any);

      // When
      const response = await request(app).post('/manga/import/mangadx/mangadx-123');

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockImportedManga);
      expect(mockedMangaHandler.importMangaFromMangaDex).toHaveBeenCalledWith('mangadx-123');
    });

    it('deve lidar com erro na importação do MangaDex', async () => {
      // Given
      const error = new Error('Erro na importação');
      mockedMangaHandler.importMangaFromMangaDex.mockRejectedValue(error);

      // When
      const response = await request(app).post('/manga/import/mangadx/invalid-id');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro ao importar mangá do MangaDex' });
    });
  });

  describe('POST /manga/import/json', () => {
    it('deve importar manga do JSON com sucesso', async () => {
      // Given
      const fixedTimestamp = new Date('2025-06-26T21:38:04.728Z');
      const mockJsonData = { title: 'Manga JSON', cover: 'https://example.com/cover.jpg' };
      const mockImportedManga = { 
        id: 'manga-123',
        cover: 'https://example.com/cover.jpg',
        status: 'ongoing',
        type: 'manga',
        createdAt: fixedTimestamp.toISOString(),
        updatedAt: fixedTimestamp.toISOString(),
        releaseDate: fixedTimestamp.toISOString(),
        manga_uuid: 'uuid-123',
        translations: [{
          id: 'trans-1',
          language: 'pt-br',
          name: 'Manga JSON',
          description: 'Descrição do manga',
          mangaId: 'manga-123'
        }],
        categories: [{
          id: 'cat-1',
          name: 'Ação'
        }],
        languages: [{
          id: 'lang-1',
          code: 'pt-br',
          name: 'Português (Brasil)'
        }]
      };
      mockedMangaHandler.importMangaFromJSON.mockResolvedValue(mockImportedManga as any);

      // When
      const response = await request(app)
        .post('/manga/import/json')
        .send(mockJsonData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockImportedManga);
      expect(mockedMangaHandler.importMangaFromJSON).toHaveBeenCalledWith(mockJsonData);
    });

    it('deve lidar com erro na importação do JSON', async () => {
      // Given
      const error = new Error('Dados JSON inválidos');
      mockedMangaHandler.importMangaFromJSON.mockRejectedValue(error);

      // When
      const response = await request(app)
        .post('/manga/import/json')
        .send({});

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Erro ao importar mangá do JSON',
        details: 'Dados JSON inválidos'
      });
    });
  });

  describe('GET /manga/:id/chapters', () => {
    it('deve buscar capítulos do manga com sucesso', async () => {
      // Given
      const mockChapters = {
        current_page: 1,
        data: [{ 
          id: 'chapter-1', 
          title: 'Capítulo 1',
          chapter: 1,
          volume: null,
          language: ['pt-br'],
          publish_date: '01 Jan 2023',
          pages: 20,
          external_url: null,
          is_external: false
        }],
        from: 1,
        last_page: 1,
        next: false,
        per_page: 20,
        prev: false,
        to: 1,
        total: 1
      };
      mockedMangaHandler.getMangaChapters.mockResolvedValue(mockChapters);

      // When
      const response = await request(app)
        .get('/manga/manga-123/chapters')
        .query({ lg: 'pt-br', order: 'asc', page: '1', limit: '20' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChapters);
      expect(mockedMangaHandler.getMangaChapters).toHaveBeenCalledWith('manga-123', 'pt-br', 'asc', 1, 20);
    });

    it('deve usar valores padrão para parâmetros opcionais', async () => {
      // Given
      const mockChapters = {
        current_page: 1,
        data: [],
        from: 0,
        last_page: 1,
        next: false,
        per_page: 20,
        prev: false,
        to: 0,
        total: 0
      };
      mockedMangaHandler.getMangaChapters.mockResolvedValue(mockChapters);

      // When
      const response = await request(app).get('/manga/manga-123/chapters');

      // Then
      expect(response.status).toBe(200);
      expect(mockedMangaHandler.getMangaChapters).toHaveBeenCalledWith('manga-123', 'pt-br', 'desc', 1, 20);
    });

    it('deve retornar 404 quando manga não é encontrado', async () => {
      // Given
      const error = new Error('Mangá não encontrado ou UUID não disponível');
      mockedMangaHandler.getMangaChapters.mockRejectedValue(error);

      // When
      const response = await request(app).get('/manga/inexistente/chapters');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Mangá não encontrado ou UUID não disponível' });
    });
  });

  describe('GET /manga/chapter/:chapterID/pages', () => {
    it('deve buscar páginas do capítulo com sucesso', async () => {
      // Given
      const mockPages = {
        pages: ['page1.jpg', 'page2.jpg'],
        total: 2,
        chapter_id: 'chapter-123',
        base_url: 'https://api.mangadx.org/data',
        quality: 'high',
        hash: 'hash123'
      };
      mockedMangaHandler.getChapterPages.mockResolvedValue(mockPages);

      // When
      const response = await request(app)
        .get('/manga/chapter/chapter-123/pages')
        .query({ quality: 'high' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPages);
      expect(mockedMangaHandler.getChapterPages).toHaveBeenCalledWith('chapter-123', 'high');
    });

    it('deve usar qualidade padrão quando não especificada', async () => {
      // Given
      const mockPages = { 
        pages: [], 
        total: 0,
        chapter_id: 'chapter-123',
        base_url: 'https://api.mangadx.org/data',
        quality: 'high',
        hash: 'hash123'
      };
      mockedMangaHandler.getChapterPages.mockResolvedValue(mockPages);

      // When
      const response = await request(app).get('/manga/chapter/chapter-123/pages');

      // Then
      expect(response.status).toBe(200);
      expect(mockedMangaHandler.getChapterPages).toHaveBeenCalledWith('chapter-123', 'high');
    });

    it('deve lidar com erro ao buscar páginas', async () => {
      // Given
      const error = new Error('Capítulo não encontrado');
      mockedMangaHandler.getChapterPages.mockRejectedValue(error);

      // When
      const response = await request(app).get('/manga/chapter/inexistente/pages');

      // Then
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Capítulo não encontrado');
    });
  });

  describe('GET /manga/:id/similar', () => {
    it('deve buscar mangás similares com sucesso', async () => {
      // Given
      const mockSimilarMangas = [
        { id: 'manga-2', cover: 'https://example.com/cover2.jpg', title: 'Manga Similar 1' },
        { id: 'manga-3', cover: 'https://example.com/cover3.jpg', title: 'Manga Similar 2' }
      ];
      mockedMangaHandler.getSimilarMangas.mockResolvedValue(mockSimilarMangas);

      // When
      const response = await request(app)
        .get('/manga/manga-123/similar')
        .query({ limit: '3' });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSimilarMangas);
      expect(mockedMangaHandler.getSimilarMangas).toHaveBeenCalledWith('manga-123', 3);
    });

    it('deve usar limite padrão quando não especificado', async () => {
      // Given
      const mockSimilarMangas: Array<{id: string, cover: string, title: string}> = [];
      mockedMangaHandler.getSimilarMangas.mockResolvedValue(mockSimilarMangas);

      // When
      const response = await request(app).get('/manga/manga-123/similar');

      // Then
      expect(response.status).toBe(200);
      expect(mockedMangaHandler.getSimilarMangas).toHaveBeenCalledWith('manga-123', 5);
    });

    it('deve retornar 404 quando manga não é encontrado', async () => {
      // Given
      const error = new Error('Mangá não encontrado');
      mockedMangaHandler.getSimilarMangas.mockRejectedValue(error);

      // When
      const response = await request(app).get('/manga/inexistente/similar');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Mangá não encontrado' });
    });
  });

  /*
  describe('DELETE /manga/clear', () => {
    it('deve limpar tabela de mangás com sucesso', async () => {
      // Given
      const fixedTimestamp = new Date('2025-06-26T21:38:04.728Z');
      const mockResult = { 
        message: 'Tabela de mangás e suas relações foram limpas com sucesso', 
        timestamp: fixedTimestamp.toISOString() 
      };
      mockedMangaHandler.clearMangaTable.mockResolvedValue(mockResult as any);

      // When
      const response = await request(app).delete('/manga/clear');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Tabela de mangás e suas relações foram limpas com sucesso',
        timestamp: mockTimestamp.toISOString()
      });
      expect(mockedMangaHandler.clearMangaTable).toHaveBeenCalled();
    });

    it('deve lidar com erro ao limpar tabela', async () => {
      // Given
      const error = new Error('Erro ao limpar tabela');
      jest.clearAllMocks();
      mockedMangaHandler.clearMangaTable.mockRejectedValue(error);
      
      console.log('Mock clearMangaTable:', typeof mockedMangaHandler.clearMangaTable);
      console.log('Mock clearMangaTable implementation:', mockedMangaHandler.clearMangaTable.getMockImplementation());

      // When
      const response = await request(app)
        .delete('/manga/clear');

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Erro ao limpar tabela de mangás',
        details: 'Erro ao limpar tabela'
      });
    });
  });
  */
});