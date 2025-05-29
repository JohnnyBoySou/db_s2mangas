// src/controllers/discover.ts
import { RequestHandler } from 'express';
import prisma from '@/prisma/client';
import { getPaginationParams } from '@/utils/pagination';
import { handleZodError } from '@/utils/zodError';

const getTranslatedManga = (manga: any, language: string) => {
  const translation = manga.translations.find((t: any) => t.language === language);
  if (translation) {
    return {
      ...manga,
      title: translation.name,
      description: translation.description,
    };
  }
  // Se não encontrar a tradução, retorna a versão em inglês ou a primeira disponível
  const defaultTranslation = manga.translations.find((t: any) => t.language === 'en') ?? manga.translations[0];
  return {
    ...manga,
    title: defaultTranslation?.name ?? manga.title,
    description: defaultTranslation?.description ?? manga.description,
  };
};

// Mais recentes
export const getRecent: RequestHandler = async (req, res) => {
    const { skip, take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';

    try {
        const [mangas, total] = await Promise.all([
            prisma.manga.findMany({
                skip,
                take,
                where: {
                    translations: {
                        some: {
                            language: language
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
                            language: language
                        },
                        select: {
                            name: true
                        }
                    },
                    _count: {
                        select: { views: true }
                    }
                }
            }),
            prisma.manga.count({
                where: {
                    translations: {
                        some: {
                            language: language
                        }
                    }
                }
            }),
        ]);

        const formattedMangas = mangas.map(manga => ({
            id: manga.id,
            manga_uuid: manga.manga_uuid,
            title: manga.translations[0]?.name || '',
            cover: manga.cover,
            views_count: manga._count.views
        }));

        const totalPages = Math.ceil(total / take);

        res.status(200).json({
            data: formattedMangas,
            pagination: {
                total,
                page,
                limit: take,
                totalPages,
                next: page < totalPages,
                prev: page > 1,
            },
        });
    } catch (err) {
        handleZodError(err, res)
    }
};

// Mais vistos
export const getMostViewed: RequestHandler = async (req, res) => {
    const { skip, take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';

    try {
        const [mangas, total] = await Promise.all([
            prisma.manga.findMany({
                skip,
                take,
                where: {
                    translations: {
                        some: {
                            language: language
                        }
                    }
                },
                orderBy: {
                    views: {
                        _count: 'desc',
                    },
                },
                include: {
                    translations: true,
                    categories: true,
                    _count: {
                        select: { views: true, likes: true },
                    },
                },
            }),
            prisma.manga.count({
                where: {
                    translations: {
                        some: {
                            language: language
                        }
                    }
                }
            }),
        ]);

        const translatedMangas = mangas
            .map(manga => getTranslatedManga(manga, language))
            .filter(Boolean);

        const totalPages = Math.ceil(total / take);

        res.status(200).json({
            data: translatedMangas,
            pagination: {
                total,
                page,
                limit: take,
                totalPages,
                next: page < totalPages,
                prev: page > 1,
            },
        });
    } catch (err) {
        handleZodError(err, res)
    }
};

// Mais curtidos
export const getMostLiked: RequestHandler = async (req, res) => {
    const { skip, take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';

    try {
        const [mangas, total] = await Promise.all([
            prisma.manga.findMany({
                skip,
                take,
                where: {
                    translations: {
                        some: {
                            language: language
                        }
                    }
                },
                orderBy: {
                    likes: {
                        _count: 'desc',
                    },
                },
                include: {
                    translations: true,
                    categories: true,
                    _count: {
                        select: { likes: true, views: true },
                    },
                },
            }),
            prisma.manga.count({
                where: {
                    translations: {
                        some: {
                            language: language
                        }
                    }
                }
            }),
        ]);

        const translatedMangas = mangas
            .map(manga => getTranslatedManga(manga, language))
            .filter(Boolean);

        const totalPages = Math.ceil(total / take);

        res.status(200).json({
            data: translatedMangas,
            pagination: {
                total,
                page,
                limit: take,
                totalPages,
                next: page < totalPages,
                prev: page > 1,
            },
        });
    } catch (err) {
        handleZodError(err, res)
    }
};

// Feed personalizado baseado nas categorias favoritas do usuário
export const getFeed: RequestHandler = async (req, res) => {
    const { skip, take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { categories: true },
        });

        if (!user || user.categories.length === 0) {
            res.status(200).json([]);
            return;
        }

        const categoryIds = user.categories.map((cat) => cat.id);

        const [mangas, total] = await Promise.all([
            prisma.manga.findMany({
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
                take,
            }),
            prisma.manga.count({
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
            }),
        ]);

        const translatedMangas = mangas
            .map(manga => getTranslatedManga(manga, language))
            .filter(Boolean);

        const totalPages = Math.ceil(total / take);

        res.status(200).json({
            data: translatedMangas,
            pagination: {
                total,
                page,
                limit: take,
                totalPages,
                next: page < totalPages,
                prev: page > 1,
            },
        });
    } catch (err) {
        handleZodError(err, res)
    }
};