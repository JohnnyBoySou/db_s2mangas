import { Request, Response, NextFunction } from 'express';
import * as advancedCache from '@/utils/advancedCache';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

// Tipos para configuração do cache inteligente
interface SmartCacheConfig {
  ttl?: number;
  tags?: string[];
  varyBy?: string[]; // Parâmetros que afetam o cache
  compression?: boolean;
  l2Cache?: boolean;
  skipIf?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
  invalidateOn?: string[];
}

// Configurações padrão por tipo de endpoint
const DEFAULT_CONFIGS: Record<string, SmartCacheConfig> = {
  manga: {
    ttl: 3600, // 1 hora
    tags: ['manga'],
    varyBy: ['id', 'lg', 'userId'],
    compression: true,
    l2Cache: true,
    invalidateOn: ['manga:update', 'manga:delete']
  },
  discover: {
    ttl: 300, // 5 minutos
    tags: ['discover', 'manga'],
    varyBy: ['page', 'take', 'lg', 'userId'],
    compression: true,
    l2Cache: false
  },
  search: {
    ttl: 600, // 10 minutos
    tags: ['search'],
    varyBy: ['q', 'page', 'limit', 'lg', 'categories'],
    compression: true,
    l2Cache: true
  },
  categories: {
    ttl: 86400, // 24 horas
    tags: ['categories'],
    varyBy: ['lg'],
    compression: false,
    l2Cache: true,
    invalidateOn: ['categories:update']
  },
  user: {
    ttl: 1800, // 30 minutos
    tags: ['user'],
    varyBy: ['id', 'userId'],
    compression: true,
    l2Cache: false,
    invalidateOn: ['user:update', 'user:delete']
  },
  library: {
    ttl: 900, // 15 minutos
    tags: ['library', 'user'],
    varyBy: ['userId', 'page', 'limit', 'status'],
    compression: true,
    l2Cache: false,
    invalidateOn: ['library:update']
  }
};

// Middleware de cache inteligente
export const smartCacheMiddleware = (type: string, customConfig?: Partial<SmartCacheConfig>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Só cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const config = { ...DEFAULT_CONFIGS[type], ...customConfig };
    
    // Verificar se deve pular o cache
    if (config.skipIf && config.skipIf(req)) {
      return next();
    }

    try {
      // Gerar chave de cache
      const cacheKey = generateCacheKey(req, type, config);
      
      // Tentar obter do cache
      const cachedData = await advancedCache.get(cacheKey);
      
      if (cachedData) {
        // Cache hit - adicionar headers de cache
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${config.ttl}`,
          'ETag': generateETag(cachedData)
        });
        
        res.json(cachedData);
        logger.debug(`Cache hit para ${type}: ${cacheKey}`);
        return;
      }

      // Cache miss - interceptar resposta
      const originalJson = res.json;
      res.json = function (body: any) {
        // Salvar no cache de forma assíncrona
        setImmediate(async () => {
          try {
            const cacheOptions = {
              ttl: config.ttl,
              tags: config.tags,
              compression: config.compression,
              l2Cache: config.l2Cache
            };
            
            await advancedCache.set(cacheKey, body, cacheOptions);
            logger.debug(`Cache definido para ${type}: ${cacheKey}`);
          } catch (error) {
            logger.error('Erro ao salvar no cache:', error);
          }
        });
        
        // Adicionar headers de cache
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${config.ttl}`,
          'ETag': generateETag(body)
        });
        
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Erro no middleware de cache inteligente:', error);
      next();
    }
  };
};

// Gerar chave de cache baseada na configuração
function generateCacheKey(req: Request, type: string, config: SmartCacheConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  const keyParts = [type];
  
  // Adicionar parâmetros da URL
  if (req.params && Object.keys(req.params).length > 0) {
    keyParts.push('params', JSON.stringify(req.params));
  }
  
  // Adicionar query parameters específicos
  if (config.varyBy) {
    const varyParams: Record<string, any> = {};
    
    for (const param of config.varyBy) {
      if (param === 'userId') {
        // Obter userId do token decodificado
        varyParams.userId = (req as any).user?.id;
      } else if (req.query[param] !== undefined) {
        varyParams[param] = req.query[param];
      }
    }
    
    if (Object.keys(varyParams).length > 0) {
      keyParts.push('query', JSON.stringify(varyParams, Object.keys(varyParams).sort()));
    }
  }
  
  // Adicionar path da rota
  keyParts.push('path', req.route?.path || req.path);
  
  return keyParts.join(':');
}

