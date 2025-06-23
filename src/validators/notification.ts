import { z } from 'zod';
import { NOTIFICATION_TYPES } from '@/constants/notification';

export const notificationSchema = z.object({
    type: z.enum([
        NOTIFICATION_TYPES.NEW_CHAPTER,
        NOTIFICATION_TYPES.MANGA_UPDATE,
        NOTIFICATION_TYPES.COMMENT_REPLY,
        NOTIFICATION_TYPES.LIKE,
        NOTIFICATION_TYPES.SYSTEM
    ]),
    title: z.string().min(1, 'Título é obrigatório'),
    message: z.string().min(1, 'Mensagem é obrigatória'),
    data: z.record(z.any()).optional()
});

export const notificationPreferencesSchema = z.object({
    newChapter: z.boolean(),
    mangaUpdate: z.boolean(),
    commentReply: z.boolean(),
    like: z.boolean(),
    system: z.boolean()
});

export const notificationQuerySchema = z.object({
    type: z.enum([
        NOTIFICATION_TYPES.NEW_CHAPTER,
        NOTIFICATION_TYPES.MANGA_UPDATE,
        NOTIFICATION_TYPES.COMMENT_REPLY,
        NOTIFICATION_TYPES.LIKE,
        NOTIFICATION_TYPES.SYSTEM
    ]).optional(),
    isRead: z.boolean().optional(),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('20')
}); 