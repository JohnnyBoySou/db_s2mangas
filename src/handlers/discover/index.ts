import prisma from '@/prisma/client';

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

export const getRecent = async (language: string, page: number, take: number) => {
    const skip = (page - 1) * take;

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
                        name: true,
                        description: true
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
        title: manga.translations[0]?.name ?? '',
        description: manga.translations[0]?.description ?? '',
        cover: manga.cover,
        views_count: manga._count.views
    }));

    const totalPages = Math.ceil(total / take);

    return {
        data: formattedMangas,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        },
    };
};

export const getMostViewed = async (language: string, page: number, take: number) => {
    const skip = (page - 1) * take;

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

    return {
        data: translatedMangas,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        },
    };
};

export const getMostLiked = async (language: string, page: number, take: number) => {
    const skip = (page - 1) * take;

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

    return {
        data: translatedMangas,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        },
    };
};

export const getFeed = async (userId: string, language: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { categories: true },
    });

    if (!user || user.categories.length === 0) {
        return {
            data: [],
            pagination: {
                total: 0,
                page,
                limit: take,
                totalPages: 0,
                next: false,
                prev: false,
            },
        };
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

    return {
        data: translatedMangas,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        },
    };
};

export const getIA = async (userId: string, language: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    // Busca o usuário com suas preferências
    const user = await prisma.user.findUnique({
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
    });

    if (!user) {
        return {
            data: [],
            pagination: {
                total: 0,
                page,
                limit: take,
                totalPages: 0,
                next: false,
                prev: false,
            },
        };
    }

    // Extrai categorias dos mangás visualizados e curtidos
    const viewedCategories = user.views.flatMap(view => 
        view.manga.categories.map(cat => cat.id)
    );
    const likedCategories = user.likes.flatMap(like => 
        like.manga.categories.map(cat => cat.id)
    );

    // Combina todas as categorias relevantes
    const relevantCategories = [...new Set([
        ...user.categories.map(cat => cat.id),
        ...viewedCategories,
        ...likedCategories
    ])];

    // Busca mangás que correspondem aos critérios
    const [mangas, total] = await Promise.all([
        prisma.manga.findMany({
            where: {
                categories: {
                    some: {
                        id: {
                            in: relevantCategories
                        }
                    }
                },
                translations: {
                    some: {
                        language: language
                    }
                },
                // Exclui mangás já visualizados
                id: {
                    notIn: user.views.map(view => view.mangaId)
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
            take
        }),
        prisma.manga.count({
            where: {
                categories: {
                    some: {
                        id: {
                            in: relevantCategories
                        }
                    }
                },
                translations: {
                    some: {
                        language: language
                    }
                },
                id: {
                    notIn: user.views.map(view => view.mangaId)
                }
            }
        })
    ]);

    const translatedMangas = mangas
        .map(manga => getTranslatedManga(manga, language))
        .filter(Boolean);

    const totalPages = Math.ceil(total / take);

    return {
        data: translatedMangas,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        },
    };
};


