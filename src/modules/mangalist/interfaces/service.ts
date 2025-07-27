import { MangaListFilters } from "@/interfaces/mangaList";
import { 
  CreateMangaListData, 
  UpdateMangaListData, 
  AddMangaListItemData, 
  UpdateMangaListItemData, 
  ReorderItemData, 
  BulkAddItemsData, 
  BulkAddResult, 
  MangaListEntity, 
  MangaListItemEntity, 
  PaginatedMangaListResult 
} from "./repository";

// Interface principal para operações de negócio das listas
export interface IMangaListService {
  createList(data: CreateMangaListData): Promise<MangaListEntity>;
  getListById(id: string): Promise<MangaListEntity | null>;
  getLists(filters: MangaListFilters): Promise<PaginatedMangaListResult>;
  updateList(id: string, data: UpdateMangaListData): Promise<MangaListEntity | null>;
  deleteList(id: string): Promise<boolean>;
}

// Interface para operações de itens da lista
export interface IMangaListItemService {
  addMangaToList(listId: string, data: AddMangaListItemData): Promise<MangaListItemEntity>;
  removeMangaFromList(listId: string, itemId: string): Promise<boolean>;
  updateMangaListItem(listId: string, itemId: string, data: UpdateMangaListItemData): Promise<MangaListItemEntity | null>;
  reorderMangaListItems(listId: string, items: ReorderItemData[]): Promise<boolean>;
  bulkAddMangasToList(listId: string, data: BulkAddItemsData): Promise<BulkAddResult>;
}

// Interface para validações de negócio
export interface IMangaListValidationService {
  validateListExists(listId: string): Promise<void>;
  validateMangaExists(mangaId: string): Promise<void>;
  validateMangasExist(mangaIds: string[]): Promise<string[]>;
  validateItemNotExists(listId: string, mangaId: string): Promise<void>;
  validateItemExists(listId: string, itemId: string): Promise<void>;
}

// Erros específicos do domínio
export class MangaListNotFoundError extends Error {
  constructor(id: string) {
    super(`Lista de manga com ID ${id} não encontrada`);
    this.name = 'MangaListNotFoundError';
  }
}

export class MangaNotFoundError extends Error {
  constructor(id: string) {
    super(`Manga com ID ${id} não encontrado`);
    this.name = 'MangaNotFoundError';
  }
}

export class MangaListItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Item com ID ${itemId} não encontrado na lista`);
    this.name = 'MangaListItemNotFoundError';
  }
}

export class MangaAlreadyInListError extends Error {
  constructor(mangaId: string) {
    super(`Manga com ID ${mangaId} já está na lista`);
    this.name = 'MangaAlreadyInListError';
  }
}

export class InvalidMangaListDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMangaListDataError';
  }
}

// Tipos para resultados de operações
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Tipos para eventos de domínio (se necessário futuramente)
export interface DomainEvent {
  type: string;
  timestamp: Date;
  aggregateId: string;
  data: any;
}

export interface MangaListCreatedEvent extends DomainEvent {
  type: 'MANGA_LIST_CREATED';
  data: {
    listId: string;
    name: string;
    userId: string;
  };
}

export interface MangaAddedToListEvent extends DomainEvent {
  type: 'MANGA_ADDED_TO_LIST';
  data: {
    listId: string;
    mangaId: string;
    itemId: string;
  };
} 