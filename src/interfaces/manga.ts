import { MANGA_STATUS, MANGA_TYPE } from '@/constants/manga';

export interface Manga {
    id: string;
    title: string;
    description?: string;
    cover?: string;
    banner?: string;
    status: typeof MANGA_STATUS[keyof typeof MANGA_STATUS];
    type: typeof MANGA_TYPE[keyof typeof MANGA_TYPE];
    categories: Array<{ name: string }>;
    languages: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface MangaResponse {
    manga: Manga;
    views: number;
    likes: number;
    comments: number;
}

export interface MangaListResponse {
    mangas: MangaResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MangaSearchParams {
    name?: string;
    categories?: string[];
    status?: typeof MANGA_STATUS[keyof typeof MANGA_STATUS];
    type?: typeof MANGA_TYPE[keyof typeof MANGA_TYPE];
    languages?: string[];
    orderBy?: 'most_viewed' | 'most_liked' | 'most_recent';
    page?: number;
    limit?: number;
} 