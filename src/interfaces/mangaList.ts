export interface MangaListCreate {
  name: string;
  cover: string;
  mood: string;
  description?: string;
  status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault?: boolean;
  mangaIds?: string[];
}

export interface MangaListUpdate {
  name?: string;
  cover?: string;
  mood?: string;
  description?: string;
  status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault?: boolean;
}

export interface MangaListItemCreate {
  mangaId: string;
  order?: number;
  note?: string;
}

export interface MangaListItemUpdate {
  order?: number;
  note?: string;
}

export interface MangaListResponse {
  id: string;
  userId: string;
  name: string;
  cover: string;
  mood: string;
  description?: string;
  status: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount?: number;
  likesCount?: number;
  isLiked?: boolean;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  items?: MangaListItemResponse[];
}

export interface MangaListItemResponse {
  id: string;
  listId: string;
  mangaId: string;
  order: number;
  note?: string;
  addedAt: Date;
  manga: {
    id: string;
    cover: string;
    manga_uuid?: string;
    translations: {
      language: string;
      name: string;
      description?: string;
    }[];
  };
}

export interface MangaListFilters {
  userId?: string;
  status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  mood?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'likesCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MangaListStats {
  totalLists: number;
  publicLists: number;
  privateLists: number;
  totalItems: number;
  averageItemsPerList: number;
  mostPopularMoods: {
    mood: string;
    count: number;
  }[];
}

export interface ReorderMangaListItems {
  items: {
    id: string;
    order: number;
  }[];
}

export interface BulkAddToMangaList {
  mangaIds: string[];
  notes?: { [mangaId: string]: string };
}

export interface MangaListLikeResponse {
  id: string;
  userId: string;
  listId: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}