// Gerar ETag para resposta
function generateETag(data: any): string {
  const content = JSON.stringify(data);
  return crypto.createHash('md5').update(content).digest('hex');
}

// Middleware para invalidação de cache baseada em ações
export const cacheInvalidationMiddleware = (tags: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Executar a ação primeiro
    const originalJson = res.json;
    res.json = function (body: any) {
      // Invalidar cache após resposta bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            await advancedCache.invalidateByTags(tags);
            logger.info(`Cache invalidado para tags: ${tags.join(', ')}`);
          } catch (error) {
            logger.error('Erro ao invalidar cache:', error);
          }
        });
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Middleware para cache de imagens com diferentes resoluções
export const imageCacheMiddleware = (resolutions: string[] = ['thumbnail', 'medium', 'large']) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resolution = 'medium' } = req.query;
    
    if (!resolutions.includes(resolution as string)) {
      res.status(400).json({ error: 'Resolução não suportada' });
      return 
    }

    const cacheKey = `image:${req.params.id}:${resolution}`;
    
    try {
      // Verificar cache de imagem
      const cachedImage = await advancedCache.get(cacheKey);
      
      if (cachedImage) {
        res.set({
          'Content-Type': cachedImage.contentType,
          'Cache-Control': 'public, max-age=86400', // 24 horas para imagens
          'X-Cache': 'HIT'
        });
        
        res.send(Buffer.from(cachedImage.data, 'base64'));
        return 
      }
      
      // Interceptar resposta de imagem
      const originalSend = res.send;
      res.send = function (data: any) {
        if (res.statusCode === 200 && data instanceof Buffer) {
          // Salvar imagem no cache
          setImmediate(async () => {
            try {
              const imageData = {
                data: data.toString('base64'),
                contentType: res.get('Content-Type') || 'image/jpeg'
              };
              
              await advancedCache.set(cacheKey, imageData, {
                ttl: 86400, // 24 horas
                tags: ['images'],
                compression: false, // Imagens já são comprimidas
                l2Cache: true
              });
            } catch (error) {
              logger.error('Erro ao cachear imagem:', error);
            }
          });
        }
        
        res.set('X-Cache', 'MISS');
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Erro no cache de imagens:', error);
      next();
    }
  };
};

// Middleware para cache condicional (ETag)
export const conditionalCacheMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientETag = req.get('If-None-Match');
    
    if (clientETag) {
      const originalJson = res.json;
      res.json = function (body: any) {
        const serverETag = generateETag(body);
        
        if (clientETag === serverETag) {
          return res.status(304).end();
        }
        
        res.set('ETag', serverETag);
        return originalJson.call(this, body);
      };
    }
    
    next();
  };
};

// Função para pré-aquecer cache
export async function warmupCache(routes?: Array<{ path: string; type: string; params?: any }>) {
  logger.info('Iniciando pré-aquecimento do cache...');
  
  // Rotas padrão para pré-aquecimento se nenhuma for fornecida
  const defaultRoutes = [
    { path: '/discover/recents', type: 'discover' },
    { path: '/discover/views', type: 'discover' },
    { path: '/discover/likes', type: 'discover' },
    { path: '/categories', type: 'categories' },
  ];
  
  const routesToWarm = routes || defaultRoutes;
  
  for (const route of routesToWarm) {
    try {
      // Simular requisição para pré-aquecer
      const mockReq = {
        method: 'GET',
        path: route.path,
        params: {},
        query: {},
        user: null
      } as any;
      
      const cacheKey = generateCacheKey(mockReq, route.type, DEFAULT_CONFIGS[route.type]);
      logger.debug(`Pré-aquecendo cache: ${cacheKey}`);
    } catch (error) {
      logger.error(`Erro ao pré-aquecer ${route.path}:`, error);
    }
  }
  
  logger.info('Pré-aquecimento do cache concluído');
}

// Exportar configurações padrão
export { DEFAULT_CONFIGS };