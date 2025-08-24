import ElasticsearchService from '@/services/ElasticsearchService';
import * as searchHandlers from './SearchHandler';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@/constants/search';

interface SmartSearchParams {
  name?: string;
  categories?: string[];
  status?: string;
  type?: string;
  language?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
}

interface SmartSearchResults {
  data: any[];
  total: number;
  took?: number;
  searchType: 'elasticsearch' | 'sql';
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    next: boolean;
    prev: boolean;
  };
  suggestions?: any[];
  performance?: {
    elasticsearchAvailable: boolean;
    responseTime: number;
  };
}

export class SmartSearchHandler {
  private elasticsearchService: ElasticsearchService;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
  }

  /**
   * Intelligent search that tries Elasticsearch first, falls back to SQL
   */
  async intelligentSearch(params: SmartSearchParams): Promise<SmartSearchResults> {
    const startTime = Date.now();
    const {
      name,
      categories,
      status,
      type,
      language = 'pt-BR',
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT
    } = params;

    try {
      // Check if Elasticsearch is available
      const elasticsearchAvailable = await this.elasticsearchService.isAvailable();
      
      if (elasticsearchAvailable) {
        // Try Elasticsearch search
        const elasticResults = await this.elasticsearchService.search({
          query: name,
          categories,
          status,
          type,
          language,
          page,
          limit
        });

        const responseTime = Date.now() - startTime;

        return {
          ...elasticResults,
          searchType: 'elasticsearch',
          performance: {
            elasticsearchAvailable: true,
            responseTime
          }
        };
      } else {
        console.warn('Elasticsearch not available, falling back to SQL search');
        throw new Error('Elasticsearch not available');
      }
    } catch (error) {
      console.warn('Elasticsearch search failed, falling back to SQL:', error);
      
      // Fallback to SQL search
      const sqlResults = await this.fallbackToSqlSearch(params);
      const responseTime = Date.now() - startTime;

      return {
        ...sqlResults,
        searchType: 'sql',
        performance: {
          elasticsearchAvailable: false,
          responseTime
        }
      };
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string, language = 'pt-BR'): Promise<any[]> {
    try {
      const available = await this.elasticsearchService.isAvailable();
      if (available) {
        return await this.elasticsearchService.autocomplete(query, language);
      }
    } catch (error) {
      console.warn('Autocomplete failed:', error);
    }
    
    // Fallback: return empty suggestions
    return [];
  }

  /**
   * Index a single manga into Elasticsearch
   */
  async indexManga(mangaData: any): Promise<void> {
    try {
      const available = await this.elasticsearchService.isAvailable();
      if (available) {
        await this.elasticsearchService.indexManga(mangaData);
      }
    } catch (error) {
      console.error('Failed to index manga:', error);
    }
  }

  /**
   * Bulk index mangas into Elasticsearch
   */
  async bulkIndexMangas(mangas: any[]): Promise<void> {
    try {
      const available = await this.elasticsearchService.isAvailable();
      if (available) {
        await this.elasticsearchService.bulkIndexMangas(mangas);
      }
    } catch (error) {
      console.error('Failed to bulk index mangas:', error);
    }
  }

  /**
   * Initialize Elasticsearch index
   */
  async initializeIndex(): Promise<void> {
    try {
      const available = await this.elasticsearchService.isAvailable();
      if (available) {
        await this.elasticsearchService.createIndex();
      }
    } catch (error) {
      console.error('Failed to initialize Elasticsearch index:', error);
    }
  }

  /**
   * Check system health
   */
  async getSearchHealth(): Promise<{
    elasticsearch: boolean;
    sql: boolean;
    recommendedSearchType: 'elasticsearch' | 'sql';
  }> {
    const elasticsearchAvailable = await this.elasticsearchService.isAvailable();
    
    return {
      elasticsearch: elasticsearchAvailable,
      sql: true, // SQL is always available
      recommendedSearchType: elasticsearchAvailable ? 'elasticsearch' : 'sql'
    };
  }

  /**
   * Fallback to SQL search using existing handler
   */
  private async fallbackToSqlSearch(params: SmartSearchParams): Promise<Omit<SmartSearchResults, 'searchType' | 'performance'>> {
    const {
      name,
      categories,
      status,
      type,
      language = 'pt-BR',
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT
    } = params;

    // Convert categories array to single category for SQL handler
    const category = categories && categories.length > 0 ? categories[0] : undefined;

    const result = await searchHandlers.searchManga({
      name,
      category,
      status,
      type,
      language,
      page,
      limit
    });

    return {
      data: result.data,
      total: result.pagination.total,
      pagination: result.pagination
    };
  }

  /**
   * Enhanced search with search type detection
   */
  async enhancedSearch(params: SmartSearchParams): Promise<SmartSearchResults> {
    const _searchType = this.detectSearchIntent(params.name || '');
    
    // For now, all searches go through intelligent search
    // In the future, we can route different search types differently
    return await this.intelligentSearch(params);
  }

  /**
   * Simple search intent detection
   */
  private detectSearchIntent(query: string): 'basic' | 'semantic' | 'fuzzy' {
    const lowerQuery = query.toLowerCase();
    
    // Future: implement more sophisticated intent detection
    if (lowerQuery.includes('similar') || lowerQuery.includes('like') || lowerQuery.includes('parecido')) {
      return 'semantic';
    }
    
    if (query.length < 3) {
      return 'fuzzy';
    }
    
    return 'basic';
  }
}

export default SmartSearchHandler;