import request from 'supertest';
import express from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('../handlers/WallpaperHandler', () => ({
    getWallpapers: jest.fn(),
    getWallpaperById: jest.fn(),
    createWallpaper: jest.fn(),
    updateWallpaper: jest.fn(),
    deleteWallpaper: jest.fn(),
    importFromJson: jest.fn(),
    toggleWallpaperImage: jest.fn(),
    importFromPinterest: jest.fn()
}));

jest.mock('@/utils/zodError');

const mockedWallpaperHandlers = require('../handlers/WallpaperHandler');
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

import * as wallpaperController from '../controllers/WallpaperControllers';

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Middleware para simular usuário autenticado (admin)
app.use((req, res, next) => {
  (req as any).user = { id: 'user-123', role: 'admin' };
  next();
});

// Rotas para teste
app.get('/wallpapers', wallpaperController.getWallpapers);
app.get('/wallpapers/:id', wallpaperController.getWallpaperById);
app.post('/admin/wallpapers', wallpaperController.createWallpaper);
app.put('/admin/wallpapers/:id', wallpaperController.updateWallpaper);
app.delete('/admin/wallpapers/:id', wallpaperController.deleteWallpaper);
app.post('/admin/wallpapers/import', wallpaperController.importWallpapers);
app.post('/admin/wallpapers/:id/toggle', wallpaperController.toggleWallpaperImage);
app.post('/admin/wallpapers/import-pinterest', wallpaperController.importPinterestWallpaper);

