import { MangaFilter } from '../repositories/DiscoverRepository';
import { PaginatedResult, ProcessedManga } from '../services/DiscoverService';
import { validateAndNormalizeLanguage, extractPaginationFromQuery } from '../validators/discoverSchemas';

export class DiscoverUseCase {
  constructor() {}

  /**
   * Busca mangás recentes
   */
  async getRecentMangas(language: string, page: number, take: number): Promise<PaginatedResult<ProcessedManga>> {
    // Valida e normaliza o idioma
    const normalizedLanguage = validateAndNormalizeLanguage(language);
    
    // Valida parâmetros de paginação
    const validation = this.discoverService.validatePaginationParams(page, take);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const filter: MangaFilter = {
      language: normalizedLanguage,
      page,
      take
    };

    // Busca mangás e total em paralelo
    const [mangas, total] = await Promise.all([
      this.discoverRepository.findRecentMangas(filter),
      this.discoverRepository.countMangasByLanguage(normalizedLanguage)
    ]);

    // Processa os mangás
    const processedMangas = this.discoverService.processRecentMangas(mangas, normalizedLanguage);

    // Retorna resultado paginado
    return this.discoverService.createPaginatedResult(processedMangas, total, page, take);
  }

  /**
   * Busca mangás mais vistos
   */
  async getMostViewedMangas(language: string, page: number, take: number): Promise<PaginatedResult<ProcessedManga>> {
    const normalizedLanguage = validateAndNormalizeLanguage(language);
    
    const validation = this.discoverService.validatePaginationParams(page, take);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const filter: MangaFilter = {
      language: normalizedLanguage,
      page,
      take
    };

    const [mangas, total] = await Promise.all([
      this.discoverRepository.findMostViewedMangas(filter),
      this.discoverRepository.countMangasByLanguage(normalizedLanguage)
    ]);

    const processedMangas = this.discoverService.processMangaList(mangas, normalizedLanguage);

    return this.discoverService.createPaginatedResult(processedMangas, total, page, take);
  }

  /**
   * Busca mangás mais curtidos
   */
  async getMostLikedMangas(language: string, page: number, take: number): Promise<PaginatedResult<ProcessedManga>> {
    const normalizedLanguage = validateAndNormalizeLanguage(language);
    
    const validation = this.discoverService.validatePaginationParams(page, take);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const filter: MangaFilter = {
      language: normalizedLanguage,
      page,
      take
    };

    const [mangas, total] = await Promise.all([
      this.discoverRepository.findMostLikedMangas(filter),
      this.discoverRepository.countMangasByLanguage(normalizedLanguage)
    ]);

    const processedMangas = this.discoverService.processMangaList(mangas, normalizedLanguage);

    return this.discoverService.createPaginatedResult(processedMangas, total, page, take);
  }

  /**
   * Busca feed personalizado baseado nas categorias favoritas do usuário
   */
  async getFeedForUser(userId: string, language: string, page: number, take: number): Promise<PaginatedResult<ProcessedManga>> {
    const normalizedLanguage = validateAndNormalizeLanguage(language);
    
    const validation = this.discoverService.validatePaginationParams(page, take);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Busca preferências do usuário
    const user = await this.discoverRepository.findUserWithPreferences(userId);

    // Verifica se o usuário existe e tem categorias
    if (!this.discoverService.userHasCategories(user)) {
      return this.discoverService.createPaginatedResult([], 0, page, take);
    }

    const categoryIds = user!.categories.map(cat => cat.id);

    const filter: MangaFilter = {
      language: normalizedLanguage,
      page,
      take
    };

    // Busca mangás por categorias
    const [mangas, total] = await Promise.all([
      this.discoverRepository.findMangasByCategories(categoryIds, filter),
      this.discoverRepository.countMangasByCategories(categoryIds, normalizedLanguage)
    ]);

    const processedMangas = this.discoverService.processMangaList(mangas, normalizedLanguage);

    return this.discoverService.createPaginatedResult(processedMangas, total, page, take);
  }

  /**
   * Busca recomendações baseadas em IA
   */
  async getIARecommendations(userId: string, language: string, page: number, take: number): Promise<PaginatedResult<ProcessedManga>> {
    const normalizedLanguage = validateAndNormalizeLanguage(language);
    
    const validation = this.discoverService.validatePaginationParams(page, take);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Busca preferências completas do usuário
    const user = await this.discoverRepository.findUserWithFullPreferences(userId);

    if (!user) {
      return this.discoverService.createPaginatedResult([], 0, page, take);
    }

    // Extrai categorias de interesse
    const relevantCategories = this.discoverService.extractCategoriesFromUserActivity(user);
    
    if (relevantCategories.length === 0) {
      return this.discoverService.createPaginatedResult([], 0, page, take);
    }

    // Extrai mangás já visualizados para excluir das recomendações
    const viewedMangaIds = this.discoverService.extractViewedMangaIds(user);

    const filter: MangaFilter = {
      language: normalizedLanguage,
      page,
      take
    };

    // Busca mangás para IA
    const [mangas, total] = await Promise.all([
      this.discoverRepository.findMangasForIA(relevantCategories, viewedMangaIds, filter),
      this.discoverRepository.countMangasForIA(relevantCategories, viewedMangaIds, normalizedLanguage)
    ]);

    const processedMangas = this.discoverService.processMangaList(mangas, normalizedLanguage);

    return this.discoverService.createPaginatedResult(processedMangas, total, page, take);
  }

  /**
   * Busca mangás por categorias específicas
   */
  async getMangasByCategories(categoryIds: string[], language: string, page: number, take: number): Promise<PaginatedResult<ProcessedManga>> {
    const normalizedLanguage = validateAndNormalizeLanguage(language);
    
    const validation = this.discoverService.validatePaginationParams(page, take);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    if (!categoryIds || categoryIds.length === 0) {
      throw new Error('Pelo menos uma categoria deve ser fornecida');
    }

    const filter: MangaFilter = {
      language: normalizedLanguage,
      page,
      take
    };

    const [mangas, total] = await Promise.all([
      this.discoverRepository.findMangasByCategories(categoryIds, filter),
      this.discoverRepository.countMangasByCategories(categoryIds, normalizedLanguage)
    ]);

    const processedMangas = this.discoverService.processMangaList(mangas, normalizedLanguage);

    return this.discoverService.createPaginatedResult(processedMangas, total, page, take);
  }

  /**
   * Processa query parameters de request HTTP
   */
  processPaginationFromQuery(query: any): { page: number; take: number; language: string } {
    try {
      const { page, take } = extractPaginationFromQuery(query);
      const language = validateAndNormalizeLanguage(query.lg);
      
      return { page, take, language };
    } catch (error) {
      throw new Error(`Parâmetros de query inválidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Valida se um usuário existe e tem permissões
   */
  async validateUserAccess(userId: string): Promise<boolean> {
    try {
      const user = await this.discoverRepository.findUserWithPreferences(userId);
      return user !== null;
    } catch {
      return false;
    }
  }

  /**
   * Obtém estatísticas de discover para admin/analytics
   */
  async getDiscoverStats(language: string): Promise<{
    totalMangas: number;
    averageMangasPerCategory: number;
  }> {
    const normalizedLanguage = validateAndNormalizeLanguage(language);
    
    const totalMangas = await this.discoverRepository.countMangasByLanguage(normalizedLanguage);
    
    // Aqui poderia ter mais lógica para calcular outras estatísticas
    return {
      totalMangas,
      averageMangasPerCategory: 0 // Placeholder
    };
  }
}