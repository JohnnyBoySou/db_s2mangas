export const WALLPAPER_ORDER = {
    MOST_DOWNLOADED: 'most_downloaded',
    MOST_LIKED: 'most_liked',
    MOST_RECENT: 'most_recent'
} as const;

export const WALLPAPER_RESOLUTIONS = {
    MOBILE: { width: 1080, height: 1920 },
    TABLET: { width: 2048, height: 1536 },
    DESKTOP: { width: 1920, height: 1080 }
} as const;

export const DEFAULT_WALLPAPER_LIMIT = 20;
export const MAX_WALLPAPER_LIMIT = 50; 