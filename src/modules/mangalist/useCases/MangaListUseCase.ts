import { MangaListFilters } from "@/interfaces/mangaList";
import { MangaListRepository } from "../repositories/MangaListRepository";
import { MangaListItemRepository } from "../repositories/MangaListItemRepository";
import { MangaListValidationRepository } from "../repositories/MangaListValidationRepository";
import { MangaListService, ProcessedMangaList, PaginatedResult } from "../services/MangaListService";
import { 
  CreateMangaListData, 
  UpdateMangaListData, 
  AddMangaListItemData, 
  UpdateMangaListItemData, 
  ReorderItemData, 
  BulkAddItemsData 
} from "../interfaces/repository";
import { 
  MangaListNotFoundError, 
  MangaNotFoundError, 
  MangaListItemNotFoundError, 
  MangaAlreadyInListError, 
  InvalidMangaListDataError 
} from "../interfaces/service";

export class MangaListUseCase {
  constructor(
    private mangaListRepository: MangaListRepository,
    private mangaListItemRepository: MangaListItemRepository,
    private validationRepository: MangaListValidationRepository,
    private mangaListService: MangaListService
  ) {}

  /**
   * Cria uma nova lista de mangás
   */
  async createMangaList(data: CreateMangaListData): Promise<ProcessedMangaList> {
    // Normaliza os dados de entrada
    const normalizedData = this.mangaListService.normalizeCreateData(data);

    // Valida os dados
    const validation = this.mangaListService.validateCreateListData(normalizedData);
    if (!validation.isValid) {
      throw new InvalidMangaListDataError(validation.errors.join(', '));
    }

    // Cria a lista
    const createdList = await this.mangaListRepository.create(normalizedData);

    // Processa e retorna o resultado
    return this.mangaListService.processMangaList(createdList);
  }

  /**
   * Busca listas de mangás com filtros e paginação
   */
  async getMangaLists(filters: MangaListFilters): Promise<PaginatedResult<ProcessedMangaList>> {
    // Processa e valida os filtros
    const processedFilters = this.mangaListService.processFilters(filters);

    // Valida parâmetros de paginação
    const validation = this.mangaListService.validatePaginationParams(
      processedFilters.page || 1, 
      processedFilters.limit || 20
    );
    if (!validation.isValid) {
      throw new InvalidMangaListDataError(validation.errors.join(', '));
    }

    // Busca as listas
    const result = await this.mangaListRepository.findMany(processedFilters);

    // Processa os resultados
    const processedLists = this.mangaListService.processMangaListArray(result.data);

    // Retorna resultado paginado
    return this.mangaListService.createPaginatedResult(
      processedLists, 
      result.pagination.total, 
      result.pagination.page, 
      result.pagination.limit
    );
  }

  /**
   * Busca uma lista específica por ID
   */
  async getMangaListById(id: string): Promise<ProcessedMangaList> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(id);
    if (!listExists) {
      throw new MangaListNotFoundError(id);
    }

    // Busca a lista
    const list = await this.mangaListRepository.findById(id);
    if (!list) {
      throw new MangaListNotFoundError(id);
    }

