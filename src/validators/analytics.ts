import { z } from 'zod';
import { STATS_TYPES, TIME_PERIODS } from '@/constants/analytics';

export const dateRangeSchema = z.object({
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str))
}).refine(data => data.startDate <= data.endDate, {
    message: 'Data inicial deve ser menor ou igual à data final'
});

export const statsTypeSchema = z.enum([
    STATS_TYPES.VIEWS,
    STATS_TYPES.LIKES,
    STATS_TYPES.COMMENTS
]);

export const timePeriodSchema = z.enum([
    TIME_PERIODS.DAILY,
    TIME_PERIODS.WEEKLY,
    TIME_PERIODS.MONTHLY
]);

export const analyticsQuerySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: statsTypeSchema.optional(),
    period: timePeriodSchema.optional(),
    limit: z.string().transform(val => parseInt(val, 10)).optional()
}); 