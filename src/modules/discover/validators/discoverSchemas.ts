import { z } from 'zod';

// Schema para validação de idioma
export const languageSchema = z.string()
  .optional()
  .default('en')
  .transform((val) => {
    if (!val) return 'en';
    const normalized = val.toLowerCase();
    
    // Mapeia variações para formatos padrão
    const languageMap: Record<string, string> = {
      'pt-br': 'pt',
      'pt-pt': 'pt',
      'en-us': 'en',
      'en-gb': 'en'
    };

    return languageMap[normalized] || normalized;
  })
  .refine((val) => {
    const supportedLanguages = ['pt', 'en', 'es', 'fr', 'de', 'ja'];
    return supportedLanguages.includes(val);
  }, {
    message: 'Idioma não suportado'
  });

// Schema para validação de paginação
export const paginationSchema = z.object({
  page: z.number()
    .int()
    .min(1, 'Página deve ser maior que 0')
    .optional()
    .default(1),
  take: z.number()
    .int()
    .min(1, 'Limite deve ser maior que 0')
    .max(100, 'Limite máximo é 100')
    .optional()
    .default(10),
  skip: z.number()
    .int()
    .min(0)
    .optional()
    .default(0)
});

// Schema para query parameters de descoberta
export const discoverQuerySchema = z.object({
  lg: languageSchema,
  page: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .pipe(z.number().int().min(1)),
  take: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 10)
    .pipe(z.number().int().min(1).max(100))
});

// Schema para validação de userId
export const userIdSchema = z.string()
  .uuid('ID do usuário deve ser um UUID válido')
  .min(1, 'ID do usuário é obrigatório');

// Schema para parâmetros de feed personalizado
export const feedParamsSchema = z.object({
  userId: userIdSchema,
  language: languageSchema,
  page: paginationSchema.shape.page,
  take: paginationSchema.shape.take
});

// Schema para parâmetros de recomendações IA
export const iaParamsSchema = z.object({
  userId: userIdSchema,
  language: languageSchema,
  page: paginationSchema.shape.page,
  take: paginationSchema.shape.take
});

// Schema para validação de categorias
export const categoriesSchema = z.array(z.string().uuid())
  .min(1, 'Pelo menos uma categoria deve ser fornecida')
  .max(10, 'Máximo de 10 categorias permitidas');

// Schema para parâmetros de busca por categoria
export const categorySearchSchema = z.object({
  categoryIds: categoriesSchema,
  language: languageSchema,
  page: paginationSchema.shape.page,
  take: paginationSchema.shape.take
});

// Schema para validação de request completo
export const discoverRequestSchema = z.object({
  query: discoverQuerySchema,
  user: z.object({
    id: userIdSchema
  }).optional()
});

// Schema para validação de filtros de manga
export const mangaFilterSchema = z.object({
  language: languageSchema,
  page: z.number().int().min(1),
  take: z.number().int().min(1).max(100)
});

// Tipos derivados dos schemas
export type DiscoverQuery = z.infer<typeof discoverQuerySchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type FeedParams = z.infer<typeof feedParamsSchema>;
export type IAParams = z.infer<typeof iaParamsSchema>;
export type CategorySearchParams = z.infer<typeof categorySearchSchema>;
export type MangaFilter = z.infer<typeof mangaFilterSchema>;

// Funções utilitárias para validação
export const validateDiscoverQuery = (query: unknown) => {
  return discoverQuerySchema.safeParse(query);
};

export const validatePagination = (params: unknown) => {
  return paginationSchema.safeParse(params);
};

export const validateUserId = (userId: unknown) => {
  return userIdSchema.safeParse(userId);
};

export const validateFeedParams = (params: unknown) => {
  return feedParamsSchema.safeParse(params);
};

export const validateIAParams = (params: unknown) => {
  return iaParamsSchema.safeParse(params);
};

export const validateCategories = (categories: unknown) => {
  return categoriesSchema.safeParse(categories);
};

// Função para extrair parâmetros de paginação de query parameters
export const extractPaginationFromQuery = (query: any) => {
  const result = discoverQuerySchema.safeParse(query);
  
  if (!result.success) {
    throw new Error(`Parâmetros inválidos: ${result.error.errors.map(e => e.message).join(', ')}`);
  }

  const { page, take } = result.data;
  const skip = (page - 1) * take;

  return { page, take, skip };
};

// Função para validar e normalizar idioma
export const validateAndNormalizeLanguage = (language: unknown) => {
  const result = languageSchema.safeParse(language);
  
  if (!result.success) {
    throw new Error(`Idioma inválido: ${result.error.errors.map(e => e.message).join(', ')}`);
  }

  return result.data;
}; 