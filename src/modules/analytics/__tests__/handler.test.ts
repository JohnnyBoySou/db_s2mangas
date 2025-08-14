import { prismaMock } from '../../../test/mocks/prisma';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

import {
  getGeneralStats,
  getViewsByPeriod,
  getMostViewedMangas,
  getMostLikedMangas,
  getMostCommentedMangas,
  getUsersByPeriod,
  getMostActiveUsers,
  getCategoryStats,
  getLanguageStats,
  getMangaTypeStats,
  getMangaStatusStats
} from '../handlers/AnalyticsHandler';

describe('Analytics Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGeneralStats', () => {
    it('should return general statistics successfully', async () => {
      // Given
      (prismaMock.user.count as jest.Mock).mockResolvedValue(100);
      (prismaMock.manga.count as jest.Mock).mockResolvedValue(50);
      (prismaMock.chapter.count as jest.Mock).mockResolvedValue(500);
      (prismaMock.view.count as jest.Mock).mockResolvedValue(1000);
      (prismaMock.like.count as jest.Mock).mockResolvedValue(200);
      (prismaMock.comment.count as jest.Mock).mockResolvedValue(150);

      // When
      const result = await getGeneralStats();

      // Then
      expect(result).toEqual({
        totalUsers: 100,
        totalMangas: 50,
        totalChapters: 500,
        totalViews: 1000,
        totalLikes: 200,
        totalComments: 150
      });
      expect(prismaMock.user.count).toHaveBeenCalled();
      expect(prismaMock.manga.count).toHaveBeenCalled();
      expect(prismaMock.chapter.count).toHaveBeenCalled();
      expect(prismaMock.view.count).toHaveBeenCalled();
      expect(prismaMock.like.count).toHaveBeenCalled();
      expect(prismaMock.comment.count).toHaveBeenCalled();
    });
  });

  describe('getViewsByPeriod', () => {
    it('should return views by period successfully', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockViews = [
        { createdAt: new Date('2024-01-01'), _count: { _all: 10 } },
        { createdAt: new Date('2024-01-02'), _count: { _all: 15 } }
      ];
      
      (prismaMock.view.groupBy as jest.Mock).mockResolvedValue(mockViews as any);

      // When
      const result = await getViewsByPeriod({ startDate, endDate });

      // Then
      expect(result).toEqual([
        { date: new Date('2024-01-01'), count: 10 },
        { date: new Date('2024-01-02'), count: 15 }
      ]);
      expect(prismaMock.view.groupBy).toHaveBeenCalledWith({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          _all: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    });
  });

  describe('getMostViewedMangas', () => {
    it('should return most viewed mangas successfully', async () => {
      // Given
      const mockMangas = [
        {
          id: 'manga-1',
          translations: [{ name: 'Manga 1' }],
          _count: { views: 100, likes: 20, comments: 10 }
        },
        {
          id: 'manga-2',
          translations: [],
          _count: { views: 80, likes: 15, comments: 5 }
        }
      ];
      
      (prismaMock.manga.findMany as jest.Mock).mockResolvedValue(mockMangas as any);

      // When
      const result = await getMostViewedMangas(2);

      // Then
      expect(result).toEqual([
        {
          id: 'manga-1',
          title: 'Manga 1',
          views: 100,
          likes: 20,
          comments: 10
        },
        {
          id: 'manga-2',
          title: 'Sem título',
          views: 80,
          likes: 15,
          comments: 5
        }
      ]);
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith({
        take: 2,
        orderBy: {
          views: {
            _count: 'desc'
          }
        },
        include: {
          translations: {
            where: {
              language: 'pt-BR'
            }
          },
          _count: {
            select: {
              views: true,
              likes: true,
              comments: true
            }
          }
        }
      });
    });

    it('should use default limit when not provided', async () => {
      // Given
      (prismaMock.manga.findMany as jest.Mock).mockResolvedValue([]);

      // When
      await getMostViewedMangas();

      // Then
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('getMostLikedMangas', () => {
    it('should return most liked mangas successfully', async () => {
      // Given
      const mockMangas = [
        {
          id: 'manga-1',
          translations: [{ name: 'Popular Manga' }],
          _count: { views: 50, likes: 100, comments: 30 }
        }
      ];
      
      (prismaMock.manga.findMany as jest.Mock).mockResolvedValue(mockMangas as any);

      // When
      const result = await getMostLikedMangas(1);

      // Then
      expect(result).toEqual([
        {
          id: 'manga-1',
          title: 'Popular Manga',
          views: 50,
          likes: 100,
          comments: 30
        }
      ]);
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            likes: {
              _count: 'desc'
            }
          }
        })
      );
    });
  });

  describe('getMostCommentedMangas', () => {
    it('should return most commented mangas successfully', async () => {
      // Given
      const mockMangas = [
        {
          id: 'manga-1',
          translations: [{ name: 'Commented Manga' }],
          _count: { views: 30, likes: 20, comments: 50 }
        }
      ];
      
      (prismaMock.manga.findMany as jest.Mock).mockResolvedValue(mockMangas as any);

      // When
      const result = await getMostCommentedMangas(1);

      // Then
      expect(result).toEqual([
        {
          id: 'manga-1',
          title: 'Commented Manga',
          views: 30,
          likes: 20,
          comments: 50
        }
      ]);
      expect(prismaMock.manga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            comments: {
              _count: 'desc'
            }
          }
        })
      );
    });
  });

  describe('getUsersByPeriod', () => {
    it('should return users by period successfully', async () => {
      // Given
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockUsers = [
        { createdAt: new Date('2024-01-01'), _count: { _all: 5 } },
        { createdAt: new Date('2024-01-02'), _count: { _all: 8 } }
      ];
      
      (prismaMock.user.groupBy as jest.Mock).mockResolvedValue(mockUsers as any);

      // When
      const result = await getUsersByPeriod({ startDate, endDate });

      // Then
      expect(result).toEqual([
        { date: new Date('2024-01-01'), count: 5 },
        { date: new Date('2024-01-02'), count: 8 }
      ]);
      expect(prismaMock.user.groupBy).toHaveBeenCalledWith({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          _all: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    });
  });

  describe('getMostActiveUsers', () => {
    it('should return most active users successfully', async () => {
      // Given
      const mockUsers = [
        {
          id: 'user-1',
          name: 'Active User',
          _count: { views: 50, likes: 30, comments: 20 }
        }
      ];
      
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue(mockUsers as any);

      // When
      const result = await getMostActiveUsers(1);

      // Then
      expect(result).toEqual([
        {
          id: 'user-1',
          name: 'Active User',
          views: 50,
          likes: 30,
          comments: 20,
          totalActivity: 100
        }
      ]);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        take: 1,
        include: {
          _count: {
            select: {
              views: true,
              likes: true,
              comments: true
            }
          }
        }
      });
    });
  });

  describe('getCategoryStats', () => {
    it('should return category statistics successfully', async () => {
      // Given
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Action',
          _count: { mangas: 25 }
        },
        {
          id: 'cat-2',
          name: 'Romance',
          _count: { mangas: 15 }
        }
      ];
      
      (prismaMock.category.findMany as jest.Mock).mockResolvedValue(mockCategories as any);

      // When
      const result = await getCategoryStats();

      // Then
      expect(result).toEqual([
        { name: 'Action', mangaCount: 25 },
        { name: 'Romance', mangaCount: 15 }
      ]);
      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              mangas: true
            }
          }
        }
      });
    });
  });

  describe('getLanguageStats', () => {
    it('should return language statistics successfully', async () => {
      // Given
      const mockLanguages = [
        {
          id: 'lang-1',
          name: 'Português',
          _count: { mangas: 30 }
        },
        {
          id: 'lang-2',
          name: 'English',
          _count: { mangas: 20 }
        }
      ];
      
      (prismaMock.language.findMany as jest.Mock).mockResolvedValue(mockLanguages as any);

      // When
      const result = await getLanguageStats();

      // Then
      expect(result).toEqual([
        { code: undefined, mangaCount: 30 },
        { code: undefined, mangaCount: 20 }
      ]);
      expect(prismaMock.language.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              mangas: true
            }
          }
        }
      });
    });
  });

  describe('getMangaTypeStats', () => {
    it('should return manga type statistics successfully', async () => {
      // Given
      const mockTypes = [
        { type: 'MANGA', _count: { _all: 40 } },
        { type: 'MANHWA', _count: { _all: 25 } }
      ];
      
      (prismaMock.manga.groupBy as jest.Mock).mockResolvedValue(mockTypes as any);

      // When
      const result = await getMangaTypeStats();

      // Then
      expect(result).toEqual([
        { type: 'MANGA', count: 40 },
        { type: 'MANHWA', count: 25 }
      ]);
      expect(prismaMock.manga.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        _count: {
          _all: true
        }
      });
    });
  });

  describe('getMangaStatusStats', () => {
    it('should return manga status statistics successfully', async () => {
      // Given
      const mockStatuses = [
        { status: 'ONGOING', _count: { _all: 35 } },
        { status: 'COMPLETED', _count: { _all: 20 } }
      ];
      
      (prismaMock.manga.groupBy as jest.Mock).mockResolvedValue(mockStatuses as any);

      // When
      const result = await getMangaStatusStats();

      // Then
      expect(result).toEqual([
        { status: 'ONGOING', count: 35 },
        { status: 'COMPLETED', count: 20 }
      ]);
      expect(prismaMock.manga.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        _count: {
          _all: true
        }
      });
    });
  });
});