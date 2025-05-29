import { RequestHandler } from 'express';
import prisma from '@/prisma/client';
import { handleZodError } from '@/utils/zodError';
import { z } from 'zod';
import countries from 'i18n-iso-countries';

countries.registerLocale(require('i18n-iso-countries/langs/pt.json'));

const MangaStatus = {
    ONGOING: 'Em andamento',
    COMPLETED: 'Completo',
    DROPPED: 'Descontinuado',
    HIATUS: 'Em hiato',
    ANNOUNCED: 'Anunciado',
} as const;

const MangaType = {
    MANGA: 'Manga',
    MANHWA: 'Manhwa',
    MANHUA: 'Manhua',
    WEBTOON: 'Webtoon',
} as const;

const MangaOrder = {
    MOST_VIEWED: 'most_viewed',
    MOST_LIKED: 'most_liked',
    MOST_RECENT: 'most_recent',
} as const;

const advancedSearchSchema = z.object({
    name: z.string().optional(),
    categories: z.array(z.string()).optional(),
    status: z.enum([MangaStatus.ONGOING, MangaStatus.COMPLETED, MangaStatus.DROPPED, MangaStatus.HIATUS, MangaStatus.ANNOUNCED]).optional(),
    type: z.enum([MangaType.MANGA, MangaType.MANHWA, MangaType.MANHUA, MangaType.WEBTOON]).optional(),
    languages: z.array(z.string()).optional(),
    orderBy: z.enum([MangaOrder.MOST_VIEWED, MangaOrder.MOST_LIKED, MangaOrder.MOST_RECENT]).default(MangaOrder.MOST_RECENT),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('10'),
});

export const searchManga: RequestHandler = async (req, res) => {
    const {
        name,
        category,
        status,
        type,
        page = 1,
        limit = 10,
    } = req.body;

    const language = req.params.lg || 'pt-BR';
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * limitNumber;

    try {
        const filters: any = {};

        if (name && typeof name === 'string') {
            const searchTerms = name.toLowerCase().split(' ').filter(term => term.length > 0);
            
            filters.translations = {
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

        if (category && typeof category === 'string') {
            filters.categories = {
                some: {
                    name: {
                        equals: category,
                        mode: 'insensitive',
                    },
                },
            };
        }

        if (status && typeof status === 'string') {
            filters.status = {
                equals: status,
                mode: 'insensitive',
            };
        }

        if (type && typeof type === 'string') {
            filters.type = {
                equals: type,
                mode: 'insensitive',
            };
        }

        const [mangas, total] = await Promise.all([
            prisma.manga.findMany({
                where: filters,
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
            prisma.manga.count({ where: filters }),
        ]);

        const totalPages = Math.ceil(total / limitNumber);

        // Formatar a resposta para incluir apenas a tradução do idioma solicitado
        const formattedMangas = mangas.map(manga => ({
            ...manga,
            title: manga.translations[0]?.name ?? 'Sem título',
            description: manga.translations[0]?.description ?? '',
            translations: undefined,
        }));

        res.status(200).json({
            data: formattedMangas,
            pagination: {
                total,
                to: pageNumber * limitNumber,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                next: pageNumber < totalPages,
                prev: pageNumber > 1,
            },
        });
    } catch (err) {
        console.log(err);
        handleZodError(err, res);
    }
};

export const listCategories: RequestHandler = async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc',
            },
        });

        res.status(200).json(categories);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const searchCategories: RequestHandler = async (req, res) => {
    const { name, page = 1, limit = 10 } = req.body;
    const language = req.params.lg || 'pt-BR';

    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
        return
    }

    try {
        const pageNumber = Math.max(1, parseInt(page, 10));
        const limitNumber = Math.max(1, Math.min(50, parseInt(limit, 10)));
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

        // Formatar a resposta para incluir apenas a tradução do idioma solicitado
        const formattedMangas = mangas.map(manga => ({
            ...manga,
            title: manga.translations[0]?.name ?? 'Sem título',
            description: manga.translations[0]?.description ?? '',
            translations: undefined,
        }));

        res.status(200).json({
            data: formattedMangas,
            pagination: {
                total,
                to: pageNumber * limitNumber,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                next: pageNumber < totalPages,
                prev: pageNumber > 1,
            },
        });
    } catch (err) {
        handleZodError(err, res);
    }
};

