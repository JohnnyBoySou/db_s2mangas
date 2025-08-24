import { prismaMock } from '../../../test/mocks/prisma';
import { Request } from 'express';
import fs from 'fs';
import axios from 'axios';

// Mock dependencies
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock
}));

jest.mock('fs');
jest.mock('axios');
jest.mock('@/utils/pagination');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock pagination utils
const mockGetPaginationParams = jest.fn();
jest.mock('@/utils/pagination', () => ({
  getPaginationParams: mockGetPaginationParams
}));

import * as wallpaperHandler from '../handlers/WallpaperHandler';

describe('Wallpaper Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWallpapers', () => {
    const mockRequest = {
      query: { page: '1', limit: '10' }
    } as unknown as Request;

    const mockWallpapers = [
      {
        id: 'wallpaper-1',
        name: 'Anime Action',
        cover: 'https://example.com/cover1.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { images: 5 }
      },
      {
        id: 'wallpaper-2',
        name: 'Anime Adventure',
        cover: 'https://example.com/cover2.jpg',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        _count: { images: 3 }
      }
    ];

    it('deve retornar lista de wallpapers com paginação', async () => {
      // Given
      mockGetPaginationParams.mockReturnValue({ skip: 0, take: 10, page: 1 });
      (prismaMock.wallpaper.findMany as jest.Mock).mockResolvedValue(mockWallpapers);
      (prismaMock.wallpaper.count as jest.Mock).mockResolvedValue(2);

      // When
      const result = await wallpaperHandler.getWallpapers(mockRequest);

      // Then
      expect(result).toEqual({
        data: [
          {
            ...mockWallpapers[0],
            totalImages: 5
          },
          {
            ...mockWallpapers[1],
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
      });

      expect(prismaMock.wallpaper.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { images: true }
          }
        }
      });
    });

    it('deve calcular paginação corretamente para múltiplas páginas', async () => {
      // Given
      mockGetPaginationParams.mockReturnValue({ skip: 0, take: 10, page: 1 });
      (prismaMock.wallpaper.findMany as jest.Mock).mockResolvedValue(mockWallpapers);
      (prismaMock.wallpaper.count as jest.Mock).mockResolvedValue(25); // 3 páginas

      // When
      const result = await wallpaperHandler.getWallpapers(mockRequest);

      // Then
      expect(result.pagination).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        next: true,
        prev: false
      });
    });

    it('deve propagar erro do prisma', async () => {
      // Given
      mockGetPaginationParams.mockReturnValue({ skip: 0, take: 10, page: 1 });
      const dbError = new Error('Database connection failed');
      (prismaMock.wallpaper.findMany as jest.Mock).mockRejectedValue(dbError);

      // When & Then
      await expect(wallpaperHandler.getWallpapers(mockRequest)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getWallpaperById', () => {
    const wallpaperId = 'wallpaper-123';
    const mockRequest = {
      query: { page: '1', limit: '10' }
    } as unknown as Request;

    const mockWallpaper = {
      id: wallpaperId,
      name: 'Anime Test',
      cover: 'https://example.com/cover.jpg',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      images: [
        {
          id: 'image-1',
          url: 'https://example.com/image1.jpg',
          wallpaperId: wallpaperId
        },
        {
          id: 'image-2',
          url: 'https://example.com/image2.jpg',
          wallpaperId: wallpaperId
        }
      ],
      _count: { images: 2 }
    };

    it('deve retornar wallpaper específico com imagens paginadas', async () => {
      // Given
      mockGetPaginationParams.mockReturnValue({ skip: 0, take: 10, page: 1 });
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(mockWallpaper);

      // When
      const result = await wallpaperHandler.getWallpaperById(wallpaperId, mockRequest);

      // Then
      expect(result).toEqual({
        data: {
          ...mockWallpaper,
          totalImages: 2
        },
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false
        }
      });

      expect(prismaMock.wallpaper.findUnique).toHaveBeenCalledWith({
        where: { id: wallpaperId },
        include: {
          images: { skip: 0, take: 10 },
          _count: { select: { images: true } }
        }
      });
    });

    it('deve lançar erro quando wallpaper não encontrado', async () => {
      // Given
      mockGetPaginationParams.mockReturnValue({ skip: 0, take: 10, page: 1 });
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(wallpaperHandler.getWallpaperById(wallpaperId, mockRequest))
        .rejects.toThrow('Wallpaper não encontrado');
    });

    it('deve calcular paginação corretamente para muitas imagens', async () => {
      // Given
      const wallpaperWithManyImages = {
        ...mockWallpaper,
        _count: { images: 25 }
      };
      mockGetPaginationParams.mockReturnValue({ skip: 0, take: 10, page: 1 });
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(wallpaperWithManyImages);

      // When
      const result = await wallpaperHandler.getWallpaperById(wallpaperId, mockRequest);

      // Then
      expect(result.pagination).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        next: true,
        prev: false
      });
    });
  });

  describe('createWallpaper', () => {
    const validWallpaperData = {
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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
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
      (prismaMock.wallpaper.create as jest.Mock).mockResolvedValue(mockCreatedWallpaper);

      // When
      const result = await wallpaperHandler.createWallpaper(validWallpaperData);

      // Then
      expect(result).toEqual(mockCreatedWallpaper);
      expect(prismaMock.wallpaper.create).toHaveBeenCalledWith({
        data: {
          name: validWallpaperData.name,
          cover: validWallpaperData.cover,
          images: {
            create: [
              { url: 'https://example.com/image1.jpg' },
              { url: 'https://example.com/image2.jpg' }
            ]
          }
        },
        include: {
          images: true
        }
      });
    });

    it('deve lançar erro de validação para dados inválidos', async () => {
      // Given
      const invalidData = {
        name: '', // nome vazio
        cover: 'invalid-url', // URL inválida
        images: [] // sem imagens
      };

      // When & Then
      await expect(wallpaperHandler.createWallpaper(invalidData as any))
        .rejects.toThrow();
    });

    it('deve propagar erro do prisma', async () => {
      // Given
      const dbError = new Error('Database constraint violation');
      (prismaMock.wallpaper.create as jest.Mock).mockRejectedValue(dbError);

      // When & Then
      await expect(wallpaperHandler.createWallpaper(validWallpaperData))
        .rejects.toThrow('Database constraint violation');
    });
  });

  describe('updateWallpaper', () => {
    const wallpaperId = 'wallpaper-123';
    const updateData = {
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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
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
      (prismaMock.wallpaper.update as jest.Mock).mockResolvedValue(mockUpdatedWallpaper);

      // When
      const result = await wallpaperHandler.updateWallpaper(wallpaperId, updateData);

      // Then
      expect(result).toEqual(mockUpdatedWallpaper);
      expect(prismaMock.wallpaper.update).toHaveBeenCalledWith({
        where: { id: wallpaperId },
        data: {
          name: updateData.name,
          cover: updateData.cover,
          images: {
            deleteMany: {},
            create: [
              { url: 'https://example.com/new-image.jpg' }
            ]
          }
        },
        include: {
          images: true
        }
      });
    });

    it('deve lançar erro de validação para dados inválidos', async () => {
      // Given
      const invalidData = {
        name: '',
        cover: 'invalid-url',
        images: []
      };

      // When & Then
      await expect(wallpaperHandler.updateWallpaper(wallpaperId, invalidData as any))
        .rejects.toThrow();
    });
  });

  describe('deleteWallpaper', () => {
    const wallpaperId = 'wallpaper-123';

    it('deve deletar wallpaper com sucesso', async () => {
      // Given
      const existingWallpaper = {
        id: wallpaperId,
        name: 'Wallpaper Test',
        cover: 'https://example.com/cover.jpg'
      };
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(existingWallpaper);
      (prismaMock.wallpaperImage.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prismaMock.wallpaper.delete as jest.Mock).mockResolvedValue(existingWallpaper);

      // When
      const result = await wallpaperHandler.deleteWallpaper(wallpaperId);

      // Then
      expect(result).toEqual({ message: "Wallpaper deletado com sucesso" });
      expect(prismaMock.wallpaper.findUnique).toHaveBeenCalledWith({ where: { id: wallpaperId } });
      expect(prismaMock.wallpaperImage.deleteMany).toHaveBeenCalledWith({ where: { wallpaperId } });
      expect(prismaMock.wallpaper.delete).toHaveBeenCalledWith({ where: { id: wallpaperId } });
    });

    it('deve lançar erro quando wallpaper não encontrado', async () => {
      // Given
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(wallpaperHandler.deleteWallpaper(wallpaperId))
        .rejects.toThrow('Wallpaper não encontrado');
    });
  });

  describe('toggleWallpaperImage', () => {
    const wallpaperId = 'wallpaper-123';
    const imageUrl = 'https://example.com/image.jpg';

    const mockWallpaper = {
      id: wallpaperId,
      name: 'Test Wallpaper',
      cover: 'https://example.com/cover.jpg',
      images: [
        {
          id: 'existing-image-1',
          url: 'https://example.com/existing1.jpg',
          wallpaperId: wallpaperId
        }
      ]
    };

    it('deve adicionar nova imagem quando não existe', async () => {
      // Given
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(mockWallpaper);
      (prismaMock.wallpaperImage.create as jest.Mock).mockResolvedValue({
        id: 'new-image-id',
        url: imageUrl,
        wallpaperId: wallpaperId
      });

      // When
      const result = await wallpaperHandler.toggleWallpaperImage(wallpaperId, imageUrl);

      // Then
      expect(result).toEqual({
        action: 'added',
        message: 'Imagem adicionada com sucesso'
      });
      expect(prismaMock.wallpaperImage.create).toHaveBeenCalledWith({
        data: {
          url: imageUrl,
          wallpaperId
        }
      });
    });

    it('deve remover imagem quando já existe', async () => {
      // Given
      const wallpaperWithExistingImage = {
        ...mockWallpaper,
        images: [
          ...mockWallpaper.images,
          {
            id: 'image-to-remove',
            url: imageUrl,
            wallpaperId: wallpaperId
          }
        ]
      };
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(wallpaperWithExistingImage);
      (prismaMock.wallpaperImage.delete as jest.Mock).mockResolvedValue({
        id: 'image-to-remove',
        url: imageUrl,
        wallpaperId: wallpaperId
      });

      // When
      const result = await wallpaperHandler.toggleWallpaperImage(wallpaperId, imageUrl);

      // Then
      expect(result).toEqual({
        action: 'removed',
        message: 'Imagem removida com sucesso'
      });
      expect(prismaMock.wallpaperImage.delete).toHaveBeenCalledWith({
        where: { id: 'image-to-remove' }
      });
    });

    it('deve lançar erro quando wallpaper não encontrado', async () => {
      // Given
      (prismaMock.wallpaper.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(wallpaperHandler.toggleWallpaperImage(wallpaperId, imageUrl))
        .rejects.toThrow('Wallpaper não encontrado');
    });
  });

  describe('importFromJson', () => {
    const mockJsonData = [
      {
        name: 'Wallpaper 1',
        capa: 'https://example.com/cover1.jpg',
        data: '"[{"img":"https://example.com/img1.jpg"},{"img":"https://example.com/img2.jpg"}]"'
      },
      {
        name: 'Wallpaper 2',
        capa: 'https://example.com/cover2.jpg',
        data: '"[{"img":"https://example.com/img3.jpg"}]"'
      }
    ];

    it('deve importar wallpapers do JSON com sucesso', async () => {
      // Given
      (mockedFs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockJsonData));
      (prismaMock.wallpaper.create as jest.Mock).mockResolvedValue({});

      // When
      const result = await wallpaperHandler.importFromJson();

      // Then
      expect(result).toEqual({
        success: true,
        message: 'Importação concluída com sucesso'
      });
      expect(prismaMock.wallpaper.create).toHaveBeenCalledTimes(2);
    });

    it('deve lançar erro quando arquivo não encontrado', async () => {
      // Given
      (mockedFs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      // When & Then
      await expect(wallpaperHandler.importFromJson())
        .rejects.toThrow('Erro ao importar dados do JSON: ENOENT: no such file or directory');
    });

    it('deve lançar erro quando JSON é inválido', async () => {
      // Given
      (mockedFs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      // When & Then
      await expect(wallpaperHandler.importFromJson())
        .rejects.toThrow('Erro ao importar dados do JSON:');
    });
  });

  describe('importFromPinterest', () => {
    const pinterestUrl = 'https://pinterest.com/user/board/';
    const mockPinterestResponse = {
      data: {
        data: {
          pins: [
            {
              images: {
                '564x': { url: 'https://pinterest.com/image1.jpg' },
                '237x': { url: 'https://pinterest.com/image1_small.jpg' }
              }
            },
            {
              images: {
                '564x': { url: 'https://pinterest.com/image2.jpg' }
              }
            }
          ]
        }
      }
    };

    const mockCreatedWallpaper = {
      id: 'pinterest-wallpaper-123',
      name: 'Importado do Pinterest - board',
      cover: 'https://pinterest.com/image1.jpg',
      images: [
        { id: 'img1', url: 'https://pinterest.com/image1.jpg' },
        { id: 'img2', url: 'https://pinterest.com/image2.jpg' }
      ]
    };

    it('deve importar wallpaper do Pinterest com sucesso', async () => {
      // Given
      (mockedAxios.get as jest.Mock).mockResolvedValue(mockPinterestResponse);
      (prismaMock.wallpaper.create as jest.Mock).mockResolvedValue(mockCreatedWallpaper);

      // When
      const result = await wallpaperHandler.importFromPinterest(pinterestUrl);

      // Then
      expect(result).toEqual({
        success: true,
        message: 'Wallpaper criado com sucesso com 2 imagens',
        wallpaper: mockCreatedWallpaper
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.pinterest.com/v3/pidgets/boards/user/board/pins/'
      );
    });

    it('deve lançar erro quando resposta da API é inválida', async () => {
      // Given
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: {} });

      // When & Then
      await expect(wallpaperHandler.importFromPinterest(pinterestUrl))
        .rejects.toThrow('Erro ao importar do Pinterest: Formato de resposta inválido da API do Pinterest');
    });

    it('deve lançar erro quando nenhuma imagem é encontrada', async () => {
      // Given
      (mockedAxios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            pins: [
              { images: null },
              { images: {} }
            ]
          }
        }
      });

      // When & Then
      await expect(wallpaperHandler.importFromPinterest(pinterestUrl))
        .rejects.toThrow('Erro ao importar do Pinterest: Nenhuma imagem encontrada no board');
    });

    it('deve lançar erro quando falha na requisição HTTP', async () => {
      // Given
      (mockedAxios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      // When & Then
      await expect(wallpaperHandler.importFromPinterest(pinterestUrl))
        .rejects.toThrow('Erro ao importar do Pinterest: Network error');
    });
  });
});