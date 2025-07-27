import { RequestHandler } from 'express';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';
import {
    createComment,
    listComments,
    updateComment,
    deleteComment,
} from '../handlers/CommentHandler';
import { commentSchema, commentIdSchema } from '../validators/CommentValidator';

export const create: RequestHandler = async (req, res) => {
    const parsed = commentSchema.safeParse(req.body);
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
        const comment = await createComment({
            userId,
            ...parsed.data
        });
        res.status(201).json(comment);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    const { mangaId } = req.params;
    if (!mangaId) {
        res.status(400).json({ error: "ID do mangá é obrigatório" });
        return;
    }

    const { page, take } = getPaginationParams(req);

    try {
        const result = await listComments(mangaId, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const update: RequestHandler = async (req, res) => {
    const parsed = commentIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const contentSchema = commentSchema.pick({ content: true });
    const contentParsed = contentSchema.safeParse(req.body);
    if (!contentParsed.success) {
        res.status(400).json(contentParsed.error);
        return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        const comment = await updateComment(parsed.data.id, userId, contentParsed.data.content);
        res.json(comment);
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Comentário não encontrado.') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para editar este comentário.') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};

export const remove: RequestHandler = async (req, res) => {
    const parsed = commentIdSchema.safeParse(req.params);
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
        await deleteComment(parsed.data.id, userId);
        res.status(204).send();
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Comentário não encontrado.') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para deletar este comentário.') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};
