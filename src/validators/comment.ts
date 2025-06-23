import { z } from 'zod';

export const commentSchema = z.object({
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    mangaId: z.string().min(1, 'ID do mangá é obrigatório')
});

export const commentUpdateSchema = z.object({
    content: z.string().min(1, 'Conteúdo é obrigatório')
}); 