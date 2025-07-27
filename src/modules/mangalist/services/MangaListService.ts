import { MangaListFilters } from "@/interfaces/mangaList";
import { 
  MangaListEntity, 
  MangaListItemEntity, 
  PaginatedMangaListResult,
  CreateMangaListData,
  UpdateMangaListData,
  BulkAddResult
} from "../interfaces/repository";
import { 
  MangaListResponseDTO, 
  MangaListItemResponseDTO, 
  PaginatedMangaListResponseDTO 
} from "../types/dto";

export interface ProcessedMangaList {
  id: string;
  name: string;
  cover: string;
  mood: string;
  description?: string;
  status: 'PRIVATE' | 'PUBLIC' | 'UNLISTED';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  likesCount: number;
  items?: ProcessedMangaListItem[];
}

export interface ProcessedMangaListItem {
  id: string;
  mangaId: string;
  order: number;
  note?: string;
  addedAt: Date;
  manga?: {
    id: string;
    title: string;
    cover: string;
    manga_uuid?: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    next: boolean;
    prev: boolean;
  };
}

export class MangaListService {
  /**
   * Processa uma lista de mangás para exibição
   */
  processMangaList(entity: MangaListEntity): ProcessedMangaList {
    return {
      id: entity.id,
      name: entity.name,
      cover: entity.cover,
      mood: entity.mood,
      description: entity.description,
      status: entity.status,
      isDefault: entity.isDefault,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      itemCount: entity.itemCount || 0,
      likesCount: entity.likesCount || 0,
      items: entity.items?.map(item => this.processMangaListItem(item))
    };
  }

  /**
   * Processa um item da lista de mangás
   */
  processMangaListItem(entity: MangaListItemEntity): ProcessedMangaListItem {
    return {
      id: entity.id,
      mangaId: entity.mangaId,
      order: entity.order,
      note: entity.note,
      addedAt: entity.addedAt,
      manga: entity.manga ? {
        id: entity.manga.id,
        title: entity.manga.translations?.[0]?.name || 'Sem título',
        cover: entity.manga.cover,
        manga_uuid: entity.manga.manga_uuid
      } : undefined
    };
  }

  /**
   * Processa uma lista de mangás
   */
  processMangaListArray(entities: MangaListEntity[]): ProcessedMangaList[] {
    return entities.map(entity => this.processMangaList(entity));
  }

