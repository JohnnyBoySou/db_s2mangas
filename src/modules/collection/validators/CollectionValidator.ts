import { z } from 'zod';

export const collectionStatusEnum = z.enum(['PRIVATE', 'PUBLIC']);

export const createCollectionSchema = z.object({
  name: z.string().min(1),
  cover: z.string().url(),
  description: z.string().optional(),
  status: collectionStatusEnum.optional(),
  mangaIds: z.array(z.string().uuid()).optional(),
});

export const updateCollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  cover: z.string().url().optional(),
  description: z.string().optional(),
  status: collectionStatusEnum.optional(),
});

export const collectionIdSchema = z.object({
  id: z.string().uuid(),
});
