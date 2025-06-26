import request from 'supertest';
import express from 'express';
import * as wallpaperController from '../index';
import * as wallpaperHandlers from '../../../handlers/wallpapers';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('@/handlers/wallpapers');
jest.mock('@/utils/zodError');

const mockedWallpaperHandlers = wallpaperHandlers as jest.Mocked<typeof wallpaperHandlers>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Rotas para teste
app.get('/wallpapers', wallpaperController.getWallpapers);
app.get('/wallpapers/:id', wallpaperController.getWallpaperById);
app.post('/wallpapers', wallpaperController.createWallpaper);
app.put('/wallpapers/:id', wallpaperController.updateWallpaper);
app.delete('/wallpapers/:id', wallpaperController.deleteWallpaper);
app.post('/wallpapers/import', wallpaperController.importWallpapers);
app.post('/wallpapers/:id/toggle-image', wallpaperController.toggleWallpaperImage);
app.post('/wallpapers/import-pinterest', wallpaperController.importPinterestWallpaper);

describe('Controlador de Wallpapers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /wallpapers', () => {
    const mockWallpapersResponse = {
      data: [
        {
          id: 'wallpaper-1',
          name: 'Wallpaper 1',
          cover: 'cover1.jpg',
          createdAt: "2025-06-26T17:19:07.116Z",
          updatedAt: "2025-06-26T17:19:07.116Z",
          totalImages: 5,
          _count: {
            images: 5,
          },
        },
        {
          id: 'wallpaper-2',
          name: 'Wallpaper 2',
          cover: 'cover2.jpg',
          createdAt: "2025-06-26T17:19:07.116Z",
          updatedAt: "2025-06-26T17:19:07.116Z",
          totalImages: 3,
          _count: {
            images: 3,
          },
        },
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        next: false,
        prev: false,
      },
    } as any;

    it('deve retornar wallpapers com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.getWallpapers.mockResolvedValue(mockWallpapersResponse);

      // When
      const response = await request(app)
        .get('/wallpapers')
        .expect(200);

      // Then
      expect(response.body).toEqual(mockWallpapersResponse);
      expect(mockedWallpaperHandlers.getWallpapers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {},
        })
      );
    });

    it('deve lidar com erros ao buscar wallpapers', async () => {
      // Given
      const error = new Error('Database error');
      mockedWallpaperHandlers.getWallpapers.mockRejectedValue(error);

      // When
      const response = await request(app)
        .get('/wallpapers')
        .expect(500);

      // Then
      expect(response.body).toEqual({ error: 'Database error' });
    });

    it('should handle non-Error exceptions', async () => {
      // Given
      mockedWallpaperHandlers.getWallpapers.mockRejectedValue('String error');

      // When
      const response = await request(app)
        .get('/wallpapers')
        .expect(500);

      // Then
      expect(response.body).toEqual({ error: 'Erro interno ao buscar wallpapers' });
    });
  });

  describe('GET /wallpapers/:id', () => {
    const mockWallpaper = {
      data: {
        id: 'wallpaper-1',
        name: 'Test Wallpaper',
        cover: 'https://example.com/cover.jpg',
        createdAt: "2025-06-26T17:19:07.116Z",
        updatedAt: "2025-06-26T17:19:07.116Z",
        images: [],
        totalImages: 0,
        _count: {
          images: 0,
        },
      },
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
        next: false,
        prev: false,
      },
    } as any;

    it('deve retornar um wallpaper por ID com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.getWallpaperById.mockResolvedValue(mockWallpaper);

      // When
      const response = await request(app)
        .get('/wallpapers/wallpaper-1')
        .expect(200);

      // Then
      expect(response.body).toEqual(mockWallpaper);
      expect(mockedWallpaperHandlers.getWallpaperById).toHaveBeenCalledWith(
        'wallpaper-1',
        expect.objectContaining({
          params: { id: 'wallpaper-1' },
        })
      );
    });

    it('deve retornar 404 quando wallpaper não for encontrado', async () => {
      // Given
      const error = new Error('Wallpaper não encontrado');
      mockedWallpaperHandlers.getWallpaperById.mockRejectedValue(error);

      // When
      const response = await request(app)
        .get('/wallpapers/non-existent')
        .expect(404);

      // Then
      expect(response.body).toEqual({ error: 'Wallpaper não encontrado' });
    });

    it('deve lidar com erros de validação ao buscar wallpaper por ID', async () => {
      // Given
      const validationError = new Error('Validation error');
      mockedWallpaperHandlers.getWallpaperById.mockRejectedValue(validationError);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ error: 'Validation failed' });
      });

      // When
      const response = await request(app)
        .get('/wallpapers/invalid-id')
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: 'Validation failed' });
      expect(mockedHandleZodError).toHaveBeenCalledWith(validationError, expect.any(Object));
    });
  });

  describe('POST /wallpapers', () => {
    const validWallpaperData = {
      name: 'New Wallpaper',
      cover: 'https://example.com/cover.jpg',
      images: [
        { url: 'https://example.com/image1.jpg' },
      ],
    };

    const mockCreatedWallpaper = {
      id: 'wallpaper-1',
      ...validWallpaperData,
      createdAt: "2025-06-26T17:19:07.116Z",
      updatedAt: "2025-06-26T17:19:07.116Z",
      images: [
        {
          id: 'img-1',
          url: 'https://example.com/image1.jpg',
          wallpaperId: 'wallpaper-1',
        },
      ],
    } as any;

    it('deve criar um wallpaper com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.createWallpaper.mockResolvedValue(mockCreatedWallpaper);

      // When
      const response = await request(app)
        .post('/wallpapers')
        .send(validWallpaperData)
        .expect(201);

      // Then
      expect(response.body).toEqual(mockCreatedWallpaper);
      expect(mockedWallpaperHandlers.createWallpaper).toHaveBeenCalledWith(validWallpaperData);
    });

    it('deve lidar com erros de validação ao criar wallpaper', async () => {
      // Given
      const validationError = new Error('Validation error');
      mockedWallpaperHandlers.createWallpaper.mockRejectedValue(validationError);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ error: 'Invalid data' });
      });

      // When
      const response = await request(app)
        .post('/wallpapers')
        .send({})
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: 'Invalid data' });
      expect(mockedHandleZodError).toHaveBeenCalledWith(validationError, expect.any(Object));
    });
  });

  describe('PUT /wallpapers/:id', () => {
    const updateData = {
      name: 'Updated Wallpaper',
      cover: 'https://example.com/new-cover.jpg',
    };

    const mockUpdatedWallpaper = {
      id: 'wallpaper-1',
      ...updateData,
      createdAt: "2025-06-26T17:19:07.116Z",
      updatedAt: "2025-06-26T17:19:07.116Z",
      images: [
        {
          id: 'img-1',
          url: 'https://example.com/new-image.jpg',
          wallpaperId: 'wallpaper-1',
        },
      ],
    } as any;

    it('deve atualizar um wallpaper com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.updateWallpaper.mockResolvedValue(mockUpdatedWallpaper);

      // When
      const response = await request(app)
        .put('/wallpapers/wallpaper-1')
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body).toEqual(mockUpdatedWallpaper);
      expect(mockedWallpaperHandlers.updateWallpaper).toHaveBeenCalledWith(
        'wallpaper-1',
        updateData
      );
    });

    it('deve lidar com erros de validação', async () => {
      // Given
      const validationError = new Error('Validation error');
      mockedWallpaperHandlers.updateWallpaper.mockRejectedValue(validationError);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ error: 'Invalid update data' });
      });

      // When
      const response = await request(app)
        .put('/wallpapers/wallpaper-1')
        .send({})
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: 'Invalid update data' });
      expect(mockedHandleZodError).toHaveBeenCalledWith(validationError, expect.any(Object));
    });
  });

  describe('DELETE /wallpapers/:id', () => {
    it('deve deletar um wallpaper com sucesso', async () => {
      // Given
      mockedWallpaperHandlers.deleteWallpaper.mockResolvedValue({
        message: 'Wallpaper deletado com sucesso',
      });

      // When
      const response = await request(app)
        .delete('/wallpapers/wallpaper-1')
        .expect(204);

      // Then
      expect(response.body).toEqual({});
      expect(mockedWallpaperHandlers.deleteWallpaper).toHaveBeenCalledWith('wallpaper-1');
    });

    it('deve lidar com erros ao deletar wallpaper', async () => {
      // Given
      const deletionError = new Error('Deletion failed');
      mockedWallpaperHandlers.deleteWallpaper.mockRejectedValue(deletionError);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(500).json({ error: 'Failed to delete' });
      });

      // When
      const response = await request(app)
        .delete('/wallpapers/wallpaper-1')
        .expect(500);

      // Then
      expect(response.body).toEqual({ error: 'Failed to delete' });
      expect(mockedHandleZodError).toHaveBeenCalledWith(deletionError, expect.any(Object));
    });
  });

  describe('POST /wallpapers/import', () => {
    it('deve importar wallpapers com sucesso', async () => {
      // Given
      const mockImportResult = {
        success: true,
        message: 'Importação concluída com sucesso',
      };
      mockedWallpaperHandlers.importFromJson.mockResolvedValue(mockImportResult);

      // When
      const response = await request(app)
        .post('/wallpapers/import')
        .expect(200);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Importação concluída com sucesso');
      expect(mockedWallpaperHandlers.importFromJson).toHaveBeenCalled();
    });

    it('deve lidar com erros de importação', async () => {
      // Given
      const importError = new Error('Import failed');
      mockedWallpaperHandlers.importFromJson.mockRejectedValue(importError);

      // When
      const response = await request(app)
        .post('/wallpapers/import')
        .expect(500);

      // Then
      expect(response.body).toEqual({ error: 'Erro ao importar wallpapers' });
    });
  });

  describe('POST /wallpapers/:id/toggle-image', () => {
    const imageData = {
      image: 'https://example.com/image.jpg',
    };

    it('deve alternar imagem com sucesso', async () => {
      // Given
      const mockToggleResult = {
        action: 'added',
        message: 'Imagem adicionada com sucesso',
      };
      mockedWallpaperHandlers.toggleWallpaperImage.mockResolvedValue(mockToggleResult);

      // When
      const response = await request(app)
        .post('/wallpapers/wallpaper-1/toggle-image')
        .send(imageData)
        .expect(200);

      // Then
      expect(response.body).toEqual(mockToggleResult);
      expect(mockedWallpaperHandlers.toggleWallpaperImage).toHaveBeenCalledWith(
        'wallpaper-1',
        'https://example.com/image.jpg'
      );
    });

    it('deve retornar 400 quando URL da imagem estiver ausente', async () => {
      // When
      const response = await request(app)
        .post('/wallpapers/wallpaper-1/toggle-image')
        .send({})
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: 'URL da imagem é obrigatória' });
    });

    it('should return 404 when wallpaper not found', async () => {
      // Given
      const error = new Error('Wallpaper não encontrado');
      mockedWallpaperHandlers.toggleWallpaperImage.mockRejectedValue(error);

      // When
      const response = await request(app)
        .post('/wallpapers/non-existent/toggle-image')
        .send(imageData)
        .expect(404);

      // Then
      expect(response.body).toEqual({ error: 'Wallpaper não encontrado' });
    });

    it('should handle validation errors', async () => {
      // Given
      const validationError = new Error('Validation error');
      mockedWallpaperHandlers.toggleWallpaperImage.mockRejectedValue(validationError);
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ error: 'Invalid image URL' });
      });

      // When
      const response = await request(app)
        .post('/wallpapers/wallpaper-1/toggle-image')
        .send(imageData)
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: 'Invalid image URL' });
      expect(mockedHandleZodError).toHaveBeenCalledWith(validationError, expect.any(Object));
    });
  });

  describe('POST /wallpapers/import-pinterest', () => {
    const pinterestData = {
      pinterestUrl: 'https://pinterest.com/user/board/',
    };

    it('deve importar do Pinterest com sucesso', async () => {
      // Given
      const mockImportResult = {
        success: true,
        message: 'Wallpaper criado com sucesso com 5 imagens',
        wallpaper: {
          id: 'wallpaper-1',
          name: 'Importado do Pinterest - board',
          cover: 'https://example.com/cover.jpg',
          createdAt: new Date('2025-06-26T17:13:31.090Z'),
          updatedAt: new Date('2025-06-26T17:13:31.090Z'),
          images: [
            {
              id: 'img-1',
              url: 'https://example.com/image1.jpg',
              wallpaperId: 'wallpaper-1',
            },
          ],
        },
      };
      mockedWallpaperHandlers.importFromPinterest.mockResolvedValue(mockImportResult);

      // When
      const response = await request(app)
        .post('/wallpapers/import-pinterest')
        .send(pinterestData)
        .expect(200);

      // Then
      expect(response.body.wallpaper.id).toBe(mockImportResult.wallpaper.id);
      expect(response.body.wallpaper.name).toBe(mockImportResult.wallpaper.name);
      expect(response.body.wallpaper.cover).toBe(mockImportResult.wallpaper.cover);
      expect(response.body.wallpaper.images).toEqual(mockImportResult.wallpaper.images);
      expect(mockedWallpaperHandlers.importFromPinterest).toHaveBeenCalledWith(
        'https://pinterest.com/user/board/'
      );
    });

    it('deve retornar 400 quando URL do Pinterest estiver ausente', async () => {
      // When
      const response = await request(app)
        .post('/wallpapers/import-pinterest')
        .send({})
        .expect(400);

      // Then
      expect(response.body).toEqual({
        success: false,
        message: 'URL do Pinterest é obrigatória',
      });
    });

    it('deve lidar com erros de importação do Pinterest', async () => {
      // Given
      const importError = new Error('Pinterest API error');
      mockedWallpaperHandlers.importFromPinterest.mockRejectedValue(importError);

      // When
      const response = await request(app)
        .post('/wallpapers/import-pinterest')
        .send(pinterestData)
        .expect(500);

      // Then
      expect(response.body).toEqual({
        success: false,
        message: 'Pinterest API error',
      });
    });

    it('deve lidar com erros sem propriedade message', async () => {
      // Given
      mockedWallpaperHandlers.importFromPinterest.mockRejectedValue('String error');

      // When
      const response = await request(app)
        .post('/wallpapers/import-pinterest')
        .send(pinterestData)
        .expect(500);

      // Then
      expect(response.body).toEqual({
        success: false,
        message: 'Erro ao importar wallpaper do Pinterest',
      });
    });
  });
});