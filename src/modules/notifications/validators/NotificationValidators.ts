import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.string(),
  cover: z.string().url().optional() // URL da imagem de cover (opcional)
});

// Schema para atualização completa (PUT) - todos os campos obrigatórios
export const updateNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.string(),
  cover: z.string().url().optional() // URL da imagem de cover (opcional)
});

// Schema para atualização parcial (PATCH) - todos os campos opcionais
export const patchNotificationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  message: z.string().min(1).max(500).optional(),
  type: z.string().optional(),
  cover: z.string().url().optional() // URL da imagem de cover (opcional)
}).refine(data => Object.keys(data).length > 0, {
  message: "Pelo menos um campo deve ser fornecido para atualização"
});
