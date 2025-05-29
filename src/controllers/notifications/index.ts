import { RequestHandler } from "express";
import prisma from "@/prisma/client";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from "@/utils/pagination";
import { z } from "zod";

const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  mangaId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  message: z.string().min(1).max(500)
});

// Listar notificações do usuário
export const listNotifications: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const { skip, take, page } = getPaginationParams(req);

  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          manga: {
            select: {
              id: true,
              manga_uuid: true,
              cover: true,
              translations: {
                where: { language: 'pt' },
                select: { name: true }
              }
            }
          },
          chapter: {
            select: {
              id: true,
              chapter: true,
              manga: {
                select: {
                  id: true,
                  manga_uuid: true,
                  translations: {
                    where: { language: 'pt' },
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    const totalPages = Math.ceil(total / take);

    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      mangaId: notification.mangaId,
      chapterId: notification.chapterId,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      manga: notification.manga ? {
        id: notification.manga.id,
        manga_uuid: notification.manga.manga_uuid,
        title: notification.manga.translations[0]?.name || '',
        cover: notification.manga.cover
      } : null,
      chapter: notification.chapter ? {
        id: notification.chapter.id,
        chapter: notification.chapter.chapter,
        manga_title: notification.chapter.manga.translations[0]?.name || ''
      } : null
    }));

    res.json({
      data: formattedNotifications,
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

// Criar notificação (apenas admin)
export const createNotification: RequestHandler = async (req, res) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);
    const { userId, mangaId, chapterId, message } = validatedData;

    const notification = await prisma.notification.create({
      data: {
        userId,
        mangaId,
        chapterId,
        message
      },
      include: {
        manga: {
          select: {
            id: true,
            manga_uuid: true,
            cover: true,
            translations: {
              where: { language: 'pt' },
              select: { name: true }
            }
          }
        },
        chapter: {
          select: {
            id: true,
            chapter: true,
            manga: {
              select: {
                id: true,
                manga_uuid: true,
                translations: {
                  where: { language: 'pt' },
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      id: notification.id,
      userId: notification.userId,
      mangaId: notification.mangaId,
      chapterId: notification.chapterId,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      manga: notification.manga ? {
        id: notification.manga.id,
        manga_uuid: notification.manga.manga_uuid,
        title: notification.manga.translations[0]?.name || '',
        cover: notification.manga.cover
      } : null,
      chapter: notification.chapter ? {
        id: notification.chapter.id,
        chapter: notification.chapter.chapter,
        manga_title: notification.chapter.manga.translations[0]?.name || ''
      } : null
    });
  } catch (err) {
    handleZodError(err, res);
  }
};

// Marcar notificação como lida
export const markAsRead: RequestHandler = async (req, res) => {
  console.log("marcando")
  const userId = (req as any).user?.id;
  const { notificationId } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId // Garante que apenas o dono da notificação pode marcá-la como lida
      },
      data: {
        isRead: true
      }
    });

    res.json(notification);
  } catch (err) {
    handleZodError(err, res);
  }
};

// Deletar notificação (apenas admin)
export const deleteNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.status(204).send();
  } catch (err) {
    handleZodError(err, res);
  }
};

// Marcar todas as notificações como lidas
export const markAllAsRead: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;

  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      message: "Todas as notificações foram marcadas como lidas",
      userId
    });
  } catch (err) {
    handleZodError(err, res);
  }
};

// Buscar uma única notificação
export const getNotification: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const { notificationId } = req.params;

  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId // Garante que apenas o dono da notificação pode vê-la
      },
      include: {
        manga: {
          select: {
            id: true,
            manga_uuid: true,
            cover: true,
            translations: {
              where: { language: 'pt' },
              select: { name: true }
            }
          }
        },
        chapter: {
          select: {
            id: true,
            chapter: true,
            manga: {
              select: {
                id: true,
                manga_uuid: true,
                translations: {
                  where: { language: 'pt' },
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!notification) {
      res.status(404).json({ message: "Notificação não encontrada" });
      return;
    }

    const formattedNotification = {
      id: notification.id,
      userId: notification.userId,
      mangaId: notification.mangaId,
      chapterId: notification.chapterId,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      manga: notification.manga ? {
        id: notification.manga.id,
        manga_uuid: notification.manga.manga_uuid,
        title: notification.manga.translations[0]?.name || '',
        cover: notification.manga.cover
      } : null,
      chapter: notification.chapter ? {
        id: notification.chapter.id,
        chapter: notification.chapter.chapter,
        manga_title: notification.chapter.manga.translations[0]?.name || ''
      } : null
    };

    res.json(formattedNotification);
  } catch (err) {
    handleZodError(err, res);
  }
}; 

