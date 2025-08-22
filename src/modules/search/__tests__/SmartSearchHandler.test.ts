import SmartSearchHandler from '../handlers/SmartSearchHandler';

// Mock the Elasticsearch service for testing
jest.mock('@/services/ElasticsearchService', () => {
  return jest.fn().mockImplementation(() => ({
    isAvailable: jest.fn().mockResolvedValue(false), // Mock as unavailable for fallback testing
    search: jest.fn(),
    autocomplete: jest.fn().mockResolvedValue([]),
    createIndex: jest.fn(),
    indexManga: jest.fn(),
    bulkIndexMangas: jest.fn()
  }));
});

// Mock the original search handler
jest.mock('../handlers/SearchHandler', () => ({
  searchManga: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'test-manga-1',
        title: 'Test Manga',
        description: 'Test description',
        status: 'Em andamento',
        type: 'Manga'
      }
    ],
    pagination: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      next: false,
      prev: false
    }
  })
}));

describe('SmartSearchHandler', () => {
  let smartSearchHandler: SmartSearchHandler;

  beforeEach(() => {
    smartSearchHandler = new SmartSearchHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intelligentSearch', () => {
    it('should fallback to SQL search when Elasticsearch is not available', async () => {
      const searchParams = {
        name: 'Test Manga',
        page: 1,
        limit: 10,
        language: 'pt-BR'
      };

      const result = await smartSearchHandler.intelligentSearch(searchParams);

      expect(result).toEqual({
        data: expect.any(Array),
        total: 1,
        searchType: 'sql',
        pagination: expect.any(Object),
        performance: expect.objectContaining({
          elasticsearchAvailable: false,
          responseTime: expect.any(Number)
        })
      });
    });

    it('should handle empty search parameters', async () => {
      const result = await smartSearchHandler.intelligentSearch({});

      expect(result).toEqual({
        data: expect.any(Array),
        total: expect.any(Number),
        searchType: 'sql',
        pagination: expect.any(Object),
        performance: expect.any(Object)
      });
    });

    it('should include performance metrics', async () => {
      const result = await smartSearchHandler.intelligentSearch({
        name: 'Test',
        language: 'pt-BR'
      });

      expect(result.performance).toBeDefined();
      expect(result.performance?.elasticsearchAvailable).toBe(false);
      expect(result.performance?.responseTime).toBeGreaterThan(0);
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('should return empty array when Elasticsearch is not available', async () => {
      const suggestions = await smartSearchHandler.getAutocompleteSuggestions('test');

      expect(suggestions).toEqual([]);
    });

    it('should handle empty query', async () => {
      const suggestions = await smartSearchHandler.getAutocompleteSuggestions('');

      expect(suggestions).toEqual([]);
    });
  });

  describe('getSearchHealth', () => {
    it('should return correct health status', async () => {
      const health = await smartSearchHandler.getSearchHealth();

      expect(health).toEqual({
        elasticsearch: false,
        sql: true,
        recommendedSearchType: 'sql'
      });
    });
  });

  describe('enhancedSearch', () => {
    it('should call intelligentSearch', async () => {
      const spy = jest.spyOn(smartSearchHandler, 'intelligentSearch');
      
      const params = { name: 'Test Manga' };
      await smartSearchHandler.enhancedSearch(params);

      expect(spy).toHaveBeenCalledWith(params);
    });
  });

  describe('indexManga', () => {
    it('should not throw when Elasticsearch is not available', async () => {
      const mangaData = {
        id: 'test-id',
        manga_uuid: 'test-uuid',
        status: 'ACTIVE',
        type: 'Manga',
        created_at: new Date(),
        translations: [],
        categories: [],
        _count: { views: 0, likes: 0, chapters: 0, comments: 0 }
      };

      await expect(smartSearchHandler.indexManga(mangaData)).resolves.not.toThrow();
    });
  });

  describe('bulkIndexMangas', () => {
    it('should not throw when Elasticsearch is not available', async () => {
      const mangas = [
        {
          id: 'test-id',
          manga_uuid: 'test-uuid',
          status: 'ACTIVE',
          type: 'Manga',
          created_at: new Date(),
          translations: [],
          categories: [],
          _count: { views: 0, likes: 0, chapters: 0, comments: 0 }
        }
      ];

      await expect(smartSearchHandler.bulkIndexMangas(mangas)).resolves.not.toThrow();
    });
  });

  describe('initializeIndex', () => {
    it('should not throw when Elasticsearch is not available', async () => {
      await expect(smartSearchHandler.initializeIndex()).resolves.not.toThrow();
    });
  });
});