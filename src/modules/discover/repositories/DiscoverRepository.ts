import prisma from '@/prisma/client';

export interface MangaFilter {
  language: string;
  page: number;
  take: number;
}

export interface UserFeedFilter extends MangaFilter {
  userId: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  next: boolean;
  prev: boolean;
}

export interface MangaWithTranslations {
  id: string;
  manga_uuid: string;
  cover: string;
  releaseDate?: Date;
  createdAt?: Date;
  translations: Array<{
    language: string;
    name: string;
    description: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    views: number;
    likes: number;
  };
}

export interface UserWithPreferences {
  id: string;
  categories: Array<{
    id: string;
    name: string;
  }>;
  views?: Array<{
    mangaId: string;
    manga: {
      categories: Array<{
        id: string;
        name: string;
      }>;
      translations: Array<{
        language: string;
        name: string;
        description: string;
      }>;
    };
  }>;
  likes?: Array<{
    manga: {
      categories: Array<{
        id: string;
        name: string;
      }>;
      translations: Array<{
        language: string;
        name: string;
        description: string;
      }>;
    };
  }>;
}

export class DiscoverRepository {
  async findRecentMangas(filter: MangaFilter): Promise<MangaWithTranslations[]> {
    const skip = (filter.page - 1) * filter.take;

    return await prisma.manga.findMany({
      skip,
      take: filter.take,
      where: {
        translations: {
          some: {
            language: filter.language
          }
        }
      },
      orderBy: { releaseDate: 'desc' },
      select: {
        id: true,
        manga_uuid: true,
        cover: true,
        translations: {
          where: {
            language: filter.language
          },
          select: {
            language: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: { views: true, likes: true }
        }
      }
    }) as MangaWithTranslations[];
  }

  async findMostViewedMangas(filter: MangaFilter): Promise<MangaWithTranslations[]> {
    const skip = (filter.page - 1) * filter.take;

    return await prisma.manga.findMany({
      skip,
      take: filter.take,
      where: {
        translations: {
          some: {
            language: filter.language
          }
        }
      },
      orderBy: {
        views: {
          _count: 'desc',
        },
      },
      include: {
        translations: {
          select: {
            language: true,
            name: true,
            description: true
          }
        },
        categories: true,
        _count: {
          select: { views: true, likes: true },
        },
      },
    }) as MangaWithTranslations[];
  }

  async findMostLikedMangas(filter: MangaFilter): Promise<MangaWithTranslations[]> {
    const skip = (filter.page - 1) * filter.take;

    return await prisma.manga.findMany({
      skip,
      take: filter.take,
      where: {
        translations: {
          some: {
            language: filter.language
          }
        }
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      include: {
        translations: {
          select: {
            language: true,
            name: true,
            description: true
          }
        },
        categories: true,
        _count: {
          select: { likes: true, views: true },
        },
      },
    }) as MangaWithTranslations[];
  }

  async findMangasByCategories(categoryIds: string[], filter: MangaFilter): Promise<MangaWithTranslations[]> {
    const skip = (filter.page - 1) * filter.take;

    return await prisma.manga.findMany({
      where: {
        categories: {
          some: {
            id: {
              in: categoryIds,
            },
          },
        },
        translations: {
          some: {
            language: filter.language
          }
        }
      },
      include: {
        translations: true,
        categories: true,
        _count: {
          select: { likes: true, views: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: filter.take,
    }) as MangaWithTranslations[];
  }

  async findMangasForIA(categoryIds: string[], excludeIds: string[], filter: MangaFilter): Promise<MangaWithTranslations[]> {
    const skip = (filter.page - 1) * filter.take;

    return await prisma.manga.findMany({
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
            language: filter.language
          }
        },
        id: {
          notIn: excludeIds
        }
      },
      include: {
        translations: true,
        categories: true,
        _count: {
          select: { likes: true, views: true }
        }
      },
      orderBy: [
        {
          likes: {
            _count: 'desc'
          }
        },
        {
          views: {
            _count: 'desc'
          }
        }
      ],
      skip,
      take: filter.take
    }) as MangaWithTranslations[];
  }

  async countMangasByLanguage(language: string): Promise<number> {
    return await prisma.manga.count({
      where: {
        translations: {
          some: {
            language: language
          }
        }
      }
    });
  }

  async countMangasByCategories(categoryIds: string[], language: string): Promise<number> {
    return await prisma.manga.count({
      where: {
        categories: {
          some: {
            id: {
              in: categoryIds,
            },
          },
        },
        translations: {
          some: {
            language: language
          }
        }
      }
    });
  }

  async countMangasForIA(categoryIds: string[], excludeIds: string[], language: string): Promise<number> {
    return await prisma.manga.count({
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
            language: language
          }
        },
        id: {
          notIn: excludeIds
        }
      }
    });
  }

  async findUserWithPreferences(userId: string): Promise<UserWithPreferences | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { categories: true },
    }) as UserWithPreferences | null;
  }

  async findUserWithFullPreferences(userId: string): Promise<UserWithPreferences | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
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
    }) as UserWithPreferences | null;
  }
} 