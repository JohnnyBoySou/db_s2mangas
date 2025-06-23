export const NOTIFICATION_TYPES = {
    NEW_CHAPTER: 'new_chapter',
    MANGA_UPDATE: 'manga_update',
    COMMENT_REPLY: 'comment_reply',
    LIKE: 'like',
    SYSTEM: 'system'
} as const;

export const NOTIFICATION_LIMITS = {
    DEFAULT: 20,
    MAX: 50
} as const;

export const NOTIFICATION_RETENTION_DAYS = 30; 