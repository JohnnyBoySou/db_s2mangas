import { z } from 'zod';

export const commentSchema = z.object({
    content: z.string().min(1, 'O comentário não pode estar vazia'),
    mangaId: z.string().min(1, 'ID do mangá é obrigatório'),
    parentId: z.string().optional().nullable(),
});

export const commentIdSchema = z.object({
    id: z.string().min(1, 'ID do comentário é obrigatório'),
}); 