import { prismaMock } from '../../../test/mocks/prisma';
import fs from 'fs';
import axios from 'axios';

// Mock das dependências
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));
jest.mock('fs');
jest.mock('axios');

import {
  getWallpapers,
  getWallpaperById,
  createWallpaper,
  updateWallpaper,
  deleteWallpaper,
  toggleWallpaperImage,
  importFromJson,
  importFromPinterest,
} from '../index';

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Wallpapers Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWallpapers', () => {
    const mockWallpapers = [
      {
        id: 'wallpaper-1',
        name: 'Wallpaper 1',
        cover: 'cover1.jpg',
        createdAt: new Date(),
        _count: { images: 5 },
      },
      {
        id: 'wallpaper-2',
        name: 'Wallpaper 2',
        cover: 'cover2.jpg',
        createdAt: new Date(),
        _count: { images: 3 },
      },
    ];

    it('should return paginated wallpapers with default parameters', async () => {
      // Given
      const mockReq = { query: {} } as any;
      prismaMock.wallpaper.findMany.mockResolvedValue(mockWallpapers as any);
      prismaMock.wallpaper.count.mockResolvedValue(2);

      // When
      const result = await getWallpapers(mockReq);

      // Then
      expect(result).toEqual({
        data: [
          { ...mockWallpapers[0], totalImages: 5 },
          { ...mockWallpapers[1], totalImages: 3 },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
          next: false,
          prev: false,
        },
      });

      expect(prismaMock.wallpaper.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { images: true },
          },
        },
      });
    });

    it('should handle custom pagination', async () => {
      // Given
      const mockReq = { query: { page: '2', limit: '5' } } as any;
      prismaMock.wallpaper.findMany.mockResolvedValue([]);
      prismaMock.wallpaper.count.mockResolvedValue(15);

      // When
      const result = await getWallpapers(mockReq);

      // Then
      expect(prismaMock.wallpaper.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { images: true },
          },
        },
      });
      expect(result.pagination).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
        next: true,
        prev: true,
      });
    });

    it('should handle errors gracefully', async () => {
      // Given
      const mockReq = { query: {} } as any;
      const error = new Error('Database error');
      prismaMock.wallpaper.findMany.mockRejectedValue(error);

      // When & Then
      await expect(getWallpapers(mockReq)).rejects.toThrow('Database error');
    });
  });

  describe('getWallpaperById', () => {
    const mockWallpaper = {
      id: 'wallpaper-1',
      name: 'Wallpaper 1',
      cover: 'cover1.jpg',
      images: [
        { id: 'img-1', url: 'image1.jpg' },
        { id: 'img-2', url: 'image2.jpg' },
      ],
      _count: { images: 10 },
    };

    it('should return wallpaper with paginated images', async () => {
      // Given
      const mockReq = { query: {} } as any;
      prismaMock.wallpaper.findUnique.mockResolvedValue(mockWallpaper as any);

      // When
      const result = await getWallpaperById('wallpaper-1', mockReq);

      // Then
      expect(result).toEqual({
        data: {
          ...mockWallpaper,
          totalImages: 10,
        },
        pagination: {
          total: 10,
          page: 1,
          limit: 20,
          totalPages: 1,
          next: false,
          prev: false,
        },
      });

      expect(prismaMock.wallpaper.findUnique).toHaveBeenCalledWith({
        where: { id: 'wallpaper-1' },
        include: {
          images: {
            skip: 0,
            take: 20,
          },
          _count: {
            select: { images: true },
          },
        },
      });
    });

    it('should throw error when wallpaper not found', async () => {
      // Given
      const mockReq = { query: {} } as any;
      prismaMock.wallpaper.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getWallpaperById('non-existent', mockReq)).rejects.toThrow(
        'Wallpaper não encontrado'
      );
    });
  });

  describe('createWallpaper', () => {
    const validWallpaperData = {
      name: 'New Wallpaper',
      cover: 'https://example.com/cover.jpg',
      images: [
        { url: 'https://example.com/image1.jpg' },
        { url: 'https://example.com/image2.jpg' },
      ],
    };

    const mockCreatedWallpaper = {
      id: 'wallpaper-1',
      ...validWallpaperData,
      images: [
        { id: 'img-1', url: 'https://example.com/image1.jpg' },
        { id: 'img-2', url: 'https://example.com/image2.jpg' },
      ],
    };

    it('should create wallpaper with valid data', async () => {
      // Given
      prismaMock.wallpaper.create.mockResolvedValue(mockCreatedWallpaper as any);

      // When
      const result = await createWallpaper(validWallpaperData);

      // Then
      expect(result).toEqual(mockCreatedWallpaper);
      expect(prismaMock.wallpaper.create).toHaveBeenCalledWith({
        data: {
          name: validWallpaperData.name,
          cover: validWallpaperData.cover,
          images: {
            create: [
              { url: 'https://example.com/image1.jpg' },
              { url: 'https://example.com/image2.jpg' },
            ],
          },
        },
        include: { images: true },
      });
    });

    it('should throw validation error for invalid data', async () => {
      // Given
      const invalidData = {
        name: '',
        cover: 'invalid-url',
        images: [],
      };

      // When & Then
      await expect(createWallpaper(invalidData)).rejects.toThrow();
    });
  });

  describe('updateWallpaper', () => {
    const updateData = {
      name: 'Updated Wallpaper',
      cover: 'https://example.com/new-cover.jpg',
      images: [
        { url: 'https://example.com/new-image.jpg' },
      ],
    };

    const mockUpdatedWallpaper = {
      id: 'wallpaper-1',
      ...updateData,
      images: [{ id: 'img-1', url: 'https://example.com/new-image.jpg' }],
    };

    it('should update wallpaper successfully', async () => {
      // Given
      prismaMock.wallpaper.update.mockResolvedValue(mockUpdatedWallpaper as any);

      // When
      const result = await updateWallpaper('wallpaper-1', updateData);

      // Then
      expect(result).toEqual(mockUpdatedWallpaper);
      expect(prismaMock.wallpaper.update).toHaveBeenCalledWith({
        where: { id: 'wallpaper-1' },
        data: {
          name: updateData.name,
          cover: updateData.cover,
          images: {
            deleteMany: {},
            create: [{ url: 'https://example.com/new-image.jpg' }],
          },
        },
        include: { images: true },
      });
    });
  });

  describe('deleteWallpaper', () => {
    it('should delete wallpaper and its images successfully', async () => {
      // Given
      const mockWallpaper = { id: 'wallpaper-1', name: 'Test Wallpaper' };
      prismaMock.wallpaper.findUnique.mockResolvedValue(mockWallpaper as any);
      prismaMock.wallpaperImage.deleteMany.mockResolvedValue({ count: 5 } as any);
      prismaMock.wallpaper.delete.mockResolvedValue(mockWallpaper as any);

      // When
      const result = await deleteWallpaper('wallpaper-1');

      // Then
      expect(result).toEqual({ message: 'Wallpaper deletado com sucesso' });
      expect(prismaMock.wallpaper.findUnique).toHaveBeenCalledWith({
        where: { id: 'wallpaper-1' },
      });
      expect(prismaMock.wallpaperImage.deleteMany).toHaveBeenCalledWith({
        where: { wallpaperId: 'wallpaper-1' },
      });
      expect(prismaMock.wallpaper.delete).toHaveBeenCalledWith({
        where: { id: 'wallpaper-1' },
      });
    });

    it('should throw error when wallpaper not found', async () => {
      // Given
      prismaMock.wallpaper.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(deleteWallpaper('non-existent')).rejects.toThrow(
        'Wallpaper não encontrado'
      );
    });
  });

  describe('toggleWallpaperImage', () => {
    const mockWallpaper = {
      id: 'wallpaper-1',
      name: 'Test Wallpaper',
      images: [
        { id: 'img-1', url: 'https://example.com/existing.jpg' },
      ],
    };

    it('should add new image when it does not exist', async () => {
      // Given
      prismaMock.wallpaper.findUnique.mockResolvedValue(mockWallpaper as any);
      prismaMock.wallpaperImage.create.mockResolvedValue({
        id: 'img-2',
        url: 'https://example.com/new.jpg',
        wallpaperId: 'wallpaper-1',
      } as any);

      // When
      const result = await toggleWallpaperImage(
        'wallpaper-1',
        'https://example.com/new.jpg'
      );

      // Then
      expect(result).toEqual({
        action: 'added',
        message: 'Imagem adicionada com sucesso',
      });
      expect(prismaMock.wallpaperImage.create).toHaveBeenCalledWith({
        data: {
          url: 'https://example.com/new.jpg',
          wallpaperId: 'wallpaper-1',
        },
      });
    });

    it('should remove existing image', async () => {
      // Given
      prismaMock.wallpaper.findUnique.mockResolvedValue(mockWallpaper as any);
      prismaMock.wallpaperImage.delete.mockResolvedValue({
        id: 'img-1',
      } as any);

      // When
      const result = await toggleWallpaperImage(
        'wallpaper-1',
        'https://example.com/existing.jpg'
      );

      // Then
      expect(result).toEqual({
        action: 'removed',
        message: 'Imagem removida com sucesso',
      });
      expect(prismaMock.wallpaperImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-1' },
      });
    });

    it('should throw error when wallpaper not found', async () => {
      // Given
      prismaMock.wallpaper.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(
        toggleWallpaperImage('non-existent', 'https://example.com/image.jpg')
      ).rejects.toThrow('Wallpaper não encontrado');
    });
  });

  describe('importFromJson', () => {
    const mockJsonData = [
      {
        name: 'Imported Wallpaper 1',
        capa: 'https://example.com/cover1.jpg',
        data: JSON.stringify([
          { img: 'https://example.com/img1.jpg' },
          { img: 'https://example.com/img2.jpg' },
        ]),
      },
    ];

    it('should import wallpapers from JSON successfully', async () => {
      // Given
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockJsonData));
      prismaMock.wallpaper.create.mockResolvedValue({
        id: 'wallpaper-1',
        name: 'Imported Wallpaper 1',
      } as any);

      // When
      const result = await importFromJson();

      // Then
      expect(result).toEqual({
        success: true,
        message: 'Importação concluída com sucesso',
      });
      expect(prismaMock.wallpaper.create).toHaveBeenCalledWith({
        data: {
          name: 'Imported Wallpaper 1',
          cover: 'https://example.com/cover1.jpg',
          images: {
            create: [
              { url: 'https://example.com/img1.jpg' },
              { url: 'https://example.com/img2.jpg' },
            ],
          },
        },
      });
    });

    it('should handle file read errors', async () => {
      // Given
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      // When & Then
      await expect(importFromJson()).rejects.toThrow(
        'Erro ao importar dados do JSON: File not found'
      );
    });

    it('should handle wallpaper creation errors', async () => {
      // Given
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockJsonData));
      prismaMock.wallpaper.create.mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(importFromJson()).rejects.toThrow('Database error');
    });
  });

  describe('importFromPinterest', () => {
    const mockPinterestResponse = {
      data: {
        data: {
          pins: [
            {
              images: {
                '564x': { url: 'https://pinterest.com/image1.jpg' },
                '237x': { url: 'https://pinterest.com/image1_small.jpg' },
              },
            },
            {
              images: {
                '236x': { url: 'https://pinterest.com/image2.jpg' },
              },
            },
          ],
        },
      },
    };

    it('should import wallpaper from Pinterest successfully', async () => {
      // Given
      const pinterestUrl = 'https://pinterest.com/user/board/';
      mockedAxios.get.mockResolvedValue(mockPinterestResponse);
      prismaMock.wallpaper.create.mockResolvedValue({
        id: 'wallpaper-1',
        name: 'Importado do Pinterest - board',
        images: [],
      } as any);

      // When
      const result = await importFromPinterest(pinterestUrl);

      // Then
      expect(result.success).toBe(true);
      expect(result.message).toContain('Wallpaper criado com sucesso com 2 imagens');
      expect(prismaMock.wallpaper.create).toHaveBeenCalledWith({
        data: {
          name: 'Importado do Pinterest - board',
          cover: 'https://pinterest.com/image1.jpg',
          images: {
            create: [
              { url: 'https://pinterest.com/image1.jpg' },
              { url: 'https://pinterest.com/image2.jpg' },
            ],
          },
        },
        include: { images: true },
      });
    });

    it('should handle Pinterest API errors', async () => {
      // Given
      const pinterestUrl = 'https://pinterest.com/user/board/';
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      // When & Then
      await expect(importFromPinterest(pinterestUrl)).rejects.toThrow(
        'Erro ao importar do Pinterest: API Error'
      );
    });

    it('should handle invalid Pinterest response format', async () => {
      // Given
      const pinterestUrl = 'https://pinterest.com/user/board/';
      mockedAxios.get.mockResolvedValue({ data: {} });

      // When & Then
      await expect(importFromPinterest(pinterestUrl)).rejects.toThrow(
        'Erro ao importar do Pinterest: Formato de resposta inválido da API do Pinterest'
      );
    });

    it('should handle case when no images are found', async () => {
      // Given
      const pinterestUrl = 'https://pinterest.com/user/board/';
      const emptyPinsResponse = {
        data: {
          data: {
            pins: [
              { images: {} }, // Pin without valid images
              { images: { '100x': { url: null } } }, // Pin with null URL
            ],
          },
        },
      };
      mockedAxios.get.mockResolvedValue(emptyPinsResponse);

      // When & Then
      await expect(importFromPinterest(pinterestUrl)).rejects.toThrow(
        'Erro ao importar do Pinterest: Nenhuma imagem encontrada no board'
      );
    });

    it('should handle pins without images property', async () => {
      // Given
      const pinterestUrl = 'https://pinterest.com/user/board/';
      const pinsWithoutImages = {
        data: {
          data: {
            pins: [
              {}, // Pin without images property
              { images: null }, // Pin with null images
            ],
          },
        },
      };
      mockedAxios.get.mockResolvedValue(pinsWithoutImages);

      // When & Then
      await expect(importFromPinterest(pinterestUrl)).rejects.toThrow(
        'Erro ao importar do Pinterest: Nenhuma imagem encontrada no board'
      );
    });
  });
});