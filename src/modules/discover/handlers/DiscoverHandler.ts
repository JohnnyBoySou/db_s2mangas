import prisma from '@/prisma/client';

export interface DiscoverFilters {
  language?: string;
  categoryIds?: string[];
  userId?: string;
  status?: 'PRIVATE' | 'PUBLIC';
}

export interface DiscoverOptions {
  page?: number;
  take?: number;
  language?: string;
  categoryIds?: string[];
  userId?: string;
  orderBy?: 'recent' | 'views' | 'likes' | 'createdAt';
}

export const getRecentMangas = async (options: DiscoverOptions = {}) => {
  const { page = 1, take = 10, language = 'pt-BR' } = options;
  const skip = (page - 1) * take;

  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        translations: {
          where: {
            language: language
          },
          select: {
            name: true,
            description: true,
            language: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            chapters: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    }),
    prisma.manga.count({
      where: {
        status: 'ACTIVE'
      }
    })
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: mangas.map(manga => {
      const translation = manga.translations[0] || manga.translations.find(t => t.language === language);
      return {
        id: manga.id,
        manga_uuid: manga.manga_uuid,
        title: translation?.name || 'Sem título',
        description: translation?.description || 'Sem descrição',
        cover: manga.cover,
        views_count: manga._count.views,
        likes_count: manga._count.likes,
        chapters_count: manga._count.chapters,
        categories: manga.categories,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt
      };
    }),
    pagination: {
      total,
      page,
      limit: take,
      totalPages,
      next: page < totalPages,
      prev: page > 1
    }
  };
};

export const getMostViewedMangas = async (options: DiscoverOptions = {}) => {
  const { page = 1, take = 10, language = 'pt-BR' } = options;
  const skip = (page - 1) * take;

  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        translations: {
          where: {
            language: language
          },
          select: {
            name: true,
            description: true,
            language: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            chapters: true
          }
        }
      },
      orderBy: {
        views: {
          _count: 'desc'
        }
      },
      skip,
      take
    }),
    prisma.manga.count({
      where: {
        status: 'ACTIVE'
      }
    })
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: mangas.map(manga => {
      const translation = manga.translations[0] || manga.translations.find(t => t.language === language);
      return {
        id: manga.id,
        manga_uuid: manga.manga_uuid,
        title: translation?.name || 'Sem título',
        description: translation?.description || 'Sem descrição',
        cover: manga.cover,
        views_count: manga._count.views,
        likes_count: manga._count.likes,
        chapters_count: manga._count.chapters,
        categories: manga.categories,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt
      };
    }),
    pagination: {
      total,
      page,
      limit: take,
      totalPages,
      next: page < totalPages,
      prev: page > 1
    }
  };
};

export const getMostLikedMangas = async (options: DiscoverOptions = {}) => {
  const { page = 1, take = 10, language = 'pt-BR' } = options;
  const skip = (page - 1) * take;

  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        translations: {
          where: {
            language: language
          },
          select: {
            name: true,
            description: true,
            language: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            chapters: true
          }
        }
      },
      orderBy: {
        likes: {
          _count: 'desc'
        }
      },
      skip,
      take
    }),
    prisma.manga.count({
      where: {
        status: 'ACTIVE'
      }
    })
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: mangas.map(manga => {
      const translation = manga.translations[0] || manga.translations.find(t => t.language === language);
      return {
        id: manga.id,
        manga_uuid: manga.manga_uuid,
        title: translation?.name || 'Sem título',
        description: translation?.description || 'Sem descrição',
        cover: manga.cover,
        views_count: manga._count.views,
        likes_count: manga._count.likes,
        chapters_count: manga._count.chapters,
        categories: manga.categories,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt
      };
    }),
    pagination: {
      total,
      page,
      limit: take,
      totalPages,
      next: page < totalPages,
      prev: page > 1
    }
  };
};

