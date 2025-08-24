import { PrismaClient } from '@prisma/client';
import * as advancedCache from './advancedCache';
import { logger } from './logger';
import crypto from 'crypto';

interface PrismaCacheConfig {
  ttl: number;
  tags: string[];
  enabled: boolean;
  compression?: boolean;
  l2Cache?: boolean;
}

const PRISMA_CACHE_CONFIG: Record<string, PrismaCacheConfig> = {
  manga: {
    ttl: 3600, // 1 hora
    tags: ['manga'],
    enabled: true,
    compression: true,
    l2Cache: true
  },
  chapter: {
    ttl: 1800, // 30 minutos
    tags: ['chapter', 'manga'],
    enabled: true,
    compression: true,
    l2Cache: false
  },
  user: {
    ttl: 900, // 15 minutos
    tags: ['user'],
    enabled: true,
    compression: true,
    l2Cache: false
  },
  category: {
    ttl: 86400, // 24 horas
    tags: ['category'],
    enabled: true,
    compression: false,
    l2Cache: true
  },
  collection: {
    ttl: 1800, // 30 minutos
    tags: ['collection', 'user'],
    enabled: true,
    compression: true,
    l2Cache: false
  },
  library: {
    ttl: 600, // 10 minutos
    tags: ['library', 'user'],
    enabled: true,
    compression: true,
    l2Cache: false
  },
  comment: {
    ttl: 300, // 5 minutos
    tags: ['comment'],
    enabled: true,
    compression: true,
    l2Cache: false
  },
  notification: {
    ttl: 180, // 3 minutos
    tags: ['notification', 'user'],
    enabled: true,
    compression: true,
    l2Cache: false
  },
  review: {
    ttl: 1800, // 30 minutos
    tags: ['review', 'manga'],
    enabled: true,
    compression: true,
    l2Cache: false
  },
  playlist: {
    ttl: 900, // 15 minutos
    tags: ['playlist', 'user'],
    enabled: true,
    compression: true,
    l2Cache: false
  }
};

const INVALIDATION_OPERATIONS = {
  create: ['create', 'createMany'],
  update: ['update', 'updateMany', 'upsert'],
  delete: ['delete', 'deleteMany']
};

let cacheStats = {
  hits: 0,
  misses: 0,
  invalidations: 0
};

function generateQueryKey(model: string, operation: string, args: any): string {
  const argsString = JSON.stringify(args, Object.keys(args || {}).sort());
  const hash = crypto.createHash('md5').update(argsString).digest('hex');
  return `prisma:${model}:${operation}:${hash}`;
}

function shouldCache(model: string, operation: string): boolean {
  const config = PRISMA_CACHE_CONFIG[model];
  if (!config || !config.enabled) return false;

  // Só cachear operações de leitura
  const readOperations = ['findFirst', 'findMany', 'findUnique', 'count', 'aggregate', 'groupBy'];
  return readOperations.includes(operation);
}

function shouldInvalidate(model: string, operation: string): boolean {
  const allInvalidationOps = Object.values(INVALIDATION_OPERATIONS).flat();
  return allInvalidationOps.includes(operation);
}

function getInvalidationTags(model: string, operation: string): string[] {
  const config = PRISMA_CACHE_CONFIG[model];
  if (!config) return [];

  const tags = [...config.tags];

  // Adicionar tags específicas baseadas na operação
  if (INVALIDATION_OPERATIONS.create.includes(operation)) {
    tags.push(`${model}:create`);
  } else if (INVALIDATION_OPERATIONS.update.includes(operation)) {
    tags.push(`${model}:update`);
  } else if (INVALIDATION_OPERATIONS.delete.includes(operation)) {
    tags.push(`${model}:delete`);
  }

  return tags;
}

