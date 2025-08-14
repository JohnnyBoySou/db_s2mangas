import prisma from '@/prisma/client';

export const upsertLibraryEntry = async (data: {
    userId: string;
    mangaId: string;
    isRead?: boolean;
    isLiked?: boolean;
    isFollowed?: boolean;
    isComplete?: boolean;
}) => {
    const { userId, mangaId, isRead, isLiked, isFollowed, isComplete } = data;

    return await prisma.libraryEntry.upsert({
        where: {
            userId_mangaId: {
                userId,
                mangaId,
            },
        },
        update: {
            isRead,
            isLiked,
            isFollowed,
            isComplete,
        },
        create: {
            userId,
            mangaId,
            isRead: isRead ?? false,
            isLiked: isLiked ?? false,
            isFollowed: isFollowed ?? false,
            isComplete: isComplete ?? false,
        },
    });
};

export const updateLibraryEntry = async (data: {
    userId: string;
    mangaId: string;
    isRead?: boolean;
    isLiked?: boolean;
    isFollowed?: boolean;
    isComplete?: boolean;
}) => {
    const { userId, mangaId, ...updateData } = data;

    return await prisma.libraryEntry.update({
        where: {
            userId_mangaId: {
                userId,
                mangaId,
            },
        },
        data: updateData,
    });
};

export const removeLibraryEntry = async (userId: string, mangaId: string) => {
    await prisma.libraryEntry.delete({
        where: {
            userId_mangaId: {
                userId,
                mangaId,
            },
        },
    });
};

export const listLibrary = async (userId: string, type: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    // Define o filtro baseado no tipo
    const whereClause = {
        userId,
        ...(type === 'progress' && { isRead: true }),
        ...(type === 'complete' && { isComplete: true }),
        ...(type === 'favorite' && { isLiked: true }),
        ...(type === 'following' && { isFollowed: true })
    };

    // Se o tipo não for válido, retorna erro
    if (!['progress', 'complete', 'favorite', 'following'].includes(type)) {
        throw new Error('Tipo de biblioteca inválido');
    }

    const [entries, total] = await Promise.all([
        prisma.libraryEntry.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                manga: {
                    select: {
                        id: true,
                        manga_uuid: true,
                        cover: true,
                        translations: {
                            select: {
                                name: true,
                                language: true
                            }
                        },
                        _count: {
                            select: { views: true }
                        }
                    }
                }
            },
        }),
        prisma.libraryEntry.count({
            where: whereClause
        }),
    ]);

    const totalPages = Math.ceil(total / take);

    const formattedEntries = entries.map(entry => {
        return {
            ...entry,
            manga: {
                id: entry.manga.id,
                manga_uuid: entry.manga.manga_uuid,
                title: entry.manga.translations[0]?.name || 'Sem título',
                cover: entry.manga.cover,
                views_count: entry.manga._count.views
            }
        };
    });

    return {
        data: formattedEntries,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages ? page + 1 : null,
            prev: page > 1 ? page - 1 : null,
        },
    };
};

export const toggleLibraryEntry = async (data: {
    userId: string;
    mangaId: string;
    type: 'progress' | 'complete' | 'favorite' | 'following';
}) => {
    const { userId, mangaId, type } = data;

    // Mapeia o tipo para o campo correspondente
    const typeToField = {
        'progress': 'isRead',
        'complete': 'isComplete',
        'favorite': 'isLiked',
        'following': 'isFollowed'
    } as const;

    const field = typeToField[type];

    // Verifica se o mangá existe
    const mangaExists = await prisma.manga.findUnique({
        where: { id: mangaId }
    });

    if (!mangaExists) {
        throw new Error('Mangá não encontrado');
    }

    // Busca a entrada atual
    const currentEntry = await prisma.libraryEntry.findUnique({
        where: {
            userId_mangaId: {
                userId,
                mangaId,
            },
        },
    });

    if (currentEntry) {
        // Se existe, inverte o valor atual
        return await prisma.libraryEntry.update({
            where: {
                userId_mangaId: {
                    userId,
                    mangaId,
                },
            },
            data: {
                [field]: !currentEntry[field]
            },
        });
    } else {
        // Se não existe, cria com o valor true para o tipo especificado
        return await prisma.libraryEntry.create({
            data: {
                userId,
                mangaId,
                [field]: true
            },
        });
    }
};

export const checkMangaStatus = async (userId: string, mangaId: string) => {
    const entry = await prisma.libraryEntry.findUnique({
        where: {
            userId_mangaId: {
                userId,
                mangaId,
            },
        },
        select: {
            isRead: true,
            isLiked: true,
            isFollowed: true,
            isComplete: true
        }
    });

    return {
        isRead: entry?.isRead ?? false,
        isLiked: entry?.isLiked ?? false,
        isFollowed: entry?.isFollowed ?? false,
        isComplete: entry?.isComplete ?? false
    };
};
