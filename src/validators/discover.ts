import { z } from 'zod';
import { DISCOVER_SECTIONS } from '@/constants/discover';

export const discoverQuerySchema = z.object({
    section: z.enum([
        DISCOVER_SECTIONS.TRENDING,
        DISCOVER_SECTIONS.RECENTLY_UPDATED,
        DISCOVER_SECTIONS.POPULAR,
        DISCOVER_SECTIONS.RECOMMENDATIONS
    ]).optional(),
    language: z.string().optional(),
    categories: z.array(z.string()).optional(),
    limit: z.string().transform(val => parseInt(val, 10)).optional()
});

export const recommendationQuerySchema = z.object({
    language: z.string().optional(),
    categories: z.array(z.string()).optional(),
    limit: z.string().transform(val => parseInt(val, 10)).optional()
}); 