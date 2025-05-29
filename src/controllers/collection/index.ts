import { RequestHandler } from 'express';
import prisma from '@/prisma/client';
import { CollectionStatus } from '@prisma/client';
import {
    createCollectionSchema,
    updateCollectionSchema,
    collectionIdSchema,
} from '@/schemas/collectionSchemas';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';

export const create: RequestHandler = async (req, res) => {
    console.log('Headers:', req.headers);
    console.log('User:', (req as any).user);
    
    const parsed = createCollectionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }
    const userId = (req as any).user?.id;
    console.log('UserId:', userId);
    
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return
    }

    try {
        const { name, cover, description, status, mangaIds } = parsed.data;

        const collection = await prisma.collection.create({
            data: {
                userId,
                name,
                cover,
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

        res.status(201).json(collection);
    } catch (err) {
        console.error('Erro ao criar coleção:', err);
        handleZodError(err, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    const { skip, take, page } = getPaginationParams(req);

    try {
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

        res.status(200).json({
            data: collections,
            pagination: {
                total,
                page,
                limit: take,
                totalPages,
                next: page < totalPages,
                prev: page > 1,
            },
        });

        return
    } catch (err) {
        handleZodError(err, res)
    }
};

export const get: RequestHandler = async (req, res) => {
    const parsed = collectionIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return
    }

    const userId = (req as any).user?.id;

    try {
        const collection = await prisma.collection.findUnique({
            where: { id: parsed.data.id },
            include: {
                mangas: true,
                user: true,
                likes: true,
            },
        });

        if (!collection) {
            res.status(404).json({ error: 'Coleção não encontrada.' });
            return
        }

        if (collection.userId !== userId) {
            res.status(403).json({ error: 'Você não tem permissão para visualizar esta coleção.' });
            return;
        }

        res.json(collection);
        return
    } catch (err) {
        handleZodError(err, res)
    }
};

export const update: RequestHandler = async (req, res) => {
    const parsed = updateCollectionSchema.safeParse({ ...req.body, ...req.params });
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return
    }

    const { id, ...data } = parsed.data;
    const userId = (req as any).user?.id;

    try {
        const collection = await prisma.collection.findUnique({
            where: { id },
        });

        if (!collection) {
            res.status(404).json({ error: 'Coleção não encontrada.' });
            return
        }

        if (collection.userId !== userId) {
            res.status(403).json({ error: 'Você não tem permissão para editar esta coleção.' });
            return
        }

        const updated = await prisma.collection.update({
            where: { id },
            data,
        });

        res.json(updated);
        return
    } catch (err) {

        handleZodError(err, res)
    }
};

export const remove: RequestHandler = async (req, res) => {
    const parsed = collectionIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return
    }

    const userId = (req as any).user?.id;

    try {
        const collection = await prisma.collection.findUnique({
            where: { id: parsed.data.id },
        });

        if (!collection) {
            res.status(404).json({ error: 'Coleção não encontrada.' });
            return
        }

        if (collection.userId !== userId) {
            res.status(403).json({ error: 'Você não tem permissão para deletar esta coleção.' });
            return
        }

        await prisma.collection.delete({
            where: { id: parsed.data.id },
        });

        res.status(204).send();
        return
    } catch (err) {
        handleZodError(err, res)
    }
};

export const listPublic: RequestHandler = async (req, res) => {
    const { skip, take, page } = getPaginationParams(req);

    try {
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

        res.json({
            data: collections,
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
        handleZodError(err, res);
    }
};

export const checkInCollections: RequestHandler = async (req, res) => {
    const { mangaId } = req.params;
    const userId = (req as any).user?.id;
    const { skip, take, page } = getPaginationParams(req);

    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
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

        res.status(200).json({
            data: formattedCollections,
            pagination: {
                total,
                page,
                limit: take,
                totalPages,
                next: page < totalPages,
                prev: page > 1,
            }
        });
    } catch (err) {
        handleZodError(err, res);
    }
};

export const addToCollection: RequestHandler = async (req, res) => {
    const { id, mangaId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        // Verifica se a coleção existe e pertence ao usuário
        const collection = await prisma.collection.findUnique({
            where: { id: id },
            include: {
                mangas: {
                    where: {
                        id: mangaId
                    }
                }
            }
        });

        if (!collection) {
            res.status(404).json({ error: "Coleção não encontrada" });
            return;
        }

        if (collection.userId !== userId) {
            res.status(403).json({ error: "Você não tem permissão para modificar esta coleção" });
            return;
        }

        // Verifica se o mangá já está na coleção
        if (collection.mangas.length > 0) {
            res.status(400).json({ error: "Este mangá já está na coleção" });
            return;
        }

        // Adiciona o mangá à coleção
        const updatedCollection = await prisma.collection.update({
            where: { id: id },
            data: {
                mangas: {
                    connect: { id: mangaId }
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

        res.status(200).json(updatedCollection);
    } catch (err) {
        handleZodError(err, res);
    }
};
