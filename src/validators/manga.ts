import { z } from 'zod';
import { MANGA_STATUS, MANGA_TYPE, MANGA_ORDER } from '@/constants/manga';

export const mangaSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    cover: z.string().optional(),
    banner: z.string().optional(),
    status: z.enum([
        MANGA_STATUS.ONGOING,
        MANGA_STATUS.COMPLETED,
        MANGA_STATUS.DROPPED,
        MANGA_STATUS.HIATUS,
        MANGA_STATUS.ANNOUNCED
    ]),
    type: z.enum([
        MANGA_TYPE.MANGA,
        MANGA_TYPE.MANHWA,
        MANGA_TYPE.MANHUA,
        MANGA_TYPE.WEBTOON
    ]),
    categories: z.array(z.object({
        name: z.string()
    })),
    languages: z.array(z.string())
});

export const mangaUpdateSchema = mangaSchema.partial();

export const mangaSearchSchema = z.object({
    name: z.string().optional(),
    categories: z.array(z.string()).optional(),
    status: z.enum([
        MANGA_STATUS.ONGOING,
        MANGA_STATUS.COMPLETED,
        MANGA_STATUS.DROPPED,
        MANGA_STATUS.HIATUS,
        MANGA_STATUS.ANNOUNCED
    ]).optional(),
    type: z.enum([
        MANGA_TYPE.MANGA,
        MANGA_TYPE.MANHWA,
        MANGA_TYPE.MANHUA,
        MANGA_TYPE.WEBTOON
    ]).optional(),
    languages: z.array(z.string()).optional(),
    orderBy: z.enum([
        MANGA_ORDER.MOST_VIEWED,
        MANGA_ORDER.MOST_LIKED,
        MANGA_ORDER.MOST_RECENT
    ]).default(MANGA_ORDER.MOST_RECENT),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('10')
}); 