import { Manga } from './manga';

export interface LibraryItem {
    id: string;
    userId: string;
    mangaId: string;
    status: 'reading' | 'completed' | 'plan_to_read' | 'dropped';
    lastReadChapter?: number;
    lastReadAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface LibraryItemResponse {
    item: LibraryItem;
    manga: Manga;
}

export interface LibraryListResponse {
    items: LibraryItemResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface LibraryStats {
    reading: number;
    completed: number;
    planToRead: number;
    dropped: number;
    total: number;
} 