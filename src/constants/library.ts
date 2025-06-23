export const LIBRARY_STATUS = {
    READING: 'reading',
    COMPLETED: 'completed',
    PLAN_TO_READ: 'plan_to_read',
    DROPPED: 'dropped'
} as const;

export const LIBRARY_ORDER = {
    LAST_READ: 'last_read',
    LAST_UPDATED: 'last_updated',
    TITLE: 'title'
} as const;

export const DEFAULT_LIBRARY_LIMIT = 20;
export const MAX_LIBRARY_LIMIT = 50; 