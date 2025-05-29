import { RequestHandler, Request, Response } from 'express';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';

const createCommentSchema = z.object({
    message: z.string().min(1),
    mangaId: z.string(),
    parentId: z.string().optional().nullable(),
});

export const createComment: RequestHandler = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const body = createCommentSchema.safeParse(req.body);

    if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' })
        return
            ;
    }
    if (!body.success) {
        handleZodError(body.error, res);
        return
    }

    try {
        const comment = await prisma.comment.create({
            data: {
                message: body.data.message,
                mangaId: body.data.mangaId,
                parentId: body.data.parentId,
                userId,
            },
        });

        res.status(201).json(comment);
        return
    } catch (err) {
        handleZodError(err, res);
        return
    }
};

export const listCommentsByManga: RequestHandler = async (req, res) => {
    const { mangaId } = req.params;
    const { skip, take, page } = getPaginationParams(req);
  
    try {
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            mangaId,
            parentId: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take,
        }),
        prisma.comment.count({
          where: {
            mangaId,
            parentId: null,
          },
        }),
      ]);
  
      const totalPages = Math.ceil(total / take);
  
      res.status(200).json({
        data: comments,
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

export const updateComment: RequestHandler = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
        res.status(400).json({ error: 'Mensagem não pode estar vazia.' });
        return 
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!comment) {
            res.status(404).json({ error: 'Comentário não encontrado.' });
            return 
        }

        if (comment.userId !== userId) {
            res.status(403).json({ error: 'Você só pode editar seu próprio comentário.' });
            return 
        }

        const updated = await prisma.comment.update({
            where: { id },
            data: { message },
        });

        res.json(updated);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const deleteComment: RequestHandler = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!comment) {
            res.status(404).json({ error: 'Comentário não encontrado.' });
            return 
        }

        if (comment.userId !== userId) {
            res.status(403).json({ error: 'Você só pode excluir seu próprio comentário.' });
            return 
        }

        await prisma.comment.delete({ where: { id } });

        res.status(204).send(); // No Content
    } catch (err) {
        handleZodError(err, res);
    }
};