  /**
   * Calcula informações de paginação
   */
  calculatePagination(total: number, page: number, limit: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    next: boolean;
    prev: boolean;
  } {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      next: page < totalPages,
      prev: page > 1,
    };
  }

  /**
   * Cria resultado paginado
   */
  createPaginatedResult<T>(
    data: T[], 
    total: number, 
    page: number, 
    limit: number
  ): PaginatedResult<T> {
    return {
      data,
      pagination: this.calculatePagination(total, page, limit)
    };
  }

  /**
   * Valida parâmetros de paginação
   */
  validatePaginationParams(page: number, limit: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (page < 1) {
      errors.push('Página deve ser maior que 0');
    }

    if (limit < 1 || limit > 100) {
      errors.push('Limite deve estar entre 1 e 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dados de criação de lista
   */
  validateCreateListData(data: CreateMangaListData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Nome da lista é obrigatório');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Nome da lista deve ter no máximo 100 caracteres');
    }

    if (!data.cover?.trim()) {
      errors.push('Capa da lista é obrigatória');
    }

    if (!data.mood?.trim()) {
      errors.push('Mood da lista é obrigatório');
    }

    if (data.mood && data.mood.length > 50) {
      errors.push('Mood deve ter no máximo 50 caracteres');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Descrição deve ter no máximo 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dados de atualização de lista
   */
  validateUpdateListData(data: UpdateMangaListData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined && !data.name?.trim()) {
      errors.push('Nome da lista não pode ser vazio');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Nome da lista deve ter no máximo 100 caracteres');
    }

    if (data.mood !== undefined && !data.mood?.trim()) {
      errors.push('Mood não pode ser vazio');
    }

    if (data.mood && data.mood.length > 50) {
      errors.push('Mood deve ter no máximo 50 caracteres');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Descrição deve ter no máximo 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Processa filtros de busca
   */
  processFilters(filters: MangaListFilters): MangaListFilters {
    return {
      userId: filters.userId,
      status: filters.status,
      mood: filters.mood?.trim(),
      search: filters.search?.trim(),
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc',
      page: Math.max(1, filters.page || 1),
      limit: Math.min(100, Math.max(1, filters.limit || 20))
    };
  }

  /**
   * Processa resultado de operação em lote
   */
  processBulkAddResult(result: BulkAddResult): {
    success: boolean;
    added: number;
    skipped: number;
    message: string;
  } {
    const success = result.added > 0;
    let message = '';

    if (result.added > 0 && result.skipped > 0) {
      message = `${result.added} mangás adicionados, ${result.skipped} ignorados (já existiam na lista)`;
    } else if (result.added > 0) {
      message = `${result.added} mangás adicionados com sucesso`;
    } else {
      message = 'Nenhum mangá foi adicionado (todos já existiam na lista)';
    }

    return {
      success,
      added: result.added,
      skipped: result.skipped,
      message
    };
  }

  /**
   * Verifica se uma lista está vazia
   */
  isListEmpty(list: MangaListEntity): boolean {
    return (list.itemCount || 0) === 0;
  }

  /**
   * Verifica se uma lista é pública
   */
  isListPublic(list: MangaListEntity): boolean {
    return list.status === 'PUBLIC';
  }

  /**
   * Verifica se uma lista é privada
   */
  isListPrivate(list: MangaListEntity): boolean {
    return list.status === 'PRIVATE';
  }

  /**
   * Verifica se uma lista é não listada
   */
  isListUnlisted(list: MangaListEntity): boolean {
    return list.status === 'UNLISTED';
  }

  /**
   * Gera estatísticas da lista
   */
  generateListStats(list: MangaListEntity): {
    totalItems: number;
    averageOrder: number;
    hasNotes: boolean;
    createdDaysAgo: number;
    lastUpdatedDaysAgo: number;
  } {
    const now = new Date();
    const createdDaysAgo = Math.floor((now.getTime() - list.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const lastUpdatedDaysAgo = Math.floor((now.getTime() - list.updatedAt.getTime()) / (1000 * 60 * 60 * 24));

    let averageOrder = 0;
    let hasNotes = false;

    if (list.items && list.items.length > 0) {
      averageOrder = list.items.reduce((sum, item) => sum + item.order, 0) / list.items.length;
      hasNotes = list.items.some(item => item.note && item.note.trim() !== '');
    }

    return {
      totalItems: list.itemCount || 0,
      averageOrder,
      hasNotes,
      createdDaysAgo,
      lastUpdatedDaysAgo
    };
  }

  /**
   * Normaliza dados de entrada
   */
  normalizeCreateData(data: any): CreateMangaListData {
    return {
      name: data.name?.trim() || '',
      cover: data.cover?.trim() || '',
      mood: data.mood?.trim() || '',
      description: data.description?.trim() || undefined,
      status: data.status || 'PRIVATE',
      isDefault: Boolean(data.isDefault)
    };
  }

  /**
   * Normaliza dados de atualização
   */
  normalizeUpdateData(data: any): UpdateMangaListData {
    const normalized: UpdateMangaListData = {};

    if (data.name !== undefined) {
      normalized.name = data.name?.trim() || '';
    }

    if (data.cover !== undefined) {
      normalized.cover = data.cover?.trim() || '';
    }

    if (data.mood !== undefined) {
      normalized.mood = data.mood?.trim() || '';
    }

    if (data.description !== undefined) {
      normalized.description = data.description?.trim() || undefined;
    }

    if (data.status !== undefined) {
      normalized.status = data.status;
    }

    if (data.isDefault !== undefined) {
      normalized.isDefault = Boolean(data.isDefault);
    }

    return normalized;
  }
} 