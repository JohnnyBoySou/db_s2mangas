import { Client } from '@elastic/elasticsearch';

// Configuração Elasticsearch otimizada para Railway
// - Timeout de 10s para requests normais
// - Timeout de 5s para health checks
// - 3 tentativas de retry
// - Sniffing desabilitado para single-node
// - SSL verification desabilitada para desenvolvimento
// - Suporte a IPv6 para Railway

interface MangaForIndex {
  id: string;
  manga_uuid: string;
  status: string;
  type: string;
  release_date?: Date;
  created_at: Date;
  translations: Array<{
    language: string;
    name: string;
    description?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    views: number;
    likes: number;
    chapters: number;
    comments: number;
  };
  avg_rating?: number;
}

interface SearchParams {
  query?: string;
  categories?: string[];
  status?: string;
  type?: string;
  language?: string;
  page?: number;
  limit?: number;
}

interface SearchResults {
  data: any[];
  total: number;
  took: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    next: boolean;
    prev: boolean;
  };
}

interface AutocompleteSuggestion {
  text: string;
  score: number;
  type: 'title' | 'category';
}

// Cliente Elasticsearch global
let elasticsearchClient: Client | null = null;
const INDEX_NAME = 'manga_index';

// Inicializar cliente Elasticsearch
function getElasticsearchClient(): Client {
  if (!elasticsearchClient) {
    const elasticUrl = process.env.ELASTIC_URL;
    const hasUsername = !!process.env.ELASTIC_USERNAME;
    const hasPassword = !!process.env.ELASTIC_PASSWORD;
    
    console.log('🔍 Elasticsearch Configuration:');
    console.log(`   URL: ${elasticUrl}`);
    console.log(`   Username: ${hasUsername ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   Password: ${hasPassword ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   Auth: ${hasUsername && hasPassword ? '✅ Habilitado' : '❌ Desabilitado'}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    elasticsearchClient = new Client({
      node: elasticUrl,
      auth: hasUsername && hasPassword ? {
        username: process.env.ELASTIC_USERNAME!,
        password: process.env.ELASTIC_PASSWORD!
      } : undefined,
      // Configurações robustas para Railway
      requestTimeout: 10000, // 10 segundos
      maxRetries: 3,
      // Disable SSL verification for development
      tls: {
        rejectUnauthorized: false
      },
      // Configurações de conexão
      compression: false, // Desabilitar compressão para melhor performance
      sniffOnStart: false, // Desabilitar sniffing para single-node
      sniffInterval: false, // Desabilitar sniffing interval
    });
    
    console.log('✅ Elasticsearch iniciado com sucesso');
  }
  return elasticsearchClient;
}

// Verificar se Elasticsearch está disponível
export async function isElasticsearchAvailable(): Promise<boolean> {
  try {
    console.log('🔍 Checking Elasticsearch availability...');
    const client = getElasticsearchClient();
    
    // Timeout mais curto para health check
    const response: any = await client.ping({}, { 
      requestTimeout: 5000 // 5 segundos para health check
    });
    
    const isAvailable = response.statusCode === 200 || response.meta?.statusCode === 200;
    
    if (isAvailable) {
      console.log('✅ Elasticsearch is available and responding');
    } else {
      console.log('⚠️  Elasticsearch responded but with unexpected status:', response.statusCode);
    }
    
    return isAvailable;
  } catch (error: any) {
    console.error('❌ Elasticsearch not available:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Stack:', error.stack?.split('\n')[0]);
    
    // Log específico para problemas de conexão
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Tip: Check if Elasticsearch is running and accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   💡 Tip: Check ELASTIC_URL configuration');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   💡 Tip: Check network connectivity or increase timeout');
    }
    
    return false;
  }
}

// Criar índice Elasticsearch
export async function createElasticsearchIndex(): Promise<void> {
  try {
    const client = getElasticsearchClient();
    const indexExists = await client.indices.exists({
      index: INDEX_NAME
    });

    if (!indexExists) {
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              manga_uuid: { type: 'keyword' },
              status: { type: 'keyword' },
              type: { type: 'keyword' },
              release_date: { type: 'date' },
              created_at: { type: 'date' },
              popularity_score: { type: 'float' },
              translations: {
                type: 'nested',
                properties: {
                  language: { type: 'keyword' },
                  name: {
                    type: 'text',
                    analyzer: 'manga_analyzer',
                    fields: {
                      keyword: { type: 'keyword' },
                      suggest: { type: 'completion' },
                      ngram: { type: 'text', analyzer: 'ngram_analyzer' }
                    }
                  },
                  description: {
                    type: 'text',
                    analyzer: 'manga_analyzer'
                  }
                }
              },
              categories: {
                type: 'nested',
                properties: {
                  id: { type: 'keyword' },
                  name: {
                    type: 'text',
                    analyzer: 'category_analyzer',
                    fields: {
                      keyword: { type: 'keyword' }
                    }
                  }
                }
              },
              stats: {
                properties: {
                  views_count: { type: 'integer' },
                  likes_count: { type: 'integer' },
                  chapters_count: { type: 'integer' },
                  comments_count: { type: 'integer' },
                  avg_rating: { type: 'float' }
                }
              }
            }
          },
          settings: {
            analysis: {
              analyzer: {
                manga_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'stop_words_filter',
                    'synonym_filter'
                  ]
                },
                ngram_analyzer: {
                  type: 'custom',
                  tokenizer: 'ngram_tokenizer',
                  filter: ['lowercase']
                },
                category_analyzer: {
                  type: 'custom',
                  tokenizer: 'keyword',
                  filter: ['lowercase']
                }
              },
              tokenizer: {
                ngram_tokenizer: {
                  type: 'ngram',
                  min_gram: 2,
                  max_gram: 3,
                  token_chars: ['letter', 'digit']
                }
              },
              filter: {
                stop_words_filter: {
                  type: 'stop',
                  stopwords: ['o', 'a', 'de', 'da', 'do', 'em', 'na', 'no']
                },
                synonym_filter: {
                  type: 'synonym',
                  synonyms: [
                    'manga,manhwa,manhua',
                    'shounen,shonen',
                    'shoujo,shojo',
                    'romance,amor',
                    'ação,action,luta'
                  ]
                }
              }
            }
          }
        }
      });
      console.log('Elasticsearch index created successfully');
    }
  } catch (error) {
    console.error('Failed to create Elasticsearch index:', error);
  }
}

// Indexar um mangá
export async function indexManga(manga: MangaForIndex): Promise<void> {
  try {
    const client = getElasticsearchClient();
    const popularityScore = calculatePopularityScore(manga);

    const document = {
      id: manga.id,
      manga_uuid: manga.manga_uuid,
      status: manga.status,
      type: manga.type,
      release_date: manga.release_date,
      created_at: manga.created_at,
      popularity_score: popularityScore,
      translations: manga.translations,
      categories: manga.categories,
      stats: {
        views_count: manga._count.views,
        likes_count: manga._count.likes,
        chapters_count: manga._count.chapters,
        comments_count: manga._count.comments,
        avg_rating: manga.avg_rating || 0
      }
    };

    await client.index({
      index: INDEX_NAME,
      id: manga.id,
      body: document
    });
  } catch (error) {
    console.error('Failed to index manga:', error);
  }
}

// Indexar múltiplos mangás em lote
export async function bulkIndexMangas(mangas: MangaForIndex[]): Promise<void> {
  try {
    const client = getElasticsearchClient();
    const body = mangas.flatMap(manga => [
      { index: { _index: INDEX_NAME, _id: manga.id } },
      transformMangaForIndex(manga)
    ]);

    const response = await client.bulk({ body });
    
    if (response.errors) {
      console.error('Bulk indexing errors:', response.items.filter((item: any) => item.index?.error));
    }
  } catch (error) {
    console.error('Failed to bulk index mangas:', error);
  }
}

// Buscar mangás
export async function searchMangas(params: SearchParams): Promise<SearchResults> {
  try {
    const client = getElasticsearchClient();
    const query = buildAdvancedQuery(params);
    const from = ((params.page || 1) - 1) * (params.limit || 10);

    const response: any = await client.search({
      index: INDEX_NAME,
      body: {
        query,
        highlight: {
          fields: {
            'translations.name': {},
            'translations.description': {},
            'categories.name': {}
          }
        },
        sort: buildSortCriteria(),
        from,
        size: params.limit || 10
      }
    });

    return transformSearchResults(response, params);
  } catch (error) {
    console.error('Elasticsearch search failed:', error);
    throw error;
  }
}

// Autocomplete
export async function autocomplete(query: string, language = 'pt-BR'): Promise<AutocompleteSuggestion[]> {
  try {
    const client = getElasticsearchClient();
    const response: any = await client.search({
      index: INDEX_NAME,
      body: {
        suggest: {
          title_suggest: {
            prefix: query,
            completion: {
              field: 'translations.name.suggest',
              size: 10,
              contexts: {
                language: [language]
              }
            }
          }
        },
        _source: false
      }
    });

    const suggestions: AutocompleteSuggestion[] = [];
    
    if (response.suggest?.title_suggest?.[0]?.options) {
      const options = Array.isArray(response.suggest.title_suggest[0].options) 
        ? response.suggest.title_suggest[0].options 
        : [response.suggest.title_suggest[0].options];
        
      options.forEach((option: any) => {
        suggestions.push({
          text: option.text,
          score: option._score,
          type: 'title'
        });
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Autocomplete failed:', error);
    return [];
  }
}

// Funções auxiliares privadas
function calculatePopularityScore(manga: MangaForIndex): number {
  const weights = {
    views: 0.3,
    likes: 0.4,
    comments: 0.2,
    rating: 0.1
  };

  const normalized = {
    views: Math.log(manga._count.views + 1) / 10,
    likes: Math.log(manga._count.likes + 1) / 10,
    comments: Math.log(manga._count.comments + 1) / 10,
    rating: (manga.avg_rating || 0) / 10
  };

  return Object.entries(weights).reduce(
    (score, [key, weight]) => score + normalized[key as keyof typeof normalized] * weight,
    0
  );
}

function transformMangaForIndex(manga: MangaForIndex) {
  const popularityScore = calculatePopularityScore(manga);

  return {
    id: manga.id,
    manga_uuid: manga.manga_uuid,
    status: manga.status,
    type: manga.type,
    release_date: manga.release_date,
    created_at: manga.created_at,
    popularity_score: popularityScore,
    translations: manga.translations,
    categories: manga.categories,
    stats: {
      views_count: manga._count.views,
      likes_count: manga._count.likes,
      chapters_count: manga._count.chapters,
      comments_count: manga._count.comments,
      avg_rating: manga.avg_rating || 0
    }
  };
}

function buildAdvancedQuery(params: SearchParams) {
  const must: any[] = [];
  const filter: any[] = [];

  // Text search
  if (params.query) {
    const textQuery = {
      bool: {
        should: [
          // Exact match in name (high boost)
          {
            nested: {
              path: 'translations',
              query: {
                match: {
                  'translations.name': {
                    query: params.query,
                    boost: 3.0,
                    fuzziness: 'AUTO'
                  }
                }
              }
            }
          },
          // N-gram match for autocomplete
          {
            nested: {
              path: 'translations',
              query: {
                match: {
                  'translations.name.ngram': {
                    query: params.query,
                    boost: 2.0
                  }
                }
              }
            }
          },
          // Description search
          {
            nested: {
              path: 'translations',
              query: {
                match: {
                  'translations.description': {
                    query: params.query,
                    boost: 1.0
                  }
                }
              }
            }
          },
          // Category search
          {
            nested: {
              path: 'categories',
              query: {
                match: {
                  'categories.name': {
                    query: params.query,
                    boost: 1.5
                  }
                }
              }
            }
          }
        ],
        minimum_should_match: 1
      }
    };
    
    must.push(textQuery);
  }

  // Filters
  if (params.categories && params.categories.length > 0) {
    filter.push({
      nested: {
        path: 'categories',
        query: {
          terms: {
            'categories.id': params.categories
          }
        }
      }
    });
  }

  if (params.type) {
    filter.push({ term: { type: params.type } });
  }

  if (params.status) {
    filter.push({ term: { status: params.status } });
  }

  if (params.language) {
    filter.push({
      nested: {
        path: 'translations',
        query: {
          term: { 'translations.language': params.language }
        }
      }
    });
  }

  return {
    bool: {
      must: must.length > 0 ? must : [{ match_all: {} }],
      filter
    }
  };
}

function buildSortCriteria(): any {
  return [
    // Boost by popularity score
    { _score: { order: 'desc' } },
    { popularity_score: { order: 'desc' } },
    { created_at: { order: 'desc' } }
  ];
}

function transformSearchResults(response: any, params: SearchParams): SearchResults {
  const hits = response.hits.hits || [];
  const total = response.hits.total?.value || 0;
  const took = response.took || 0;

  const data = hits.map((hit: any) => {
    const source = hit._source;
    // Get translation for requested language
    const translation = source.translations?.find(
      (t: any) => t.language === (params.language || 'pt-BR')
    ) || source.translations?.[0];

    return {
      ...source,
      title: translation?.name || 'Sem título',
      description: translation?.description || '',
      score: hit._score,
      highlight: hit.highlight
    };
  });

  const page = params.page || 1;
  const limit = params.limit || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    took,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      next: page < totalPages,
      prev: page > 1
    }
  };
}

