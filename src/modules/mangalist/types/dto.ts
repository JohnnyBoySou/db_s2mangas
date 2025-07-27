// DTOs para entrada (Request)
export interface CreateMangaListDTO {
  name: string;
  cover: string;
  mood: string;
  description?: string;
  status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault?: boolean;
  mangaIds?: string[];
}

export interface UpdateMangaListDTO {
  name?: string;
  cover?: string;
  mood?: string;
  description?: string;
  status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault?: boolean;
}

export interface AddMangaToListDTO {
  mangaId: string;
  order?: number;
  note?: string;
}

export interface UpdateMangaListItemDTO {
  order?: number;
  note?: string;
}

export interface ReorderMangaListItemsDTO {
  items: {
    id: string;
    order: number;
  }[];
}

export interface BulkAddMangasDTO {
  mangaIds: string[];
  notes?: { [mangaId: string]: string };
}

export interface MangaListFiltersDTO {
  userId?: string;
  status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  mood?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'likesCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// DTOs para saída (Response)
export interface MangaListResponseDTO {
  id: string;
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
  items?: MangaListItemResponseDTO[];
}

export interface MangaListItemResponseDTO {
  id: string;
  listId: string;
  mangaId: string;
  order: number;
  note?: string;
  addedAt: Date;
  manga?: {
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

export interface PaginatedMangaListResponseDTO {
  data: MangaListResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkAddResponseDTO {
  added: number;
  skipped: number;
  results?: {
    mangaId: string;
    status: 'added' | 'skipped';
    reason?: string;
  }[];
}

// DTOs para parâmetros de URL
export interface MangaListParamsDTO {
  id: string;
}

export interface MangaListItemParamsDTO {
  listId: string;
  itemId: string;
}

// DTOs para operações internas
export interface MangaListStatsDTO {
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

export interface MangaListMetricsDTO {
  listId: string;
  views: number;
  likes: number;
  shares: number;
  lastActivity: Date;
}

// DTOs para validação
export interface ValidationErrorDTO {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResultDTO {
  isValid: boolean;
  errors: ValidationErrorDTO[];
}

// DTOs para eventos
export interface MangaListEventDTO {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'ITEM_ADDED' | 'ITEM_REMOVED' | 'ITEM_UPDATED' | 'ITEMS_REORDERED';
  timestamp: Date;
  listId: string;
  userId?: string;
  data: any;
}

// DTOs para auditoria
export interface MangaListAuditDTO {
  id: string;
  action: string;
  entityId: string;
  entityType: 'LIST' | 'ITEM';
  userId: string;
  timestamp: Date;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

// DTOs para pesquisa avançada
export interface MangaListSearchDTO {
  query: string;
  filters?: {
    mood?: string;
    status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
    hasItems?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// DTOs para exportação/importação
export interface ExportMangaListDTO {
  format: 'JSON' | 'CSV' | 'XML';
  includeItems: boolean;
  includeMetadata: boolean;
  listIds?: string[];
}

export interface ImportMangaListDTO {
  format: 'JSON' | 'CSV' | 'XML';
  data: string;
  mergeStrategy: 'REPLACE' | 'MERGE' | 'SKIP_DUPLICATES';
  validateOnly?: boolean;
} 