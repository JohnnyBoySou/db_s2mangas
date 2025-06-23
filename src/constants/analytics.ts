export const DEFAULT_DATE_RANGE = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Últimos 30 dias
    endDate: new Date()
};

export const TOP_LIMIT = 10;

export const DATE_FORMAT = 'yyyy-MM-dd';

export const STATS_TYPES = {
    VIEWS: 'views',
    LIKES: 'likes',
    COMMENTS: 'comments'
} as const;

export const TIME_PERIODS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
} as const; 