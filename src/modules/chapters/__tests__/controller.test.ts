import request from 'supertest';
import express from 'express';
import * as chapterController from '../controllers/ChaptersController';
import * as chapterHandlers from '../handlers/ChaptersHandler';

// Mock das dependências
jest.mock('../handlers/ChaptersHandler');

const mockedChapterHandlers = chapterHandlers as jest.Mocked<typeof chapterHandlers>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Rotas para teste
app.get('/chapters/:id', chapterController.list);
app.get('/chapters/:chapterID/pages', chapterController.getPages);

describe('Controlador de Capítulos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /chapters/:id - list', () => {
    const mangaId = 'manga123';
    const mockChaptersResponse = {
      data: [
        {
          id: 'chapter1',
          title: 'Capítulo 1',
          number: 1,
          mangaId: mangaId,
          createdAt: new Date()
        },
        {
          id: 'chapter2',
          title: 'Capítulo 2',
          number: 2,
          mangaId: mangaId,
          createdAt: new Date()
        }
      ],
      total: 2,
      current_page: 1,
      per_page: 20,
      last_page: 1,
      first_page_url: '?page=1',
      last_page_url: '?page=1',
      next_page_url: null,
      prev_page_url: null
    };

    it('deve listar capítulos com parâmetros padrão', async () => {
      // Given
      mockedChapterHandlers.listChapters.mockResolvedValue(mockChaptersResponse as any);

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`);

      // Then
      expect(response.status).toBe(200);
      expect(mockedChapterHandlers.listChapters).toHaveBeenCalledWith({
        id: mangaId,
        lg: 'pt-br',
        order: 'desc',
        page: 1,
        limit: 20,
        offset: 0
      });
      
      // Verifica se os URLs foram modificados corretamente
      expect(response.body.first_page_url).toContain('http');
      expect(response.body.last_page_url).toContain('http');
      expect(response.body.path).toContain('http');
    });

    it('deve listar capítulos com parâmetros customizados', async () => {
      // Given
      mockedChapterHandlers.listChapters.mockResolvedValue(mockChaptersResponse as any);

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`)
        .query({
          lang: 'en',
          order: 'asc',
          page: '2',
          limit: '10'
        });

      // Then
      expect(response.status).toBe(200);
      expect(mockedChapterHandlers.listChapters).toHaveBeenCalledWith({
        id: mangaId,
        lg: 'en',
        order: 'asc',
        page: 2,
        limit: 10,
        offset: 10
      });
    });

    it('deve garantir que page seja pelo menos 1', async () => {
      // Given
      mockedChapterHandlers.listChapters.mockResolvedValue(mockChaptersResponse as any);

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`)
        .query({ page: '0' });

      // Then
      expect(response.status).toBe(200);
      expect(mockedChapterHandlers.listChapters).toHaveBeenCalledWith({
        id: mangaId,
        lg: 'pt-br',
        order: 'desc',
        page: 1,
        limit: 20,
        offset: 0
      });
    });

    it('deve garantir que page seja pelo menos 1 para valores negativos', async () => {
      // Given
      mockedChapterHandlers.listChapters.mockResolvedValue(mockChaptersResponse as any);

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`)
        .query({ page: '-5' });

      // Then
      expect(response.status).toBe(200);
      expect(mockedChapterHandlers.listChapters).toHaveBeenCalledWith({
        id: mangaId,
        lg: 'pt-br',
        order: 'desc',
        page: 1,
        limit: 20,
        offset: 0
      });
    });

    it('deve lidar com parâmetros inválidos', async () => {
      // Given
      mockedChapterHandlers.listChapters.mockResolvedValue(mockChaptersResponse as any);

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`)
        .query({
          page: 'invalid',
          limit: 'invalid'
        });

      // Then
      expect(response.status).toBe(200);
      expect(mockedChapterHandlers.listChapters).toHaveBeenCalledWith({
        id: mangaId,
        lg: 'pt-br',
        order: 'desc',
        page: NaN, // Math.max(1, NaN) retorna NaN
        limit: NaN, // parseInt('invalid') retorna NaN
        offset: NaN // (NaN - 1) * NaN = NaN
      });
    });

    it('deve adicionar URLs completos na resposta', async () => {
      // Given
      const mockResponseWithUrls = {
        ...mockChaptersResponse,
        first_page_url: '?page=1',
        last_page_url: '?page=1',
        next_page_url: '?page=2',
        prev_page_url: null
      };
      mockedChapterHandlers.listChapters.mockResolvedValue(mockResponseWithUrls as any);

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body.first_page_url).toMatch(/^http.*\?page=1$/);
      expect(response.body.last_page_url).toMatch(/^http.*\?page=1$/);
      expect(response.body.next_page_url).toMatch(/^http.*\?page=2$/);
      expect(response.body.prev_page_url).toBeNull();
      expect(response.body.path).toMatch(/^http/);
    });

    it('deve lidar com erro do handler', async () => {
      // Given
      const mockError = new Error('Erro ao buscar capítulos');
      mockedChapterHandlers.listChapters.mockRejectedValue(mockError);
      
      // Mock console.error para evitar logs durante o teste
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`);

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro ao buscar capítulos' });
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar capítulos:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('deve lidar com erro desconhecido', async () => {
      // Given
      const mockError = 'Erro string';
      mockedChapterHandlers.listChapters.mockRejectedValue(mockError);
      
      // Mock console.error para evitar logs durante o teste
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When
      const response = await request(app)
        .get(`/chapters/${mangaId}`);

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro desconhecido' });
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar capítulos:', mockError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('GET /chapters/:chapterID/pages - getPages', () => {
    const chapterId = 'chapter123';
    const mockPagesResponse = {
      pages: [
        {
          id: 'page1',
          number: 1,
          imageUrl: 'https://example.com/page1.jpg',
          chapterId: chapterId
        },
        {
          id: 'page2',
          number: 2,
          imageUrl: 'https://example.com/page2.jpg',
          chapterId: chapterId
        }
      ],
      total: 2
    };

    it('deve buscar páginas do capítulo com sucesso', async () => {
      // Given
      mockedChapterHandlers.getChapterPages.mockResolvedValue(mockPagesResponse as any);

      // When
      const response = await request(app)
        .get(`/chapters/${chapterId}/pages`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPagesResponse);
      expect(mockedChapterHandlers.getChapterPages).toHaveBeenCalledWith(chapterId);
    });

    it('deve lidar com erro do handler', async () => {
      // Given
      const mockError = new Error('Capítulo não encontrado');
      mockedChapterHandlers.getChapterPages.mockRejectedValue(mockError);
      
      // Mock console.error para evitar logs durante o teste
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When
      const response = await request(app)
        .get(`/chapters/${chapterId}/pages`);

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Capítulo não encontrado' });
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar páginas:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('deve lidar com erro desconhecido', async () => {
      // Given
      const mockError = { message: 'Erro customizado' };
      mockedChapterHandlers.getChapterPages.mockRejectedValue(mockError);
      
      // Mock console.error para evitar logs durante o teste
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When
      const response = await request(app)
        .get(`/chapters/${chapterId}/pages`);

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro desconhecido' });
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar páginas:', mockError);
      
      consoleSpy.mockRestore();
    });

    it('deve lidar com chapterID vazio', async () => {
      // Given
      mockedChapterHandlers.getChapterPages.mockResolvedValue(mockPagesResponse as any);

      // When
      const response = await request(app)
        .get('/chapters//pages');

      // Then
      expect(response.status).toBe(404); // Express retorna 404 para rota malformada
    });
  });
});