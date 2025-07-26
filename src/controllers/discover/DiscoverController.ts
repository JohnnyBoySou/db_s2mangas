import { RequestHandler } from 'express';
import { getPaginationParams } from '@/utils/pagination';
import { handleZodError } from '@/utils/zodError';
import * as discoverHandlers from '@/handlers/discover/DiscoverHandler';

// Mais recentes
export const getRecent: RequestHandler = async (req, res) => {
    const { take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';

    try {
        const result = await discoverHandlers.getRecent(language, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

// Mais vistos
export const getMostViewed: RequestHandler = async (req, res) => {
    const { take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';

    try {
        const result = await discoverHandlers.getMostViewed(language, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

// Mais curtidos
export const getMostLiked: RequestHandler = async (req, res) => {
    const { take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';

    try {
        const result = await discoverHandlers.getMostLiked(language, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

// Feed personalizado baseado nas categorias favoritas do usuário
export const getFeed: RequestHandler = async (req, res) => {
    const { take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
    }

    try {
        const result = await discoverHandlers.getFeed(userId, language, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

// Recomendações baseadas em IA
export const getIA: RequestHandler = async (req, res) => {
    const { take, page } = getPaginationParams(req);
    const language = req.query.lg as string || 'en';
    const userId = (req as any).user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
    }

    try {
        const result = await discoverHandlers.getIA(userId, language, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};