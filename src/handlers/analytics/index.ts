import prisma from '@/prisma/client';

interface DateRange {
    startDate: Date;
    endDate: Date;
}

export const getGeneralStats = async () => {
    const [
        totalUsers,
        totalMangas,
        totalChapters,
        totalViews,
        totalLikes,
        totalComments
    ] = await Promise.all([
        prisma.user.count(),
        prisma.manga.count(),
        prisma.chapter.count(),
        prisma.view.count(),
        prisma.like.count(),
        prisma.comment.count()
    ]);

    return {
        totalUsers,
        totalMangas,
        totalChapters,
        totalViews,
        totalLikes,
        totalComments
    };
};

export const getViewsByPeriod = async ({ startDate, endDate }: DateRange) => {
    const views = await prisma.view.groupBy({
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

    return views.map(view => ({
        date: view.createdAt,
        count: view._count._all
    }));
};

export const getMostViewedMangas = async (limit = 10) => {
    const mangas = await prisma.manga.findMany({
        take: limit,
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

    return mangas.map(manga => ({
        id: manga.id,
        title: manga.translations[0]?.name ?? 'Sem título',
        views: manga._count.views,
        likes: manga._count.likes,
        comments: manga._count.comments
    }));
};

export const getMostLikedMangas = async (limit = 10) => {
    const mangas = await prisma.manga.findMany({
        take: limit,
        orderBy: {
            likes: {
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

    return mangas.map(manga => ({
        id: manga.id,
        title: manga.translations[0]?.name ?? 'Sem título',
        views: manga._count.views,
        likes: manga._count.likes,
        comments: manga._count.comments
    }));
};

export const getMostCommentedMangas = async (limit = 10) => {
    const mangas = await prisma.manga.findMany({
        take: limit,
        orderBy: {
            comments: {
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

    return mangas.map(manga => ({
        id: manga.id,
        title: manga.translations[0]?.name ?? 'Sem título',
        views: manga._count.views,
        likes: manga._count.likes,
        comments: manga._count.comments
    }));
};

export const getUsersByPeriod = async ({ startDate, endDate }: DateRange) => {
    const users = await prisma.user.groupBy({
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

    return users.map(user => ({
        date: user.createdAt,
        count: user._count._all
    }));
};

export const getMostActiveUsers = async (limit = 10) => {
    const users = await prisma.user.findMany({
        take: limit,
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

    return users.map(user => ({
        id: user.id,
        name: user.name,
        views: user._count.views,
        likes: user._count.likes,
        comments: user._count.comments,
        totalActivity: user._count.views + user._count.likes + user._count.comments
    })).sort((a, b) => b.totalActivity - a.totalActivity);
};

export const getCategoryStats = async () => {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: {
                    mangas: true
                }
            }
        }
    });

    return categories.map(category => ({
        name: category.name,
        mangaCount: category._count.mangas
    })).sort((a, b) => b.mangaCount - a.mangaCount);
};

export const getLanguageStats = async () => {
    const languages = await prisma.language.findMany({
        include: {
            _count: {
                select: {
                    mangas: true
                }
            }
        }
    });

    return languages.map(language => ({
        code: language.code,
        mangaCount: language._count.mangas
    })).sort((a, b) => b.mangaCount - a.mangaCount);
};

export const getMangaTypeStats = async () => {
    const types = await prisma.manga.groupBy({
        by: ['type'],
        _count: {
            _all: true
        }
    });

    return types.map(type => ({
        type: type.type,
        count: type._count._all
    })).sort((a, b) => b.count - a.count);
};

export const getMangaStatusStats = async () => {
    const statuses = await prisma.manga.groupBy({
        by: ['status'],
        _count: {
            _all: true
        }
    });

    return statuses.map(status => ({
        status: status.status,
        count: status._count._all
    })).sort((a, b) => b.count - a.count);
}; 