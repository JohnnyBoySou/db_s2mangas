import { RequestHandler } from 'express';
import {
    createCollectionSchema,
    updateCollectionSchema,
    collectionIdSchema,
} from '@/schemas/collectionSchemas';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';
import {
    createCollection,
    listCollections,
    getCollection,
    updateCollection,
    deleteCollection,
    listPublicCollections,
    checkMangaInCollections,
    toggleMangaInCollection
} from '@/handlers/collection';

export const create: RequestHandler = async (req, res) => {
    const parsed = createCollectionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        const collection = await createCollection({
            userId,
            ...parsed.data,
            status: parsed.data.status ?? 'PRIVATE'
        });
        res.status(201).json(collection);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    const { page, take } = getPaginationParams(req);

    try {
        const result = await listCollections(userId, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const get: RequestHandler = async (req, res) => {
    const parsed = collectionIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        const language = req.query.lg as string || 'pt-BR';
        const collection = await getCollection(parsed.data.id, userId, language);
        res.json(collection);
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Coleção não encontrada.') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para visualizar esta coleção.') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};

export const update: RequestHandler = async (req, res) => {
    const parsed = updateCollectionSchema.safeParse({ ...req.body, ...req.params });
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const { id, ...data } = parsed.data;
    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        const collection = await updateCollection(id, userId, data);
        res.json(collection);
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Coleção não encontrada.') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para editar esta coleção.') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};

export const remove: RequestHandler = async (req, res) => {
    const parsed = collectionIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        await deleteCollection(parsed.data.id, userId);
        res.status(204).send();
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Coleção não encontrada.') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para deletar esta coleção.') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};

export const listPublic: RequestHandler = async (req, res) => {
    const { page, take } = getPaginationParams(req);

    try {
        const result = await listPublicCollections(page, take);
        res.json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const checkInCollections: RequestHandler = async (req, res) => {
    const { mangaId } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    const { page, take } = getPaginationParams(req);

    try {
        const result = await checkMangaInCollections(mangaId, userId, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const toggleCollection: RequestHandler = async (req, res) => {
    const { id, mangaId } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        const result = await toggleMangaInCollection(id, mangaId, userId);
        res.status(200).json(result);
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Coleção não encontrada') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para modificar esta coleção') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};