function createExtension() {
  return {
    name: 'cache-extension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const modelName = model.toLowerCase();

          // Verificar se deve invalidar cache
          if (shouldInvalidate(modelName, operation)) {
            const tags = getInvalidationTags(modelName, operation);

            // Executar operação primeiro
            const result = await query(args);

            // Invalidar cache após sucesso
            if (tags.length > 0) {
              setImmediate(async () => {
                try {
                  await advancedCache.invalidateByTags(tags);
                  cacheStats.invalidations++;
                  logger.debug(`Cache invalidado para ${modelName}:${operation}, tags: ${tags.join(', ')}`);
                } catch (error) {
                  logger.error('Erro ao invalidar cache do Prisma:', error);
                }
              });
            }

            return result;
          }

          // Verificar se deve cachear
          if (!shouldCache(modelName, operation)) {
            return query(args);
          }

          const config = PRISMA_CACHE_CONFIG[modelName];
          const cacheKey = generateQueryKey(modelName, operation, args);

          try {
            // Tentar obter do cache
            const cachedResult = await advancedCache.get(cacheKey);

            if (cachedResult !== null) {
              cacheStats.hits++;
              logger.debug(`Prisma cache hit: ${modelName}:${operation}`);
              return cachedResult;
            }

            // Cache miss - executar query
            cacheStats.misses++;
            const result = await query(args);

            // Salvar no cache de forma assíncrona
            setImmediate(async () => {
              try {
                await advancedCache.set(cacheKey, result, {
                  ttl: config.ttl,
                  tags: config.tags,
                  compression: config.compression,
                  l2Cache: config.l2Cache
                });
                logger.debug(`Prisma cache set: ${modelName}:${operation}`);
              } catch (error) {
                logger.error('Erro ao salvar cache do Prisma:', error);
              }
            });

            return result;
          } catch (error) {
            logger.error('Erro no cache do Prisma:', error);
            return query(args);
          }
        }
      }
    }
  };
}

// Obter estatísticas do cache
function getStats() {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total * 100).toFixed(2) : '0.00';

  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    total
  };
}

// Resetar estatísticas
function resetStats() {
  cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0
  };
}

// Invalidar cache específico de um modelo
async function invalidateModel(model: string) {
  const config = PRISMA_CACHE_CONFIG[model];
  if (config && config.tags.length > 0) {
    await advancedCache.invalidateByTags(config.tags);
    logger.info(`Cache invalidado para modelo: ${model}`);
  }
}

// Pré-aquecer cache para queries comuns
async function warmupCommonQueries(prisma: PrismaClient) {
  //logger.info('Iniciando pré-aquecimento do cache do Prisma...');

  try {
    // Pré-aquecer categorias
    await prisma.category.findMany();
    logger.debug('Cache pré-aquecido: categorias');

    // Pré-aquecer mangás mais populares
    await prisma.manga.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        _count: {
          select: {
            chapters: true,
            likes: true,
            comments: true
          }
        }
      }
    });
    logger.debug('Cache pré-aquecido: mangás populares');

    // Pré-aquecer mangás recentes
    await prisma.manga.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true
      }
    });
    logger.debug('Cache pré-aquecido: mangás recentes');

    logger.info('Pré-aquecimento do cache do Prisma concluído');
  } catch (error) {
    logger.error('Erro no pré-aquecimento do cache do Prisma:', error);
  }
}

// Função para criar Prisma client com cache
export function createCachedPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],

    errorFormat: process.env.NODE_ENV === 'production'
      ? 'minimal'
      : 'pretty',

    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
  });

  return prisma.$extends(createExtension()) as PrismaClient;
}

// Funções utilitárias
export const prismaCacheStats = () => getStats();
export const resetPrismaCacheStats = () => resetStats();
export const invalidatePrismaModel = (model: string) => invalidateModel(model);
export const warmupPrismaCache = (prisma: PrismaClient) => warmupCommonQueries(prisma);

// Configurações específicas para diferentes tipos de query
export const QUERY_CACHE_CONFIGS = {
  // Queries de descoberta - cache curto
  discover: {
    ttl: 300, // 5 minutos
    tags: ['discover', 'manga'],
    compression: true,
    l2Cache: false
  },

  // Queries de busca - cache médio
  search: {
    ttl: 600, // 10 minutos
    tags: ['search'],
    compression: true,
    l2Cache: true
  },

  // Queries de estatísticas - cache longo
  analytics: {
    ttl: 3600, // 1 hora
    tags: ['analytics'],
    compression: true,
    l2Cache: true
  },

  // Queries de configuração - cache muito longo
  config: {
    ttl: 86400, // 24 horas
    tags: ['config'],
    compression: false,
    l2Cache: true
  }
};

// Decorator para cachear métodos específicos
export function CacheQuery(config: { ttl: number; tags: string[]; compression?: boolean }) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `method:${target.constructor.name}:${propertyName}:${crypto.createHash('md5').update(JSON.stringify(args)).digest('hex')}`;

      // Tentar obter do cache
      const cached = await advancedCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Executar método original
      const result = await method.apply(this, args);

      // Salvar no cache
      await advancedCache.set(cacheKey, result, {
        ttl: config.ttl,
        tags: config.tags,
        compression: config.compression ?? true
      });

      return result;
    };
  };
}

export { PRISMA_CACHE_CONFIG };