import { RequestHandler } from 'express';
import prisma from '@/prisma/client';
import { getPaginationParams } from '@/utils/pagination';
import { z } from 'zod';
import { handleZodError } from '@/utils/zodError';


/*
export const listLibrary: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    const { skip, take, page } = getPaginationParams(req);
  
    try {
      const [entries, total] = await Promise.all([
        prisma.libraryEntry.findMany({
          where: { userId },
          skip,
          take,
          include: {
            manga: {
              select: {
                id: true,
                manga_uuid: true,
                cover: true,
                translations: {
                  where: {
                    language: 'pt'
                  },
                  select: {
                    name: true
                  }
                },
                _count: {
                  select: { views: true }
                }
              }
            }
          },
        }),
        prisma.libraryEntry.count({ where: { userId } }),
      ]);
  
      const totalPages = Math.ceil(total / take);
  
      const formattedEntries = entries.map(entry => ({
        ...entry,
        manga: {
          id: entry.manga.id,
          manga_uuid: entry.manga.manga_uuid,
          title: entry.manga.translations[0]?.name || '',
          cover: entry.manga.cover,
          views_count: entry.manga._count.views
        }
      }));
  
      res.json({
        data: formattedEntries,
        pagination: {
          total,
          page,
          limit: take,
          totalPages,
          next: page < totalPages ? page + 1 : null,
          prev: page > 1 ? page - 1 : null,
        },
      });
    } catch (err) {
      handleZodError(err, res);
    }
  };
*/

  const upsertSchema = z.object({
    mangaId: z.string().uuid(),
    isRead: z.boolean().optional(),
    isLiked: z.boolean().optional(),
    isFollowed: z.boolean().optional(),
    isComplete: z.boolean().optional(),
  });
  
  export const upsertLibraryEntry: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    try {
      const body = upsertSchema.parse(req.body);
  
      const entry = await prisma.libraryEntry.upsert({
        where: {
          userId_mangaId: {
            userId,
            mangaId: body.mangaId,
          },
        },
        update: {
          ...body,
        },
        create: {
          userId,
          mangaId: body.mangaId,
          isRead: body.isRead ?? false,
          isLiked: body.isLiked ?? false,
          isFollowed: body.isFollowed ?? false,
          isComplete: body.isComplete ?? false,
        },
      });
  
      res.json(entry);
    } catch (err) {
      handleZodError(err, res);
    }
  };
  
  const updateFlagsSchema = z.object({
    mangaId: z.string().uuid(),
    isRead: z.boolean().optional(),
    isLiked: z.boolean().optional(),
    isFollowed: z.boolean().optional(),
    isComplete: z.boolean().optional(),
  });
  
  export const updateLibraryEntry: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
  
    try {
      const body = updateFlagsSchema.parse(req.body);
  
      const updated = await prisma.libraryEntry.update({
        where: {
          userId_mangaId: {
            userId,
            mangaId: body.mangaId,
          },
        },
        data: {
          ...body,
        },
      });
  
      res.json(updated);
    } catch (err) {
      handleZodError(err, res);
    }
  };
  
  export const removeLibraryEntry: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    const mangaId = req.params.mangaId;
  
    try {
      await prisma.libraryEntry.delete({
        where: {
          userId_mangaId: {
            userId,
            mangaId,
          },
        },
      });
  
      res.status(204).send(); // No Content
    } catch (err) {
      handleZodError(err, res);
    }
  };
  
  export const listLibrary: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    const { skip, take, page } = getPaginationParams(req);
    const type = req.params.type; // progress, completes, favorites, etc
  
    try {
      const whereClause = {
        userId,
        ...(type === 'progress' && { isRead: true }),
        ...(type === 'completes' && { isComplete: true }),
        ...(type === 'favorites' && { isLiked: true }),
        ...(type === 'following' && { isFollowed: true })
      };

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
                  where: {
                    language: 'pt'
                  },
                  select: {
                    name: true
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
  
      const formattedEntries = entries.map(entry => ({
        ...entry,
        manga: {
          id: entry.manga.id,
          manga_uuid: entry.manga.manga_uuid,
          title: entry.manga.translations[0]?.name || '',
          cover: entry.manga.cover,
          views_count: entry.manga._count.views
        }
      }));
  
      res.json({
        data: formattedEntries,
        pagination: {
          total,
          page,
          limit: take,
          totalPages,
          next: page < totalPages ? page + 1 : null,
          prev: page > 1 ? page - 1 : null,
        },
      });
    } catch (err) {
      handleZodError(err, res);
    }
  };
  