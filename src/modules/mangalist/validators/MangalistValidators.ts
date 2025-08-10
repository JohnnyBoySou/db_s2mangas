import { z } from 'zod';

export const mangaListStatusSchema = z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']);

export const createMangaListSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  cover: z.string().url('Cover deve ser uma URL válida'),
  mood: z.string().min(1, 'Mood é obrigatório').max(50, 'Mood deve ter no máximo 50 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  status: mangaListStatusSchema.default('PRIVATE'),
  isDefault: z.boolean().default(false),
  mangaIds: z.array(z.string().uuid('ID do manga deve ser um UUID válido')).optional()
});

export const updateMangaListSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  cover: z.string().url('Cover deve ser uma URL válida').optional(),
  mood: z.string().min(1, 'Mood é obrigatório').max(50, 'Mood deve ter no máximo 50 caracteres').optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  status: mangaListStatusSchema.optional(),
  isDefault: z.boolean().optional()
});

export const addMangaToListSchema = z.object({
  mangaId: z.string().uuid('ID do manga deve ser um UUID válido'),
  order: z.number().int().min(0).optional(),
  note: z.string().max(200, 'Nota deve ter no máximo 200 caracteres').optional()
});

export const updateMangaListItemSchema = z.object({
  order: z.number().int().min(0).optional(),
  note: z.string().max(200, 'Nota deve ter no máximo 200 caracteres').optional()
});

export const reorderMangaListItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid('ID do item deve ser um UUID válido'),
    order: z.number().int().min(0)
  })).min(1, 'Pelo menos um item deve ser fornecido')
});

export const bulkAddToMangaListSchema = z.object({
  mangaIds: z.array(z.string().uuid('ID do manga deve ser um UUID válido')).min(1, 'Pelo menos um manga deve ser fornecido'),
  notes: z.record(z.string().uuid(), z.string().max(200, 'Nota deve ter no máximo 200 caracteres')).optional()
});

export const mangaListFiltersSchema = z.object({
  userId: z.string().uuid('ID do usuário deve ser um UUID válido').optional(),
  status: mangaListStatusSchema.optional(),
  mood: z.string().max(50).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'likesCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export const mangaListParamsSchema = z.object({
  id: z.string().uuid('ID da lista deve ser um UUID válido')
});

export const mangaListItemParamsSchema = z.object({
  listId: z.string().uuid('ID da lista deve ser um UUID válido'),
  itemId: z.string().uuid('ID do item deve ser um UUID válido')
});

export type CreateMangaListInput = z.infer<typeof createMangaListSchema>;
export type UpdateMangaListInput = z.infer<typeof updateMangaListSchema>;
export type AddMangaToListInput = z.infer<typeof addMangaToListSchema>;
export type UpdateMangaListItemInput = z.infer<typeof updateMangaListItemSchema>;
export type ReorderMangaListItemsInput = z.infer<typeof reorderMangaListItemsSchema>;
export type BulkAddToMangaListInput = z.infer<typeof bulkAddToMangaListSchema>;
export type MangaListFiltersInput = z.infer<typeof mangaListFiltersSchema>;
export type MangaListParamsInput = z.infer<typeof mangaListParamsSchema>;
export type MangaListItemParamsInput = z.infer<typeof mangaListItemParamsSchema>;