export const getFeedForUser = async (userId: string, options: DiscoverOptions = {}) => {
  const { page = 1, take = 10, language = 'pt-BR' } = options;
  const skip = (page - 1) * take;

  // Buscar mangás baseados nas preferências do usuário (simplificado)
  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        translations: {
          where: {
            language: language
          },
          select: {
            name: true,
            description: true,
            language: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            chapters: true
          }
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
      take
    }),
    prisma.manga.count({
      where: {
        status: 'ACTIVE'
      }
    })
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: mangas.map(manga => {
      const translation = manga.translations[0] || manga.translations.find(t => t.language === language);
      return {
        id: manga.id,
        manga_uuid: manga.manga_uuid,
        title: translation?.name || 'Sem título',
        description: translation?.description || 'Sem descrição',
        cover: manga.cover,
        views_count: manga._count.views,
        likes_count: manga._count.likes,
        chapters_count: manga._count.chapters,
        categories: manga.categories,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt
      };
    }),
    pagination: {
      total,
      page,
      limit: take,
      totalPages,
      next: page < totalPages,
      prev: page > 1
    }
  };
};

export const getIARecommendations = async (userId: string, options: DiscoverOptions = {}) => {
  const { page = 1, take = 10, language = 'pt-BR' } = options;
  const skip = (page - 1) * take;

  // Buscar mangás recomendados baseados em popularidade (simplificado)
  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        translations: {
          where: {
            language: language
          },
          select: {
            name: true,
            description: true,
            language: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            chapters: true
          }
        }
      },
      orderBy: [
        {
          likes: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      skip,
      take
    }),
    prisma.manga.count({
      where: {
        status: 'ACTIVE'
      }
    })
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: mangas.map(manga => {
      const translation = manga.translations[0] || manga.translations.find(t => t.language === language);
      return {
        id: manga.id,
        manga_uuid: manga.manga_uuid,
        title: translation?.name || 'Sem título',
        description: translation?.description || 'Sem descrição',
        cover: manga.cover,
        views_count: manga._count.views,
        likes_count: manga._count.likes,
        chapters_count: manga._count.chapters,
        categories: manga.categories,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt
      };
    }),
    pagination: {
      total,
      page,
      limit: take,
      totalPages,
      next: page < totalPages,
      prev: page > 1
    }
  };
};

export const getMangasByCategories = async (categoryIds: string[], options: DiscoverOptions = {}) => {
  const { page = 1, take = 10, language = 'pt-BR' } = options;
  const skip = (page - 1) * take;

  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where: {
        status: 'ACTIVE',
        categories: {
          some: {
            id: {
              in: categoryIds
            }
          }
        }
      },
      include: {
        translations: {
          where: {
            language: language
          },
          select: {
            name: true,
            description: true,
            language: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            views: true,
            likes: true,
            chapters: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    }),
    prisma.manga.count({
      where: {
        status: 'ACTIVE',
        categories: {
          some: {
            id: {
              in: categoryIds
            }
          }
        }
      }
    })
  ]);

  const totalPages = Math.ceil(total / take);

  return {
    data: mangas.map(manga => {
      const translation = manga.translations[0] || manga.translations.find(t => t.language === language);
      return {
        id: manga.id,
        manga_uuid: manga.manga_uuid,
        title: translation?.name || 'Sem título',
        description: translation?.description || 'Sem descrição',
        cover: manga.cover,
        views_count: manga._count.views,
        likes_count: manga._count.likes,
        chapters_count: manga._count.chapters,
        categories: manga.categories,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt
      };
    }),
    pagination: {
      total,
      page,
      limit: take,
      totalPages,
      next: page < totalPages,
      prev: page > 1
    }
  };
};

export const getDiscoverStats = async (language: string = 'pt-BR') => {
  const [
    totalMangas,
    totalCategories
  ] = await Promise.all([
    prisma.manga.count({
      where: { status: 'ACTIVE' }
    }),
    prisma.category.count()
  ]);

  return {
    totalMangas,
    totalCategories,
    totalViews: 0, // Placeholder - implementar quando schema estiver disponível
    totalLikes: 0, // Placeholder - implementar quando schema estiver disponível
    averageMangasPerCategory: totalCategories > 0 ? Math.round(totalMangas / totalCategories) : 0,
    language
  };
};
