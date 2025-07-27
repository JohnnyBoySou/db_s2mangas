import { MangaListFilters, MangaListResponse } from "@/interfaces/mangaList";

// Interface para operações básicas de CRUD das listas
export interface IMangaListRepository {
  create(data: CreateMangaListData): Promise<MangaListEntity>;
  findById(id: string): Promise<MangaListEntity | null>;
  findMany(filters: MangaListFilters): Promise<PaginatedMangaListResult>;
  update(id: string, data: UpdateMangaListData): Promise<MangaListEntity | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

// Interface para operações de itens da lista
export interface IMangaListItemRepository {
  addItem(listId: string, data: AddMangaListItemData): Promise<MangaListItemEntity>;
  removeItem(listId: string, itemId: string): Promise<boolean>;
  updateItem(listId: string, itemId: string, data: UpdateMangaListItemData): Promise<MangaListItemEntity | null>;
  reorderItems(listId: string, items: ReorderItemData[]): Promise<boolean>;
  bulkAddItems(listId: string, data: BulkAddItemsData): Promise<BulkAddResult>;
  getItemsByListId(listId: string): Promise<MangaListItemEntity[]>;
  itemExists(listId: string, mangaId: string): Promise<boolean>;
}

// Interface para validações e verificações
export interface IMangaListValidationRepository {
  mangaExists(mangaId: string): Promise<boolean>;
  mangasExist(mangaIds: string[]): Promise<string[]>;
  listExists(listId: string): Promise<boolean>;
  getNextOrder(listId: string): Promise<number>;
}

// Tipos específicos do domínio
export interface CreateMangaListData {
  name: string;
  cover: string;
  mood: string;
  description?: string;
  status: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault?: boolean;
}

export interface UpdateMangaListData {
  name?: string;
  cover?: string;
  mood?: string;
  description?: string;
  status?: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault?: boolean;
}

export interface AddMangaListItemData {
  mangaId: string;
  order?: number;
  note?: string;
}

export interface UpdateMangaListItemData {
  order?: number;
  note?: string;
}

export interface ReorderItemData {
  id: string;
  order: number;
}

export interface BulkAddItemsData {
  mangaIds: string[];
  notes?: { [mangaId: string]: string };
}

export interface BulkAddResult {
  added: number;
  skipped: number;
}

export interface MangaListEntity {
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
  items?: MangaListItemEntity[];
}

export interface MangaListItemEntity {
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

export interface PaginatedMangaListResult {
  data: MangaListEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 