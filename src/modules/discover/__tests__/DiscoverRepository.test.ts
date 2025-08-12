import { prismaMock } from '../../../test/mocks/prisma';
import { DiscoverRepository, MangaFilter } from '../repositories/DiscoverRepository';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Define os tipos dos mocks
const mockMangaFindMany = prismaMock.manga.findMany as jest.MockedFunction<any>;
const mockMangaCount = prismaMock.manga.count as jest.MockedFunction<any>;
const mockUserFindUnique = prismaMock.user.findUnique as jest.MockedFunction<any>;

describe('DiscoverRepository', () => {
  let repository: DiscoverRepository;

  beforeEach(() => {
    repository = new DiscoverRepository();
    jest.clearAllMocks();
  });

  const mockMangaData = {
    id: 'manga-123',
    manga_uuid: 'uuid-123',
    cover: 'cover.jpg',
    releaseDate: new Date('2023-01-01'),
    createdAt: new Date('2023-01-01'),
    translations: [
      {
        language: 'pt',
        name: 'Manga Teste',
        description: 'Descrição do manga teste'
      }
    ],
    categories: [
      { id: 'cat-1', name: 'Ação' }
    ],
    _count: {
      views: 100,
      likes: 50
    }
  };

  const mockFilter: MangaFilter = {
    language: 'pt',
    page: 1,
    take: 10
  };

  describe('findRecentMangas', () => {
    it('deve buscar mangás recentes com sucesso', async () => {
      mockMangaFindMany.mockResolvedValue([mockMangaData]);

      const result = await repository.findRecentMangas(mockFilter);

      expect(result).toEqual([mockMangaData]);
      expect(mockMangaFindMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          translations: {
            some: {
              language: 'pt'
            }
          }
        },
        orderBy: { releaseDate: 'desc' },
        select: expect.any(Object)
      });
    });

    it('deve calcular skip corretamente para páginas diferentes', async () => {
      const filterPage2 = { ...mockFilter, page: 2 };
      mockMangaFindMany.mockResolvedValue([]);

      await repository.findRecentMangas(filterPage2);

      expect(mockMangaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
    });
  });

  describe('findMostViewedMangas', () => {
    it('deve buscar mangás mais vistos ordenados corretamente', async () => {
      mockMangaFindMany.mockResolvedValue([mockMangaData]);

      const result = await repository.findMostViewedMangas(mockFilter);

      expect(result).toEqual([mockMangaData]);
      expect(mockMangaFindMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          translations: {
            some: {
              language: 'pt'
            }
          }
        },
        orderBy: {
          views: {
            _count: 'desc'
          }
        },
        include: expect.any(Object)
      });
    });
  });

  describe('findMostLikedMangas', () => {
    it('deve buscar mangás mais curtidos ordenados corretamente', async () => {
      mockMangaFindMany.mockResolvedValue([mockMangaData]);

      const result = await repository.findMostLikedMangas(mockFilter);

      expect(result).toEqual([mockMangaData]);
      expect(mockMangaFindMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          translations: {
            some: {
              language: 'pt'
            }
          }
        },
        orderBy: {
          likes: {
            _count: 'desc'
          }
        },
        include: expect.any(Object)
      });
    });
  });

  describe('findMangasByCategories', () => {
    it('deve buscar mangás por categorias específicas', async () => {
      const categoryIds = ['cat-1', 'cat-2'];
      mockMangaFindMany.mockResolvedValue([mockMangaData]);

      const result = await repository.findMangasByCategories(categoryIds, mockFilter);

      expect(result).toEqual([mockMangaData]);
      expect(mockMangaFindMany).toHaveBeenCalledWith({
        where: {
          categories: {
            some: {
              id: {
                in: categoryIds
              }
            }
          },
          translations: {
            some: {
              language: 'pt'
            }
          }
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc'
        },
        skip: 0,
        take: 10
      });
    });
  });

  describe('findMangasForIA', () => {
    it('deve buscar mangás para IA excluindo já visualizados', async () => {
      const categoryIds = ['cat-1'];
      const excludeIds = ['manga-viewed'];
      mockMangaFindMany.mockResolvedValue([mockMangaData]);

      const result = await repository.findMangasForIA(categoryIds, excludeIds, mockFilter);

      expect(result).toEqual([mockMangaData]);
      expect(mockMangaFindMany).toHaveBeenCalledWith({
        where: {
          categories: {
            some: {
              id: {
                in: categoryIds
              }
            }
          },
          translations: {
            some: {
              language: 'pt'
            }
          },
          id: {
            notIn: excludeIds
          }
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
        skip: 0,
        take: 10
      });
    });
  });

  describe('countMangasByLanguage', () => {
    it('deve contar mangás por idioma', async () => {
      mockMangaCount.mockResolvedValue(25);

      const result = await repository.countMangasByLanguage('pt');

      expect(result).toBe(25);
      expect(mockMangaCount).toHaveBeenCalledWith({
        where: {
          translations: {
            some: {
              language: 'pt'
            }
          }
        }
      });
    });
  });

  describe('findUserWithPreferences', () => {
    it('deve buscar usuário com suas categorias preferidas', async () => {
      const mockUser = {
        id: 'user-123',
        categories: [{ id: 'cat-1', name: 'Ação' }]
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserWithPreferences('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { categories: true }
      });
    });

    it('deve retornar null se usuário não existir', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await repository.findUserWithPreferences('user-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('findUserWithFullPreferences', () => {
    it('deve buscar usuário com preferências completas para IA', async () => {
      const mockUser = {
        id: 'user-123',
        categories: [{ id: 'cat-1', name: 'Ação' }],
        views: [],
        likes: []
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserWithFullPreferences('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          categories: true,
          views: {
            include: {
              manga: {
                include: {
                  categories: true,
                  translations: true
                }
              }
            }
          },
          likes: {
            include: {
              manga: {
                include: {
                  categories: true,
                  translations: true
                }
              }
            }
          }
        }
      });
    });
  });
}); 