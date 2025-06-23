import { z } from 'zod';
import { WALLPAPER_ORDER } from '@/constants/wallpaper';

export const wallpaperSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    imageUrl: z.string().url('URL da imagem inválida'),
    thumbnailUrl: z.string().url('URL da miniatura inválida'),
    width: z.number().min(1, 'Largura deve ser maior que 0'),
    height: z.number().min(1, 'Altura deve ser maior que 0'),
    tags: z.array(z.string())
});

export const wallpaperUpdateSchema = wallpaperSchema.partial();

export const wallpaperQuerySchema = z.object({
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
    width: z.string().transform(val => parseInt(val, 10)).optional(),
    height: z.string().transform(val => parseInt(val, 10)).optional(),
    orderBy: z.enum([
        WALLPAPER_ORDER.MOST_DOWNLOADED,
        WALLPAPER_ORDER.MOST_LIKED,
        WALLPAPER_ORDER.MOST_RECENT
    ]).default(WALLPAPER_ORDER.MOST_RECENT),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('20')
}); 