import { Manga } from './manga';

export interface Collection {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CollectionResponse {
    collection: Collection;
    mangas: Manga[];
    totalMangas: number;
}

export interface CollectionListResponse {
    collections: CollectionResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
} 