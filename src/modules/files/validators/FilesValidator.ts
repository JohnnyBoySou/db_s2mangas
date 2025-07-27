import { z } from "zod";

export const uploadFileSchema = z.object({
  base64: z.string().min(1, 'O arquivo base64 é obrigatório'),
  filename: z.string().min(1, 'O nome do arquivo é obrigatório'),
  mimetype: z.string().min(1, 'O tipo do arquivo é obrigatório')
});