    // Processa e retorna o resultado
    return this.mangaListService.processMangaList(list);
  }

  /**
   * Atualiza uma lista de mangás
   */
  async updateMangaList(id: string, data: UpdateMangaListData): Promise<ProcessedMangaList> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(id);
    if (!listExists) {
      throw new MangaListNotFoundError(id);
    }

    // Normaliza os dados de entrada
    const normalizedData = this.mangaListService.normalizeUpdateData(data);

    // Valida os dados
    const validation = this.mangaListService.validateUpdateListData(normalizedData);
    if (!validation.isValid) {
      throw new InvalidMangaListDataError(validation.errors.join(', '));
    }

    // Atualiza a lista
    const updatedList = await this.mangaListRepository.update(id, normalizedData);
    if (!updatedList) {
      throw new MangaListNotFoundError(id);
    }

    // Processa e retorna o resultado
    return this.mangaListService.processMangaList(updatedList);
  }

  /**
   * Remove uma lista de mangás
   */
  async deleteMangaList(id: string): Promise<boolean> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(id);
    if (!listExists) {
      throw new MangaListNotFoundError(id);
    }

    // Remove a lista
    return await this.mangaListRepository.delete(id);
  }

  /**
   * Adiciona um mangá a uma lista
   */
  async addMangaToList(listId: string, data: AddMangaListItemData): Promise<any> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(listId);
    if (!listExists) {
      throw new MangaListNotFoundError(listId);
    }

    // Verifica se o mangá existe
    const mangaExists = await this.validationRepository.mangaExists(data.mangaId);
    if (!mangaExists) {
      throw new MangaNotFoundError(data.mangaId);
    }

    // Verifica se o mangá já está na lista
    const mangaInList = await this.mangaListItemRepository.itemExists(listId, data.mangaId);
    if (mangaInList) {
      throw new MangaAlreadyInListError(data.mangaId);
    }

    // Adiciona o mangá à lista
    const addedItem = await this.mangaListItemRepository.addItem(listId, data);

    // Processa e retorna o resultado
    return this.mangaListService.processMangaListItem(addedItem);
  }

  /**
   * Remove um mangá de uma lista
   */
  async removeMangaFromList(listId: string, itemId: string): Promise<boolean> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(listId);
    if (!listExists) {
      throw new MangaListNotFoundError(listId);
    }

    // Verifica se o item existe na lista
    const itemExists = await this.validationRepository.itemExists(listId, itemId);
    if (!itemExists) {
      throw new MangaListItemNotFoundError(itemId);
    }

    // Remove o item da lista
    return await this.mangaListItemRepository.removeItem(listId, itemId);
  }

  /**
   * Atualiza um item da lista
   */
  async updateMangaListItem(listId: string, itemId: string, data: UpdateMangaListItemData): Promise<any> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(listId);
    if (!listExists) {
      throw new MangaListNotFoundError(listId);
    }

    // Verifica se o item existe na lista
    const itemExists = await this.validationRepository.itemExists(listId, itemId);
    if (!itemExists) {
      throw new MangaListItemNotFoundError(itemId);
    }

    // Atualiza o item
    const updatedItem = await this.mangaListItemRepository.updateItem(listId, itemId, data);
    if (!updatedItem) {
      throw new MangaListItemNotFoundError(itemId);
    }

    // Processa e retorna o resultado
    return this.mangaListService.processMangaListItem(updatedItem);
  }

  /**
   * Reordena itens da lista
   */
  async reorderMangaListItems(listId: string, items: ReorderItemData[]): Promise<boolean> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(listId);
    if (!listExists) {
      throw new MangaListNotFoundError(listId);
    }

    // Verifica se todos os itens existem na lista
    const itemIds = items.map(item => item.id);
    const canReorder = await this.validationRepository.canReorderItems(listId, itemIds);
    if (!canReorder) {
      throw new InvalidMangaListDataError('Um ou mais itens não pertencem à lista');
    }

    // Reordena os itens
    return await this.mangaListItemRepository.reorderItems(listId, items);
  }

  /**
   * Adiciona múltiplos mangás a uma lista
   */
  async bulkAddMangasToList(listId: string, data: BulkAddItemsData): Promise<any> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(listId);
    if (!listExists) {
      throw new MangaListNotFoundError(listId);
    }

    // Valida a operação em lote
    const validation = await this.validationRepository.validateBulkOperation(listId, data.mangaIds);
    
    if (validation.validMangaIds.length === 0) {
      throw new InvalidMangaListDataError(
        'Nenhum mangá válido para adicionar (todos são inválidos ou já estão na lista)'
      );
    }

    // Adiciona os mangás válidos
    const result = await this.mangaListItemRepository.bulkAddItems(listId, {
      mangaIds: validation.validMangaIds,
      notes: data.notes
    });

    // Processa e retorna o resultado
    return this.mangaListService.processBulkAddResult(result);
  }

  /**
   * Busca estatísticas de uma lista
   */
  async getMangaListStats(listId: string): Promise<any> {
    // Verifica se a lista existe
    const listExists = await this.validationRepository.listExists(listId);
    if (!listExists) {
      throw new MangaListNotFoundError(listId);
    }

    // Busca a lista completa
    const list = await this.mangaListRepository.findById(listId);
    if (!list) {
      throw new MangaListNotFoundError(listId);
    }

    // Gera estatísticas
    return this.mangaListService.generateListStats(list);
  }

  /**
   * Verifica se um usuário tem permissão para acessar uma lista
   */
  async validateUserAccess(userId: string, listId: string): Promise<boolean> {
    return await this.validationRepository.userHasPermission(userId, listId);
  }

  /**
   * Busca listas públicas
   */
  async getPublicMangaLists(filters: MangaListFilters): Promise<PaginatedResult<ProcessedMangaList>> {
    // Força o filtro para listas públicas
    const publicFilters = {
      ...filters,
      status: 'PUBLIC' as const
    };

    return await this.getMangaLists(publicFilters);
  }

  /**
   * Busca listas por mood
   */
  async getMangaListsByMood(mood: string, filters: MangaListFilters): Promise<PaginatedResult<ProcessedMangaList>> {
    // Adiciona o filtro de mood
    const moodFilters = {
      ...filters,
      mood: mood.trim()
    };

    return await this.getMangaLists(moodFilters);
  }

  /**
   * Valida dados de entrada para processar query
   */
  processPaginationFromQuery(query: any): { page: number; limit: number; filters: MangaListFilters } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

    const filters: MangaListFilters = {
      userId: query.userId,
      status: query.status,
      mood: query.mood,
      search: query.search,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
      page,
      limit
    };

    return { page, limit, filters };
  }
} 