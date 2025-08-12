import { MangaWithTranslations, PaginationInfo } from '../repositories/DiscoverRepository';

export interface ProcessedManga {
  id: string;
  manga_uuid: string;
  title: string;
  description: string;
  cover: string;
  views_count?: number;
  likes_count?: number;
  categories?: Array<{ id: string; name: string; }>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

export class DiscoverService {
  /**
   * Traduz mangá para o idioma especificado, com fallback para inglês
   */
  translateManga(manga: MangaWithTranslations, language: string): ProcessedManga {
    const translation = manga.translations.find((t) => t.language === language);
    
    let selectedTranslation;
    if (translation) {
      selectedTranslation = translation;
    } else {
      // Fallback para inglês ou primeira tradução disponível
      selectedTranslation = manga.translations.find((t) => t.language === 'en') ?? manga.translations[0];
    }

    return {
      id: manga.id,
      manga_uuid: manga.manga_uuid,
      title: selectedTranslation?.name ?? '',
      description: selectedTranslation?.description ?? '',
      cover: manga.cover,
      views_count: manga._count.views,
      likes_count: manga._count.likes,
      categories: manga.categories
    };
  }

  /**
   * Processa uma lista de mangás aplicando tradução
   */
  processMangaList(mangas: MangaWithTranslations[], language: string): ProcessedManga[] {
    return mangas
      .map(manga => this.translateManga(manga, language))
      .filter(manga => manga.title); // Remove mangás sem tradução
  }

  /**
   * Calcula informações de paginação
   */
  calculatePagination(total: number, page: number, limit: number): PaginationInfo {
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
  createPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return {
      data,
      pagination: this.calculatePagination(total, page, limit)
    };
  }

  /**
   * Extrai categorias únicas de mangás visualizados e curtidos
   */
  extractCategoriesFromUserActivity(user: any): string[] {
    const viewedCategories = user.views?.flatMap((view: any) => 
      view.manga.categories.map((cat: any) => cat.id)
    ) || [];
    
    const likedCategories = user.likes?.flatMap((like: any) => 
      like.manga.categories.map((cat: any) => cat.id)
    ) || [];

    const userCategories = user.categories?.map((cat: any) => cat.id) || [];

    // Combina todas as categorias e remove duplicatas
    return [...new Set([
      ...userCategories,
      ...viewedCategories,
      ...likedCategories
    ])];
  }

  /**
   * Extrai IDs de mangás já visualizados pelo usuário
   */
  extractViewedMangaIds(user: any): string[] {
    return user.views?.map((view: any) => view.mangaId) || [];
  }

  /**
   * Valida se o usuário tem categorias preferidas
   */
  userHasCategories(user: any): boolean {
    return user && user.categories && user.categories.length > 0;
  }

  /**
   * Processa mangás recentes removendo dados desnecessários
   */
  processRecentMangas(mangas: MangaWithTranslations[]): ProcessedManga[] {
    return mangas.map(manga => ({
      id: manga.id,
      manga_uuid: manga.manga_uuid,
      title: manga.translations[0]?.name ?? '',
      description: manga.translations[0]?.description ?? '',
      cover: manga.cover,
      views_count: manga._count.views
    }));
  }

  /**
   * Valida parâmetros de entrada
   */
  validatePaginationParams(page: number, take: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (page < 1) {
      errors.push('Página deve ser maior que 0');
    }

    if (take < 1 || take > 100) {
      errors.push('Limite deve estar entre 1 e 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida idioma
   */
  validateLanguage(language: string): boolean {
    const supportedLanguages = ['pt', 'en', 'es', 'fr', 'de', 'ja', 'pt-BR', 'pt-br'];
    return supportedLanguages.includes(language);
  }

  /**
   * Normaliza idioma para formato padrão
   */
  normalizeLanguage(language?: string): string {
    if (!language) return 'en';
    
    const normalized = language.toLowerCase();
    
    // Mapeia variações para formatos padrão
    const languageMap: Record<string, string> = {
      'pt-br': 'pt',
      'pt-pt': 'pt',
      'en-us': 'en',
      'en-gb': 'en'
    };

    return languageMap[normalized] || normalized;
  }
}