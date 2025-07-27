import { z } from 'zod';

export const upsertSchema = z.object({
  mangaId: z.string().uuid(),
  isRead: z.boolean().optional(),
  isLiked: z.boolean().optional(),
  isFollowed: z.boolean().optional(),
  isComplete: z.boolean().optional(),
});

export const updateFlagsSchema = z.object({
  mangaId: z.string().uuid(),
  isRead: z.boolean().optional(),
  isLiked: z.boolean().optional(),
  isFollowed: z.boolean().optional(),
  isComplete: z.boolean().optional(),
}); 