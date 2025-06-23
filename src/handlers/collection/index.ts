import { CollectionStatus } from '@prisma/client';
import prisma from '@/prisma/client';

export const createCollection = async (data: {
    userId: string;
    name: string;
    cover?: string;
    description?: string;
    status: CollectionStatus;
    mangaIds?: string[];
}) => {
    const { userId, name, cover, description, status, mangaIds } = data;

    return await prisma.collection.create({
        data: {
            userId,
            name,
            cover: cover ?? '',
            description,
            status,
            mangas: mangaIds && mangaIds.length > 0
                ? {
                    connect: mangaIds.map((id: string) => ({ id })),
                }
                : undefined,
        },
        include: {
            mangas: true,
            _count: { select: { likes: true } },
        },
    });
};

export const listCollections = async (userId: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    const [collections, total] = await Promise.all([
        prisma.collection.findMany({
            where: { userId },
            include: {
                _count: { 
                    select: { 
                        likes: true,
                        mangas: true 
                    } 
                },
            },
            skip,
            take,
            orderBy: { createdAt: "desc" },
        }),
        prisma.collection.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
        data: collections,
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

export const getCollection = async (id: string, userId: string, language: string = 'pt-BR') => {
    const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
            mangas: {
                select: {
                    id: true,
                    cover: true,
                    translations: {
                        select: {
                            name: true,
                            language: true
                        }
                    }
                }
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    username: true,
                }
            },
            likes: true,
        },
    });

    if (!collection) {
        throw new Error('Coleção não encontrada.');
    }

    if (collection.userId !== userId) {
        throw new Error('Você não tem permissão para visualizar esta coleção.');
    }

    // Transforma o array de traduções em um único objeto com o nome do mangá
    const collectionWithMangaNames = {
        ...collection,
        mangas: collection.mangas.map(manga => {
            const translationInLanguage = manga.translations.find(t => t.language === language);
            const translation = translationInLanguage || manga.translations[0];

            return {
                ...manga,
                name: translation?.name || 'Sem nome',
                translations: undefined 
            };
        })
    };

    return collectionWithMangaNames;
};

export const updateCollection = async (id: string, userId: string, data: {
    name?: string;
    cover?: string;
    description?: string;
    status?: CollectionStatus;
}) => {
    const collection = await prisma.collection.findUnique({
        where: { id },
    });

    if (!collection) {
        throw new Error('Coleção não encontrada.');
    }

    if (collection.userId !== userId) {
        throw new Error('Você não tem permissão para editar esta coleção.');
    }

    return await prisma.collection.update({
        where: { id },
        data,
    });
};

export const deleteCollection = async (id: string, userId: string) => {
    const collection = await prisma.collection.findUnique({
        where: { id },
    });

    if (!collection) {
        throw new Error('Coleção não encontrada.');
    }

    if (collection.userId !== userId) {
        throw new Error('Você não tem permissão para deletar esta coleção.');
    }

    await prisma.collection.delete({
        where: { id },
    });
};

export const listPublicCollections = async (page: number, take: number) => {
    const skip = (page - 1) * take;

    const [collections, total] = await Promise.all([
        prisma.collection.findMany({
            where: { status: CollectionStatus.PUBLIC },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                _count: { select: { likes: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.collection.count({
            where: { status: CollectionStatus.PUBLIC },
        }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
        data: collections,
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

export const checkMangaInCollections = async (mangaId: string, userId: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    const [collections, total] = await Promise.all([
        prisma.collection.findMany({
            where: { userId },
            include: {
                mangas: {
                    where: {
                        id: mangaId
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        mangas: true
                    }
                }
            },
            skip,
            take,
            orderBy: { createdAt: "desc" }
        }),
        prisma.collection.count({
            where: { userId }
        })
    ]);

    const totalPages = Math.ceil(total / take);

    const formattedCollections = collections.map(collection => ({
        ...collection,
        isIncluded: collection.mangas.length > 0,
        mangas: undefined
    }));

    return {
        data: formattedCollections,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        }
    };
};

export const toggleMangaInCollection = async (collectionId: string, mangaId: string, userId: string) => {
    const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
            mangas: {
                where: {
                    id: mangaId
                }
            }
        }
    });

    if (!collection) {
        throw new Error('Coleção não encontrada');
    }

    if (collection.userId !== userId) {
        throw new Error('Você não tem permissão para modificar esta coleção');
    }

    const isMangaInCollection = collection.mangas.length > 0;

    const updatedCollection = await prisma.collection.update({
        where: { id: collectionId },
        data: {
            mangas: {
                [isMangaInCollection ? 'disconnect' : 'connect']: { id: mangaId }
            }
        },
        include: {
            mangas: true,
            _count: {
                select: {
                    likes: true,
                    mangas: true
                }
            }
        }
    });

    return {
        ...updatedCollection,
        action: isMangaInCollection ? 'removed' : 'added'
    };
}; 