describe('Wallpaper Controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /wallpapers - getWallpapers', () => {
    const mockWallpapersResponse = {
      data: [
        {
          id: 'wallpaper-1',
          name: 'Anime Action',
          cover: 'https://example.com/cover1.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          totalImages: 5
        },
        {
          id: 'wallpaper-2',
          name: 'Anime Adventure',
          cover: 'https://example.com/cover2.jpg',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          totalImages: 3
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

    it('deve retornar lista de wallpapers com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.getWallpapers.mockResolvedValue(mockWallpapersResponse);

      // When
      const response = await request(app)
        .get('/wallpapers');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWallpapersResponse);
      expect(mockedWallpaperHandlers.getWallpapers).toHaveBeenCalledWith(expect.any(Object));
    });

    it('deve retornar erro 500 quando handler lança Error', async () => {
      // Given
      const errorMessage = 'Erro ao buscar wallpapers';
      mockedWallpaperHandlers.getWallpapers.mockRejectedValue(new Error(errorMessage));

      // When
      const response = await request(app)
        .get('/wallpapers');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: errorMessage });
    });

    it('deve retornar erro 500 genérico para outros tipos de erro', async () => {
      // Given
      mockedWallpaperHandlers.getWallpapers.mockRejectedValue('Erro desconhecido');

      // When
      const response = await request(app)
        .get('/wallpapers');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno ao buscar wallpapers' });
    });
  });

  describe('GET /wallpapers/:id - getWallpaperById', () => {
    const wallpaperId = 'wallpaper-123';
    const mockWallpaperResponse = {
      data: {
        id: wallpaperId,
        name: 'Anime Action',
        cover: 'https://example.com/cover.jpg',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        images: [
          {
            id: 'image-1',
            url: 'https://example.com/image1.jpg',
            wallpaperId: wallpaperId
          }
        ]
      },
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        next: false,
        prev: false
      }
    };

    it('deve retornar wallpaper específico com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.getWallpaperById.mockResolvedValue(mockWallpaperResponse);

      // When
      const response = await request(app)
        .get(`/wallpapers/${wallpaperId}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWallpaperResponse);
      expect(mockedWallpaperHandlers.getWallpaperById).toHaveBeenCalledWith(wallpaperId, expect.any(Object));
    });

    it('deve retornar erro 404 quando wallpaper não encontrado', async () => {
      // Given
      const errorMessage = 'Wallpaper não encontrado';
      mockedWallpaperHandlers.getWallpaperById.mockRejectedValue(new Error(errorMessage));

      // When
      const response = await request(app)
        .get(`/wallpapers/${wallpaperId}`);

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: errorMessage });
    });

    it('deve chamar handleZodError para outros tipos de erro', async () => {
      // Given
      const zodError = new Error('Validation error');
      mockedWallpaperHandlers.getWallpaperById.mockRejectedValue(zodError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Dados inválidos' });
      });

      // When
      const response = await request(app)
        .get(`/wallpapers/${wallpaperId}`);

      // Then
      expect(mockedHandleZodError).toHaveBeenCalledWith(zodError, expect.any(Object));
    });
  });

  describe('POST /admin/wallpapers - createWallpaper', () => {
    const mockWallpaperData = {
      name: 'Novo Wallpaper',
      cover: 'https://example.com/cover.jpg',
      images: [
        { url: 'https://example.com/image1.jpg' },
        { url: 'https://example.com/image2.jpg' }
      ]
    };

    const mockCreatedWallpaper = {
      id: 'new-wallpaper-123',
      name: 'Novo Wallpaper',
      cover: 'https://example.com/cover.jpg',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      images: [
        {
          id: 'image-1',
          url: 'https://example.com/image1.jpg',
          wallpaperId: 'new-wallpaper-123'
        },
        {
          id: 'image-2',
          url: 'https://example.com/image2.jpg',
          wallpaperId: 'new-wallpaper-123'
        }
      ]
    };

    it('deve criar wallpaper com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.createWallpaper.mockResolvedValue(mockCreatedWallpaper);

      // When
      const response = await request(app)
        .post('/admin/wallpapers')
        .send(mockWallpaperData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedWallpaper);
      expect(mockedWallpaperHandlers.createWallpaper).toHaveBeenCalledWith(mockWallpaperData);
    });

    it('deve retornar erro de validação', async () => {
      // Given
      const validationError = new Error('Nome é obrigatório');
      mockedWallpaperHandlers.createWallpaper.mockRejectedValue(validationError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      });

      // When
      const response = await request(app)
        .post('/admin/wallpapers')
        .send({ cover: 'invalid-data' });

      // Then
      expect(mockedHandleZodError).toHaveBeenCalledWith(validationError, expect.any(Object));
    });
  });

  describe('PUT /admin/wallpapers/:id - updateWallpaper', () => {
    const wallpaperId = 'wallpaper-123';
    const mockUpdateData = {
      name: 'Wallpaper Atualizado',
      cover: 'https://example.com/new-cover.jpg',
      images: [
        { url: 'https://example.com/new-image.jpg' }
      ]
    };

    const mockUpdatedWallpaper = {
      id: wallpaperId,
      name: 'Wallpaper Atualizado',
      cover: 'https://example.com/new-cover.jpg',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      images: [
        {
          id: 'image-new',
          url: 'https://example.com/new-image.jpg',
          wallpaperId: wallpaperId
        }
      ]
    };

    it('deve atualizar wallpaper com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.updateWallpaper.mockResolvedValue(mockUpdatedWallpaper);

      // When
      const response = await request(app)
        .put(`/admin/wallpapers/${wallpaperId}`)
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedWallpaper);
      expect(mockedWallpaperHandlers.updateWallpaper).toHaveBeenCalledWith(wallpaperId, mockUpdateData);
    });

    it('deve retornar erro de validação', async () => {
      // Given
      const validationError = new Error('Dados inválidos');
      mockedWallpaperHandlers.updateWallpaper.mockRejectedValue(validationError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Dados inválidos' });
      });

      // When
      const response = await request(app)
        .put(`/admin/wallpapers/${wallpaperId}`)
        .send({ name: '' });

      // Then
      expect(mockedHandleZodError).toHaveBeenCalledWith(validationError, expect.any(Object));
    });
  });

  describe('DELETE /admin/wallpapers/:id - deleteWallpaper', () => {
    const wallpaperId = 'wallpaper-123';

    it('deve deletar wallpaper com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.deleteWallpaper.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .delete(`/admin/wallpapers/${wallpaperId}`);

      // Then
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(mockedWallpaperHandlers.deleteWallpaper).toHaveBeenCalledWith(wallpaperId);
    });

    it('deve retornar erro quando falha ao deletar', async () => {
      // Given
      const deleteError = new Error('Erro ao deletar');
      mockedWallpaperHandlers.deleteWallpaper.mockRejectedValue(deleteError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Erro ao deletar' });
      });

      // When
      const response = await request(app)
        .delete(`/admin/wallpapers/${wallpaperId}`);

      // Then
      expect(mockedHandleZodError).toHaveBeenCalledWith(deleteError, expect.any(Object));
    });
  });

  describe('POST /admin/wallpapers/import - importWallpapers', () => {
    const mockImportResult = {
      success: true,
      message: 'Wallpapers importados com sucesso',
      count: 5
    };

    it('deve importar wallpapers do JSON com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.importFromJson.mockResolvedValue(mockImportResult);

      // When
      const response = await request(app)
        .post('/admin/wallpapers/import');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockImportResult);
      expect(mockedWallpaperHandlers.importFromJson).toHaveBeenCalled();
    });

    it('deve retornar erro 500 quando falha na importação', async () => {
      // Given
      const importError = new Error('Erro ao ler arquivo');
      mockedWallpaperHandlers.importFromJson.mockRejectedValue(importError);

      // When
      const response = await request(app)
        .post('/admin/wallpapers/import');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro ao importar wallpapers' });
    });
  });

  describe('POST /admin/wallpapers/:id/toggle - toggleWallpaperImage', () => {
    const wallpaperId = 'wallpaper-123';
    const imageUrl = 'https://example.com/image.jpg';

    const mockToggleResult = {
      id: wallpaperId,
      name: 'Wallpaper Test',
      cover: 'https://example.com/cover.jpg',
      images: [
        {
          id: 'image-1',
          url: imageUrl,
          wallpaperId: wallpaperId
        }
      ]
    };

    it('deve fazer toggle da imagem com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.toggleWallpaperImage.mockResolvedValue(mockToggleResult);

      // When
      const response = await request(app)
        .post(`/admin/wallpapers/${wallpaperId}/toggle`)
        .send({ image: imageUrl });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockToggleResult);
      expect(mockedWallpaperHandlers.toggleWallpaperImage).toHaveBeenCalledWith(wallpaperId, imageUrl);
    });

    it('deve retornar erro 400 quando URL da imagem não fornecida', async () => {
      // When
      const response = await request(app)
        .post(`/admin/wallpapers/${wallpaperId}/toggle`)
        .send({});

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'URL da imagem é obrigatória' });
      expect(mockedWallpaperHandlers.toggleWallpaperImage).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando wallpaper não encontrado', async () => {
      // Given
      const notFoundError = new Error('Wallpaper não encontrado');
      mockedWallpaperHandlers.toggleWallpaperImage.mockRejectedValue(notFoundError);

      // When
      const response = await request(app)
        .post(`/admin/wallpapers/${wallpaperId}/toggle`)
        .send({ image: imageUrl });

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Wallpaper não encontrado' });
    });

    it('deve chamar handleZodError para outros tipos de erro', async () => {
      // Given
      const otherError = new Error('Outro erro');
      mockedWallpaperHandlers.toggleWallpaperImage.mockRejectedValue(otherError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Erro de validação' });
      });

      // When
      const response = await request(app)
        .post(`/admin/wallpapers/${wallpaperId}/toggle`)
        .send({ image: imageUrl });

      // Then
      expect(mockedHandleZodError).toHaveBeenCalledWith(otherError, expect.any(Object));
    });
  });

  describe('POST /admin/wallpapers/import-pinterest - importPinterestWallpaper', () => {
    const pinterestUrl = 'https://pinterest.com/pin/123456789/';

    const mockPinterestImportResult = {
      success: true,
      message: 'Wallpaper importado do Pinterest com sucesso',
      wallpaper: {
        id: 'pinterest-wallpaper-123',
        name: 'Pinterest Wallpaper',
        cover: 'https://pinterest.com/image.jpg'
      }
    };

    it('deve importar wallpaper do Pinterest com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.importFromPinterest.mockResolvedValue(mockPinterestImportResult);

      // When
      const response = await request(app)
        .post('/admin/wallpapers/import-pinterest')
        .send({ pinterestUrl });

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPinterestImportResult);
      expect(mockedWallpaperHandlers.importFromPinterest).toHaveBeenCalledWith(pinterestUrl);
    });

    it('deve retornar erro 400 quando URL do Pinterest não fornecida', async () => {
      // When
      const response = await request(app)
        .post('/admin/wallpapers/import-pinterest')
        .send({});

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'URL do Pinterest é obrigatória'
      });
      expect(mockedWallpaperHandlers.importFromPinterest).not.toHaveBeenCalled();
    });

    it('deve retornar erro 500 quando falha na importação do Pinterest', async () => {
      // Given
      const importError = new Error('Erro ao importar do Pinterest');
      mockedWallpaperHandlers.importFromPinterest.mockRejectedValue(importError);

      // When
      const response = await request(app)
        .post('/admin/wallpapers/import-pinterest')
        .send({ pinterestUrl });

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Erro ao importar do Pinterest'
      });
    });

    it('deve retornar mensagem genérica quando erro não tem mensagem', async () => {
      // Given
      mockedWallpaperHandlers.importFromPinterest.mockRejectedValue(new Error());

      // When
      const response = await request(app)
        .post('/admin/wallpapers/import-pinterest')
        .send({ pinterestUrl });

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Erro ao importar wallpaper do Pinterest'
      });
    });
  });
});