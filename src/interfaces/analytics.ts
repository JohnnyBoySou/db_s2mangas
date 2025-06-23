export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface GeneralStats {
    totalUsers: number;
    totalMangas: number;
    totalChapters: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
}

export interface ViewsByPeriod {
    date: Date;
    count: number;
}

export interface MangaStats {
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
}

export interface UserStats {
    id: string;
    name: string;
    avatar?: string;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalActivity: number;
}

export interface CategoryStats {
    name: string;
    count: number;
}

export interface LanguageStats {
    language: string;
    count: number;
}

export interface MangaTypeStats {
    type: string;
    count: number;
}

export interface MangaStatusStats {
    status: string;
    count: number;
} 