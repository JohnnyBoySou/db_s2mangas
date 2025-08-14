import { z } from "zod";

// Schema para parâmetros de ID
export const idParamsSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido"),
});

// Schema para paginação
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, "Página deve ser maior que 0").default(1),
  limit: z.coerce.number().min(1, "Limite deve ser maior que 0").max(100, "Limite máximo é 100").default(10),
  search: z.string().optional(),
  orderBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// Schema para filtros genéricos
export const filterSchema = z.object({
  where: z.record(z.any()).optional(),
  include: z.record(z.any()).optional(),
  select: z.record(z.any()).optional(),
});

// Tipos derivados
export type IdParams = z.infer<typeof idParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type FilterOptions = z.infer<typeof filterSchema>;

// Schema para operações em lote
export const batchOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Pelo menos um ID é obrigatório"),
});

export type BatchOperation = z.infer<typeof batchOperationSchema>;