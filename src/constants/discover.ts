export const DISCOVER_SECTIONS = {
    TRENDING: 'trending',
    RECENTLY_UPDATED: 'recently_updated',
    POPULAR: 'popular',
    RECOMMENDATIONS: 'recommendations'
} as const;

export const DISCOVER_LIMITS = {
    TRENDING: 10,
    RECENTLY_UPDATED: 20,
    POPULAR: 10,
    RECOMMENDATIONS: 10
} as const;

export const TRENDING_PERIOD = 7; // dias
export const POPULAR_PERIOD = 30; // dias 