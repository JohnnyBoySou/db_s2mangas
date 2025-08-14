import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres").trim(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres").trim(),
});

export const categoryParamsSchema = z.object({
    id: z.string().uuid("ID deve ser um UUID válido"),
});

export const categoryQuerySchema = z.object({
    page: z.coerce.number().min(1, "Página deve ser maior que 0").default(1),
    limit: z.coerce.number().min(1, "Limite deve ser maior que 0").max(100, "Limite máximo é 100").default(10),
});

// Tipos TypeScript derivados
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;