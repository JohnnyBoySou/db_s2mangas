import prisma from '@/prisma/client';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT, MANGA_TYPE } from '@/constants/search';

interface SearchFilters {
    name?: string;
    category?: string;
    status?: string;
    type?: string;
    language?: string;
    page?: number;
    limit?: number;
}

export const searchManga = async (filters: SearchFilters) => {
    const {
        name,
        category,
        status,
        type,
        page = DEFAULT_PAGE,
        limit = DEFAULT_LIMIT,
        language = 'pt-BR'
    } = filters;

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, Math.min(MAX_LIMIT, limit));
    const skip = (pageNumber - 1) * limitNumber;

    const dbFilters: any = {};

    if (name) {
        const searchTerms = name.toLowerCase().split(' ').filter(term => term.length > 0);
        
        dbFilters.translations = {
            some: {
                AND: [
                    {
                        language: {
                            equals: language,
                            mode: 'insensitive',
                        },
                    },
                    {
                        OR: searchTerms.map(term => ({
                            OR: [
                                {
                                    name: {
                                        contains: term,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    description: {
                                        contains: term,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        })),
                    },
                ],
            },
        };
    }

    if (category) {
        dbFilters.categories = {
            some: {
                name: {
                    equals: category,
                    mode: 'insensitive',
                },
            },
        };
    }

    if (status) {
        dbFilters.status = {
            equals: status,
            mode: 'insensitive',
        };
    }

    if (type) {
        dbFilters.type = {
            equals: type,
            mode: 'insensitive',
        };
    }

    const [mangas, total] = await Promise.all([
        prisma.manga.findMany({
            where: dbFilters,
            skip,
            take: limitNumber,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                translations: {
                    where: {
                        language: {
                            equals: language,
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
        }),
        prisma.manga.count({ where: dbFilters }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
        data: mangas.map(manga => ({
            ...manga,
            title: manga.translations[0]?.name ?? 'Sem título',
            description: manga.translations[0]?.description ?? '',
            translations: undefined,
        })),
        pagination: {
            total,
            to: pageNumber * limitNumber,
            page: pageNumber,
            limit: limitNumber,
            totalPages,
            next: pageNumber < totalPages,
            prev: pageNumber > 1,
        },
    };
};

export const listCategories = async () => {
    return prisma.category.findMany({
        orderBy: {
            name: 'asc',
        },
    });
};

export const searchCategories = async (name: string, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, language = 'pt-BR') => {
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.max(1, Math.min(MAX_LIMIT, limit));
    const skip = (pageNumber - 1) * limitNumber;

    const [mangas, total] = await Promise.all([
        prisma.manga.findMany({
            where: {
                categories: {
                    some: {
                        name: {
                            contains: name,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            include: {
                translations: {
                    where: {
                        language: {
                            equals: language,
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
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limitNumber,
        }),
        prisma.manga.count({
            where: {
                categories: {
                    some: {
                        name: {
                            contains: name,
                            mode: 'insensitive',
                        },
                    },
                },
            },
        }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
        data: mangas.map(manga => ({
            ...manga,
            title: manga.translations[0]?.name ?? 'Sem título',
            description: manga.translations[0]?.description ?? '',
            translations: undefined,
        })),
        pagination: {
            total,
            to: pageNumber * limitNumber,
            page: pageNumber,
            limit: limitNumber,
            totalPages,
            next: pageNumber < totalPages,
            prev: pageNumber > 1,
        },
    };
};

export const listTypes = async () => {
    return Object.values(MANGA_TYPE);
};

export const listLanguages = async () => {
    return prisma.language.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}; 