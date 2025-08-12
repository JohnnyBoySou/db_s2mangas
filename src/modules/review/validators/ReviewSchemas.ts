
import { z } from "zod";

export const ratingSchema = z.object({
    art: z.number().min(1).max(10),
    story: z.number().min(1).max(10),
    characters: z.number().min(1).max(10),
    worldbuilding: z.number().min(1).max(10),
    pacing: z.number().min(1).max(10),
    emotion: z.number().min(1).max(10),
    originality: z.number().min(1).max(10),
    dialogues: z.number().min(1).max(10),
    title: z.string().min(1).max(100),
});

export const createReviewSchema = z.object({
    mangaId: z.string().uuid(),
    rating: z.number().min(1).max(10),
    content: z.string().min(1).max(2000),
    ...ratingSchema.shape
});

export const updateReviewSchema = z.object({
    rating: z.number().min(1).max(10).optional(),
    content: z.string().min(1).max(2000).optional(),
    ...Object.fromEntries(
        Object.entries(ratingSchema.shape).map(([key, value]) => [
            key,
            value.optional()
        ])
    )
});
