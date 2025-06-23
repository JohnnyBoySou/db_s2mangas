export interface Wallpaper {
    id: string;
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl: string;
    width: number;
    height: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface WallpaperResponse {
    wallpaper: Wallpaper;
    downloads: number;
    likes: number;
}

export interface WallpaperListResponse {
    wallpapers: WallpaperResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface WallpaperSearchParams {
    title?: string;
    tags?: string[];
    width?: number;
    height?: number;
    orderBy?: 'most_downloaded' | 'most_liked' | 'most_recent';
    page?: number;
    limit?: number;
} 