import { Manga } from './manga';

export interface DiscoverResponse {
    trending: Manga[];
    recentlyUpdated: Manga[];
    popular: Manga[];
    recommendations: Manga[];
}

export interface DiscoverParams {
    limit?: number;
    language?: string;
    categories?: string[];
}

export interface RecommendationParams {
    userId?: string;
    limit?: number;
    language?: string;
    categories?: string[];
} 