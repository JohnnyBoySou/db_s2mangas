import { z } from 'zod';

export const playlistSchema = z.object({
    name: z.string().min(1),
    cover: z.string().url(),
    link: z.string().url(),
    description: z.string().optional(),
    tags: z.array(z.string().uuid()).optional(), // Array de IDs de tags
});

export const tagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(), // Cor hexadecimal
});

export const playlistTagSchema = z.object({
    playlistId: z.string().uuid(),
    tagId: z.string().uuid(),
});