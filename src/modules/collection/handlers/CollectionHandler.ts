import prisma from '@/prisma/client';
import { checkUserCanEdit, checkUserCanView } from './CollaboratorHandler';

export const createCollection = async (data: {
    userId: string;
    name: string;
    cover?: string;
    description?: string;
    status: 'PRIVATE' | 'PUBLIC';
    pinned?: boolean;
    mangaIds?: string[];
}) => {
    const { userId, name, cover, description, status, pinned, mangaIds } = data;

    return await prisma.collection.create({
        data: {
            userId,
            name,
            cover: cover ?? '',
            description,
            status,
            pinned: pinned ?? false,
            collectionMangas: mangaIds && mangaIds.length > 0
                ? {
                    create: mangaIds.map((mangaId: string) => ({
                        mangaId,
                        addedBy: userId,
                    })),
                }
                : undefined,
        },
        include: {
            collectionMangas: {
                include: {
                    manga: true,
                    addedByUser: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
                        }
                    }
                }
            },
            _count: { select: { likes: true } },
        },
    });
};

export const listCollections = async (userId: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    // Buscar coleções onde o usuário é dono ou colaborador
    const [collections, total] = await Promise.all([
        prisma.collection.findMany({
            where: {
                OR: [
                    { userId }, // Coleções do usuário
                    {
                        collaborators: {
                            some: {
                                userId
                            }
                        }
                    } // Coleções onde é colaborador
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    }
                },
                collaborators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true,
                            }
                        }
                    }
                },
                _count: { 
                    select: { 
                        likes: true,
                        collectionMangas: true,
                        collaborators: true
                    } 
                },
            },
            skip,
            take,
            orderBy: [
                { pinned: "desc" },
                { createdAt: "desc" }
            ],
        }),
        prisma.collection.count({
            where: {
                OR: [
                    { userId },
                    {
                        collaborators: {
                            some: {
                                userId
                            }
                        }
                    }
                ]
            }
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

export const getCollection = async (id: string, userId: string, language: string = 'pt-BR') => {
    // Verificar permissões de visualização
    await checkUserCanView(id, userId);

    const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
            collectionMangas: {
                include: {
                    manga: {
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
                    addedByUser: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
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
            collaborators: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
                        }
                    }
                }
            }
        },
    });

    if (!collection) {
        throw new Error('Coleção não encontrada.');
    }

    // Transforma o array de traduções em um único objeto com o nome do mangá
    const collectionWithMangaNames = {
        ...collection,
        mangas: collection.collectionMangas.map(collectionManga => {
            const manga = collectionManga.manga;
            const translationInLanguage = manga.translations.find((t: any) => t.language === language);
            const translation = translationInLanguage || manga.translations[0];

            return {
                ...manga,
                name: translation?.name || 'Sem nome',
                addedBy: collectionManga.addedBy,
                addedByUser: collectionManga.addedByUser,
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
    status?: 'PRIVATE' | 'PUBLIC';
    pinned?: boolean;
}) => {
    // Verificar permissões de edição
    await checkUserCanEdit(id, userId);

    const collection = await prisma.collection.findUnique({
        where: { id },
    });

    if (!collection) {
        throw new Error('Coleção não encontrada.');
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

    // Apenas o dono pode deletar a coleção
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
            where: { status: 'PUBLIC' },
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
            orderBy: [
                { pinned: "desc" },
                { createdAt: "desc" }
            ],
            skip,
            take,
        }),
        prisma.collection.count({
            where: { status: 'PUBLIC' },
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
            where: {
                OR: [
                    { userId }, // Coleções do usuário
                    {
                        collaborators: {
                            some: {
                                userId
                            }
                        }
                    } // Coleções onde é colaborador
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    }
                },
                collaborators: {
                    where: { userId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true,
                            }
                        }
                    }
                },
                collectionMangas: {
                    where: {
                        mangaId: mangaId
                    }
                },
                                _count: { 
                    select: { 
                        likes: true,
                        collectionMangas: true
                    } 
                }
            },
            skip,
            take,
            orderBy: { createdAt: "desc" }
        }),
        prisma.collection.count({
            where: {
                OR: [
                    { userId },
                    {
                        collaborators: {
                            some: {
                                userId
                            }
                        }
                    }
                ]
            }
        })
    ]);

    const totalPages = Math.ceil(total / take);

    const formattedCollections = collections.map(collection => ({
        ...collection,
        isIncluded: collection.collectionMangas.length > 0,
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
    // Verificar permissões de edição
    await checkUserCanEdit(collectionId, userId);

    const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
            collectionMangas: {
                where: {
                    mangaId: mangaId
                }
            }
        }
    });

    if (!collection) {
        throw new Error('Coleção não encontrada');
    }

    const isMangaInCollection = collection.collectionMangas.length > 0;

    const updatedCollection = await prisma.collection.update({
        where: { id: collectionId },
        data: {
            collectionMangas: {
                [isMangaInCollection ? 'deleteMany' : 'create']: isMangaInCollection 
                    ? { mangaId: mangaId }
                    : { mangaId: mangaId, addedBy: userId }
            }
        },
        include: {
            collectionMangas: {
                include: {
                    manga: true,
                    addedByUser: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
                        }
                    }
                }
            },
            _count: {
                select: {
                    likes: true,
                    collectionMangas: true
                }
            }
        }
    });

    return {
        ...updatedCollection,
        action: isMangaInCollection ? 'removed' : 'added'
    };
};

export const togglePinnedCollection = async (id: string, userId: string) => {
    // Verificar se a coleção existe e se o usuário tem permissão para editá-la
    const canEdit = await checkUserCanEdit(id, userId);
    if (!canEdit) {
        throw new Error('Você não tem permissão para editar esta coleção.');
    }

    // Buscar a coleção atual para obter o valor atual de pinned
    const collection = await prisma.collection.findUnique({
        where: { id },
        select: { pinned: true }
    });

    if (!collection) {
        throw new Error('Coleção não encontrada.');
    }

    // Alternar o valor de pinned
    const updatedCollection = await prisma.collection.update({
        where: { id },
        data: { pinned: !collection.pinned },
        select: { pinned: true }
    });

    return updatedCollection;
};

export const searchCollectionsByName = async (query: string, userId: string, page = 1, take = 10) => {
    const skip = (page - 1) * take;

    // Buscar coleções públicas ou coleções onde o usuário é dono/colaborador
    const collections = await prisma.collection.findMany({
        where: {
            name: {
                contains: query,
                mode: 'insensitive'
            },
            OR: [
                { status: 'PUBLIC' },
                { userId },
                {
                    collaborators: {
                        some: {
                            userId
                        }
                    }
                }
            ]
        },
        orderBy: [
            { pinned: 'desc' },
            { createdAt: 'desc' }
        ],
        skip,
        take,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                }
            },
            _count: {
                select: {
                    likes: true,
                    collectionMangas: true,
                    collaborators: true
                }
            }
        }
    });

    const total = await prisma.collection.count({
        where: {
            name: {
                contains: query,
                mode: 'insensitive'
            },
            OR: [
                { status: 'PUBLIC' },
                { userId },
                {
                    collaborators: {
                        some: {
                            userId
                        }
                    }
                }
            ]
        }
    });

    return {
        collections,
        pagination: {
            total,
            page,
            take,
            pages: Math.ceil(total / take)
        }
    };
};