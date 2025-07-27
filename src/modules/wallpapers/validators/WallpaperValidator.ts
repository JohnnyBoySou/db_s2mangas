import { z } from 'zod';
export const wallpaperSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    cover: z.string().url('URL da capa inválida'),
    images: z.array(z.object({
        url: z.string().url('URL da imagem inválida')
    })).min(1, 'Pelo menos uma imagem é necessária')
});
