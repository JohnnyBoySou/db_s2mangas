import { z } from 'zod';
import { LIBRARY_STATUS, LIBRARY_ORDER } from '@/constants/library';

export const libraryItemSchema = z.object({
    mangaId: z.string().min(1, 'ID do mangá é obrigatório'),
    status: z.enum([
        LIBRARY_STATUS.READING,
        LIBRARY_STATUS.COMPLETED,
        LIBRARY_STATUS.PLAN_TO_READ,
        LIBRARY_STATUS.DROPPED
    ]),
    lastReadChapter: z.number().optional(),
    lastReadAt: z.date().optional()
});

export const libraryUpdateSchema = libraryItemSchema.partial();

export const libraryQuerySchema = z.object({
    status: z.enum([
        LIBRARY_STATUS.READING,
        LIBRARY_STATUS.COMPLETED,
        LIBRARY_STATUS.PLAN_TO_READ,
        LIBRARY_STATUS.DROPPED
    ]).optional(),
    orderBy: z.enum([
        LIBRARY_ORDER.LAST_READ,
        LIBRARY_ORDER.LAST_UPDATED,
        LIBRARY_ORDER.TITLE
    ]).default(LIBRARY_ORDER.LAST_UPDATED),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('20')
}); 