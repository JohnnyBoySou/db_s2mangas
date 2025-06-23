export const MANGA_STATUS = {
    ONGOING: 'Em andamento',
    COMPLETED: 'Completo',
    DROPPED: 'Descontinuado',
    HIATUS: 'Em hiato',
    ANNOUNCED: 'Anunciado',
} as const;

export const MANGA_TYPE = {
    MANGA: 'Manga',
    MANHWA: 'Manhwa',
    MANHUA: 'Manhua',
    WEBTOON: 'Webtoon',
} as const;

export const MANGA_ORDER = {
    MOST_VIEWED: 'most_viewed',
    MOST_LIKED: 'most_liked',
    MOST_RECENT: 'most_recent',
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50; 