import request from 'supertest';
import express from 'express';
import * as libraryController from '../index';
import * as libraryHandlers from '../../../handlers/library';
import { getPaginationParams } from '../../../utils/pagination';
import { handleZodError } from '../../../utils/zodError';
import { ZodError } from 'zod';

// Mock dos handlers
jest.mock('@/handlers/library');
jest.mock('@/utils/pagination');
jest.mock('@/utils/zodError');

const mockedLibraryHandlers = libraryHandlers as jest.Mocked<typeof libraryHandlers>;
const mockedGetPaginationParams = getPaginationParams as jest.MockedFunction<typeof getPaginationParams>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Mock middleware de autenticação
app.use((req, res, next) => {
  (req as any).user = { id: 'test-user-id' };
  next();
});

// Rotas de teste
app.post('/library/upsert', libraryController.upsertLibraryEntry);
app.put('/library/update', libraryController.updateLibraryEntry);
app.delete('/library/:mangaId', libraryController.removeLibraryEntry);
app.get('/library/:type', libraryController.listLibrary);
app.post('/library/toggle/:mangaId/:type', libraryController.toggleLibraryEntry);
app.get('/library/status/:mangaId', libraryController.checkMangaStatus);

describe('Controlador da Biblioteca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertLibraryEntry', () => {
    it('deve criar ou atualizar entrada da biblioteca com sucesso', async () => {
      // Dado
      const requestBody = {
        mangaId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        isRead: true,
        isLiked: false
      };
      
      const mockEntry = {
        id: 'entry-id',
        userId: 'test-user-id',
        mangaId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        isRead: true,
        isLiked: false,
        isFollowed: false,
        isComplete: false
      };
      
      mockedLibraryHandlers.upsertLibraryEntry.mockResolvedValue(mockEntry as any);

      // Quando
      const response = await request(app)
        .post('/library/upsert')
        .send(requestBody);

      // Então
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEntry);
      expect(mockedLibraryHandlers.upsertLibraryEntry).toHaveBeenCalledWith({
        userId: 'test-user-id',
        ...requestBody
      });
    });

    it('deve lidar com erros de validação', async () => {
      // Dado
      const invalidBody = { invalidField: 'invalid' };
      const zodError = new Error('Validation error');
      
      mockedHandleZodError.mockImplementation((err: any, res: any) => {
        return res.status(400).json({ error: 'Validation failed' });
      });

      // Quando
      const response = await request(app)
        .post('/library/upsert')
        .send(invalidBody);

      // Então
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('updateLibraryEntry', () => {
    it('deve atualizar entrada da biblioteca com sucesso', async () => {
      // Dado
      const requestBody = {
        mangaId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        isRead: true
      };
      
      const mockUpdatedEntry = {
        id: 'entry-id',
        userId: 'test-user-id',
        mangaId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        isRead: true
      };
      
      mockedLibraryHandlers.updateLibraryEntry.mockResolvedValue(mockUpdatedEntry as any);

      // Quando
      const response = await request(app)
        .put('/library/update')
        .send(requestBody);

      // Então
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedEntry);
      expect(mockedLibraryHandlers.updateLibraryEntry).toHaveBeenCalledWith({
        userId: 'test-user-id',
        ...requestBody
      });
    });

    it('deve lidar com erros de atualização', async () => {
      // Dado
      const requestBody = { mangaId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', isRead: true };
      const error = new Error('Falha na atualização');
      
      mockedLibraryHandlers.updateLibraryEntry.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err: any, res: any) => {
        return res.status(500).json({ error: 'Update failed' });
      });

      // Quando
      const response = await request(app)
        .put('/library/update')
        .send(requestBody);

      // Então
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('removeLibraryEntry', () => {
    it('deve remover entrada da biblioteca com sucesso', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      
      mockedLibraryHandlers.removeLibraryEntry.mockResolvedValue(undefined);

      // Quando
      const response = await request(app)
        .delete(`/library/${mangaId}`);

      // Então
      expect(response.status).toBe(204);
      expect(mockedLibraryHandlers.removeLibraryEntry).toHaveBeenCalledWith(
        'test-user-id',
        mangaId
      );
    });

    it('deve lidar com erros de remoção', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const error = new Error('Falha na remoção');
      
      mockedLibraryHandlers.removeLibraryEntry.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err: any, res: any) => {
        return res.status(500).json({ error: 'Removal failed' });
      });

      // Quando
      const response = await request(app)
        .delete(`/library/${mangaId}`);

      // Então
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('listLibrary', () => {
    beforeEach(() => {
      mockedGetPaginationParams.mockReturnValue({ page: 1, take: 10, skip: 0 });
    });

    it('deve listar entradas da biblioteca com sucesso', async () => {
      // Dado
      const type = 'progress';
      const mockResult = {
        data: [
          {
            id: 'entry-1',
            userId: 'test-user-id',
            mangaId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            manga: {
              id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              title: 'Test Manga',
              cover: 'cover-url'
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
      
      mockedLibraryHandlers.listLibrary.mockResolvedValue(mockResult as any);

      // Quando
      const response = await request(app)
        .get(`/library/${type}`);

      // Então
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(mockedLibraryHandlers.listLibrary).toHaveBeenCalledWith(
        'test-user-id',
        type,
        1,
        10
      );
    });

    it('should handle different library types', async () => {
      // Given
      const types = ['progress', 'complete', 'favorite', 'following'];
      
      mockedLibraryHandlers.listLibrary.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0, next: null, prev: null }
      } as any);

      // When & Then
      for (const type of types) {
        const response = await request(app).get(`/library/${type}`);
        
        expect(response.status).toBe(200);
        expect(mockedLibraryHandlers.listLibrary).toHaveBeenCalledWith(
          'test-user-id',
          type,
          1,
          10
        );
      }
    });

    it('deve lidar com erros de listagem', async () => {
      // Dado
      const type = 'invalid';
      const error = new Error('Tipo inválido');
      
      mockedLibraryHandlers.listLibrary.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err: any, res: any) => {
        return res.status(400).json({ error: 'Invalid type' });
      });

      // Quando
      const response = await request(app)
        .get(`/library/${type}`);

      // Então
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('toggleLibraryEntry', () => {
    it('deve alternar entrada da biblioteca com sucesso', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const type = 'progress';
      
      const mockResult = {
        id: 'entry-id',
        userId: 'test-user-id',
        mangaId,
        isRead: true,
        isLiked: false,
        isFollowed: false,
        isComplete: false
      };
      
      mockedLibraryHandlers.toggleLibraryEntry.mockResolvedValue(mockResult as any);

      // Quando
      const response = await request(app)
        .post(`/library/toggle/${mangaId}/${type}`);

      // Então
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(mockedLibraryHandlers.toggleLibraryEntry).toHaveBeenCalledWith({
        userId: 'test-user-id',
        mangaId,
        type
      });
    });

    it('deve lidar com diferentes tipos de alternância', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const types = ['progress', 'complete', 'favorite', 'following'];
      
      mockedLibraryHandlers.toggleLibraryEntry.mockResolvedValue({} as any);

      // Quando & Então
      for (const type of types) {
        const response = await request(app)
          .post(`/library/toggle/${mangaId}/${type}`);
        
        expect(response.status).toBe(200);
        expect(mockedLibraryHandlers.toggleLibraryEntry).toHaveBeenCalledWith({
          userId: 'test-user-id',
          mangaId,
          type
        });
      }
    });

    it('deve lidar com tipo de alternância inválido', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const invalidType = 'invalid';
      
      mockedHandleZodError.mockImplementation((err: any, res: any) => {
        return res.status(400).json({ error: 'Invalid type' });
      });

      // Quando
      const response = await request(app)
        .post(`/library/toggle/${mangaId}/${invalidType}`);

      // Então
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });

    it('deve lidar com diferentes tipos de alternância', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const type = 'progress';
      const error = new Error('Falha na alternância');
      
      mockedLibraryHandlers.toggleLibraryEntry.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err: any, res: any) => {
        return res.status(500).json({ error: 'Toggle failed' });
      });

      // Quando
      const response = await request(app)
        .post(`/library/toggle/${mangaId}/${type}`);

      // Então
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('checkMangaStatus', () => {
    it('deve verificar status do mangá com sucesso', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      
      const mockStatus = {
        isRead: true,
        isLiked: false,
        isFollowed: true,
        isComplete: false
      };
      
      mockedLibraryHandlers.checkMangaStatus.mockResolvedValue(mockStatus);

      // Quando
      const response = await request(app)
        .get(`/library/status/${mangaId}`);

      // Então
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(mockedLibraryHandlers.checkMangaStatus).toHaveBeenCalledWith(
        'test-user-id',
        mangaId
      );
    });

    it('deve lidar com erros de verificação de status', async () => {
      // Dado
      const mangaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const error = new Error('Falha na verificação de status');
      
      mockedLibraryHandlers.checkMangaStatus.mockRejectedValue(error);
      mockedHandleZodError.mockImplementation((err: any, res: any) => {
        return res.status(500).json({ error: 'Status check failed' });
      });

      // Quando
      const response = await request(app)
        .get(`/library/status/${mangaId}`);

      // Então
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });
});