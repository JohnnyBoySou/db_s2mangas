import {
  searchManga,
  listCategories,
  searchCategories,
  listTypes,
  listLanguages,
} from '../index';
import { prismaMock } from '../../../test/mocks/prisma';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT, MANGA_TYPE } from '@/constants/search';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: {},
}));

// Configurar o mock após a importação
const mockPrisma = require('@/prisma/client').default;
Object.assign(mockPrisma, prismaMock);

// Mock das constantes
jest.mock('@/constants/search', () => ({
  DEFAULT_LIMIT: 10,
  DEFAULT_PAGE: 1,
  MAX_LIMIT: 50,
  MANGA_TYPE: {
    MANGA: 'Manga',
    MANHWA: 'Manhwa',
    MANHUA: 'Manhua',
    WEBTOON: 'Webtoon',
  },
}));

describe('Search Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchManga', () => {
    const mockMangas = [
      {
        id: 'manga-1',
        manga_uuid: 'uuid-1',
        cover: 'cover-1.jpg',
        status: 'ONGOING',
        type: 'MANGA',
        createdAt: new Date(),
        translations: [
          {
            name: 'Manga Title 1',
            description: 'Description 1',
            language: 'pt-BR',
          },
        ],
        categories: [
          { id: 'cat-1', name: 'Action' },
        ],
        _count: {
          likes: 100,
          views: 1000,
        },
      },
      {
        id: 'manga-2',
        manga_uuid: 'uuid-2',
        cover: 'cover-2.jpg',
        status: 'COMPLETED',
        type: 'MANHWA',
        createdAt: new Date(),
        translations: [
          {
            name: 'Manga Title 2',
            description: 'Description 2',
            language: 'pt-BR',
          },
        ],
        categories: [
          { id: 'cat-2', name: 'Romance' },
        ],
        _count: {
          likes: 200,
          views: 2000,
        },
      },
    ];

    it('should search manga with default parameters', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue(mockMangas as any);
      prismaMock.manga.count.mockResolvedValue(2);

      // When
      const result = await searchManga({});

      // Then
      expect(result).toEqual({
        data: [
          {
            ...mockMangas[0],
            title: 'Manga Title 1',
            description: 'Description 1',
            translations: undefined,
          },
          {
            ...mockMangas[1],
            title: 'Manga Title 2',
            description: 'Description 2',
            translations: undefined,
          },
        ],
        pagination: {
          total: 2,
          to: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false,
        },
      });

      expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: expect.any(Object),
      });
    });

    it('should search manga by name', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([mockMangas[0]] as any);
      prismaMock.manga.count.mockResolvedValue(1);

      // When
      await searchManga({ name: 'Manga Title' });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
        where: {
          translations: {
            some: {
              AND: [
                {
                  language: {
                    equals: 'pt-BR',
                    mode: 'insensitive',
                  },
                },
                {
                  OR: [
                    {
                      OR: [
                        {
                          name: {
                            contains: 'manga',
                            mode: 'insensitive',
                          },
                        },
                        {
                          description: {
                            contains: 'manga',
                            mode: 'insensitive',
                          },
                        },
                      ],
                    },
                    {
                      OR: [
                        {
                          name: {
                            contains: 'title',
                            mode: 'insensitive',
                          },
                        },
                        {
                          description: {
                            contains: 'title',
                            mode: 'insensitive',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: expect.any(Object),
      });
    });

    it('should search manga by category', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([mockMangas[0]] as any);
      prismaMock.manga.count.mockResolvedValue(1);

      // When
      await searchManga({ category: 'Action' });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categories: {
              some: {
                name: {
                  equals: 'Action',
                  mode: 'insensitive',
                },
              },
            },
          },
        })
      );
    });

    it('should search manga by status', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([mockMangas[0]] as any);
      prismaMock.manga.count.mockResolvedValue(1);

      // When
      await searchManga({ status: 'ONGOING' });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: {
              equals: 'ONGOING',
              mode: 'insensitive',
            },
          },
        })
      );
    });

    it('should search manga by type', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([mockMangas[1]] as any);
      prismaMock.manga.count.mockResolvedValue(1);

      // When
      await searchManga({ type: 'MANHWA' });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: {
              equals: 'MANHWA',
              mode: 'insensitive',
            },
          },
        })
      );
    });

    it('should handle custom pagination', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([]);
      prismaMock.manga.count.mockResolvedValue(100);

      // When
      const result = await searchManga({ page: 3, limit: 20 });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3-1) * 20
          take: 20,
        })
      );
      expect(result.pagination).toEqual({
        total: 100,
        to: 60,
        page: 3,
        limit: 20,
        totalPages: 5,
        next: true,
        prev: true,
      });
    });

    it('should enforce maximum limit', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([]);
      prismaMock.manga.count.mockResolvedValue(0);

      // When
      await searchManga({ limit: 100 });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // MAX_LIMIT
        })
      );
    });

    it('should enforce minimum page and limit values', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([]);
      prismaMock.manga.count.mockResolvedValue(0);

      // When
      await searchManga({ page: -1, limit: 0 });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // page 1
          take: 1, // minimum limit
        })
      );
    });

    it('should handle manga without translations', async () => {
      // Given
      const mangaWithoutTranslations = {
        ...mockMangas[0],
        translations: [],
      };
      
      prismaMock.manga.findMany.mockResolvedValue([mangaWithoutTranslations] as any);
      prismaMock.manga.count.mockResolvedValue(1);

      // When
      const result = await searchManga({});

      // Then
      expect(result.data[0].title).toBe('Sem título');
      expect(result.data[0].description).toBe('');
    });

    it('should use custom language', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([]);
      prismaMock.manga.count.mockResolvedValue(0);

      // When
      await searchManga({ language: 'en-US' });

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            translations: {
              where: {
                language: {
                  equals: 'en-US',
                  mode: 'insensitive',
                },
              },
            },
            categories: true,
            _count: {
              select: {
                likes: true,
                views: true,
              },
            },
          },
        })
      );
    });
  });

  describe('listCategories', () => {
    it('should list all categories ordered by name', async () => {
      // Given
      const mockCategories = [
        { id: 'cat-1', name: 'Action' },
        { id: 'cat-2', name: 'Romance' },
        { id: 'cat-3', name: 'Comedy' },
      ];
      
      prismaMock.category.findMany.mockResolvedValue(mockCategories as any);

      // When
      const result = await listCategories();

      // Then
      expect(result).toEqual(mockCategories);
      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      });
    });
  });

  describe('searchCategories', () => {
    const mockMangas = [
      {
        id: 'manga-1',
        translations: [
          { name: 'Action Manga 1', description: 'Description 1' },
        ],
        categories: [{ name: 'Action' }],
        _count: { likes: 50, views: 500 },
      },
    ];

    it('should search manga by category name', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue(mockMangas as any);
      prismaMock.manga.count.mockResolvedValue(1);

      // When
      const result = await searchCategories('Action');

      // Then
      expect(result).toEqual({
        data: [
          {
            ...mockMangas[0],
            title: 'Action Manga 1',
            description: 'Description 1',
            translations: undefined,
          },
        ],
        pagination: {
          total: 1,
          to: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          next: false,
          prev: false,
        },
      });

      expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
        where: {
          categories: {
            some: {
              name: {
                contains: 'Action',
                mode: 'insensitive',
              },
            },
          },
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      });
    });

    it('should handle pagination in category search', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([]);
      prismaMock.manga.count.mockResolvedValue(25);

      // When
      const result = await searchCategories('Action', 3, 5);

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (3-1) * 5
          take: 5,
        })
      );
      expect(result.pagination).toEqual({
        total: 25,
        to: 15,
        page: 3,
        limit: 5,
        totalPages: 5,
        next: true,
        prev: true,
      });
    });

    it('should use custom language in category search', async () => {
      // Given
      prismaMock.manga.findMany.mockResolvedValue([]);
      prismaMock.manga.count.mockResolvedValue(0);

      // When
      await searchCategories('Action', 1, 10, 'en-US');

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            translations: {
              where: {
                language: {
                  equals: 'en-US',
                  mode: 'insensitive',
                },
              },
            },
            categories: true,
            _count: {
              select: {
                likes: true,
                views: true,
              },
            },
          },
        })
      );
    });
  });

  describe('listTypes', () => {
    it('should return all manga types', async () => {
      // When
      const result = await listTypes();

      // Then
      expect(result).toEqual(Object.values(MANGA_TYPE));
      expect(result).toEqual(['Manga', 'Manhwa', 'Manhua', 'Webtoon']);
    });
  });

  describe('listLanguages', () => {
    it('should list all languages ordered by name', async () => {
      // Given
      const mockLanguages = [
        { id: 'lang-1', code: 'pt-BR', name: 'Português (Brasil)' },
        { id: 'lang-2', code: 'en-US', name: 'English (US)' },
        { id: 'lang-3', code: 'es-ES', name: 'Español (España)' },
      ];
      
      prismaMock.language.findMany.mockResolvedValue(mockLanguages as any);

      // When
      const result = await listLanguages();

      // Then
      expect(result).toEqual(mockLanguages);
      expect(prismaMock.language.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      });
    });
  });
});