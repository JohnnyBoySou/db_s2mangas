import { z } from 'zod';

export const createMangaSchema = z.object({
  cover: z.string().min(1, "Cover é obrigatório").url(),
  status: z.string().optional(),
  type: z.string().optional(),
  releaseDate: z.coerce.date().optional(),
  manga_uuid: z.string().optional(),
  languageIds: z.array(z.string().uuid()).min(1),
  categoryIds: z.array(z.string().uuid()).optional(),
  translations: z.array(z.object({
    language: z.string(),
    name: z.string(),
    description: z.string().optional(),
  })).min(1),
});

export const updateMangaSchema = z.object({
  cover: z.string().url().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  releaseDate: z.coerce.date().optional(),

  languageIds: z.array(z.string().uuid()).min(1, "Pelo menos um idioma é obrigatório"),
  categoryIds: z.array(z.string().uuid()).optional(),

  translations: z.array(
    z.object({
      language: z.string(),
      name: z.string().min(1, "Nome é obrigatório"),
      description: z.string().optional(),
    })
  ).min(1, "Pelo menos uma tradução é obrigatória"),
});

export const patchMangaSchema = z.object({
  cover: z.string().url().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  releaseDate: z.coerce.date().optional(),
  languageIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  translations: z.array(
    z.object({
      language: z.string(),
      name: z.string().min(1, "Nome é obrigatório"),
      description: z.string().optional(),
    })
  ).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Pelo menos um campo deve ser fornecido para atualização" }
);

export type CreateMangaInput = z.infer<typeof createMangaSchema>;
export type PatchMangaInput = z.infer<typeof patchMangaSchema>;
