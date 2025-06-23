import { z } from 'zod';

export const collectionSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    isPublic: z.boolean().default(true)
});

export const collectionUpdateSchema = collectionSchema.partial();

export const collectionMangaSchema = z.object({
    mangaId: z.string().min(1, 'ID do mangá é obrigatório')
}); 