export const searchAdvanced: RequestHandler = async (req, res) => {
    try {
        const validatedData = advancedSearchSchema.parse(req.body);
        const language = req.params.lg || 'pt-BR';
        
        const {
            name,
            categories,
            status,
            type,
            languages,
            orderBy,
            page,
            limit,
        } = validatedData;

        const pageNumber = Math.max(1, page);
        const limitNumber = Math.max(1, Math.min(50, limit));
        const skip = (pageNumber - 1) * limitNumber;

        const filters: any = {};

        // Busca por nome (incluindo traduções)
        if (name) {
            filters.translations = {
                some: {
                    AND: [
                        {
                            language: {
                                equals: language,
                                mode: 'insensitive',
                            },
                        },
                        {
                            OR: [
                                {
                                    name: {
                                        contains: name,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    description: {
                                        contains: name,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                    ],
                },
            };
        }

        // Busca por múltiplas categorias
        if (categories && categories.length > 0) {
            filters.categories = {
                some: {
                    name: {
                        in: categories,
                        mode: 'insensitive',
                    },
                },
            };
        }

        // Busca por status
        if (status) {
            filters.status = {
                equals: status,
                mode: 'insensitive',
            };
        }

        // Busca por tipo
        if (type) {
            filters.type = {
                equals: type,
                mode: 'insensitive',
            };
        }

        // Busca por múltiplos idiomas
        if (languages && languages.length > 0) {
            filters.languages = {
                some: {
                    code: {
                        in: languages,
                        mode: 'insensitive',
                    },
                },
            };
        }

        // Configuração de ordenação
        let orderByConfig: any = {};
        switch (orderBy) {
            case MangaOrder.MOST_RECENT:
                orderByConfig = { createdAt: 'desc' };
                break;
            case MangaOrder.MOST_VIEWED:
                orderByConfig = { views: { _count: 'desc' } };
                break;
            case MangaOrder.MOST_LIKED:
                orderByConfig = { likes: { _count: 'desc' } };
                break;
        }

        // Buscar mangás com os filtros e ordenação
        const [mangas, total] = await Promise.all([
            prisma.manga.findMany({
                where: filters,
                skip,
                take: limitNumber,
                orderBy: orderByConfig,
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
                    languages: true,
                    _count: {
                        select: {
                            views: true,
                            likes: true,
                        },
                    },
                },
            }),
            prisma.manga.count({ where: filters }),
        ]);

        const totalPages = Math.ceil(total / limitNumber);

        // Formatar a resposta
        const formattedMangas = mangas.map(manga => ({
            ...manga,
            title: manga.translations[0]?.name ?? 'Sem título',
            description: manga.translations[0]?.description ?? '',
            viewCount: manga._count.views,
            likeCount: manga._count.likes,
            _count: undefined,
        }));

        res.status(200).json({
            data: formattedMangas,
            pagination: {
                total,
                to: pageNumber * limitNumber,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                next: pageNumber < totalPages,
                prev: pageNumber > 1,
            },
        });
    } catch (err) {
        console.log(err)
        handleZodError(err, res);
    }
};

export const listTypes: RequestHandler = async (_req, res) => {
    try {
        // Busca todos os tipos únicos de mangá
        const types = await prisma.manga.findMany({
            select: {
                type: true,
            },
            distinct: ['type'],
            orderBy: {
                type: 'asc',
            },
        });

        // Formata a resposta para retornar apenas os tipos
        const formattedTypes = types
            .map(item => item.type)
            .filter(type => type !== null)
            .sort((a, b) => a.localeCompare(b, 'pt-BR'));

        res.status(200).json(formattedTypes);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const listLanguages: RequestHandler = async (_req, res) => {
    try {
        const languages = await prisma.language.findMany({
            select: {
                code: true,
            },
            orderBy: {
                code: 'asc',
            },
        });

        const formattedLanguages = languages.map(lang => ({
            code: lang.code,
            name: countries.getName(lang.code, 'pt')
        }));

        res.status(200).json(formattedLanguages);
    } catch (err) {
        handleZodError(err, res);
    }
};
