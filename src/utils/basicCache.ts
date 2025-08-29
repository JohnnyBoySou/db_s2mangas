import { getRedisClient } from "@/config/redis";
import { logger } from "@/utils/logger";
import crypto from "crypto";

// Tipos para o sistema de cache
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

// Configurações do cache
const CACHE_CONFIG = {
  PREFIX: "cache:",
  TAG_PREFIX: "tag:",
};

// Gera chave de cache baseada em parâmetros
export function generateCacheKey(key: string, params?: any): string {
  if (!params) return key;

  const paramString = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash("md5").update(paramString).digest("hex");
  return `${key}:${hash}`;
}

// Método principal para obter cache
export async function get(key: string, params?: any): Promise<any | null> {
  const cacheKey = generateCacheKey(key, params);
  const fullKey = CACHE_CONFIG.PREFIX + cacheKey;

  try {
    const redis = getRedisClient();

    // Se o Redis não estiver disponível, retorna null imediatamente
    if (!redis || redis.status !== "ready") {
      logger.debug(
        `Redis não disponível, ignorando leitura de cache para: ${key}`
      );
      return null;
    }

    // Usar Promise.race com timeout para evitar bloqueios
    const getPromise = redis.get(fullKey);
    const cached = await Promise.race<string | null>([
      getPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)), // Timeout de 1 segundo
    ]);

    if (!cached) return null;

    try {
      const data = JSON.parse(cached);
      logger.debug(`Cache hit: ${key}`);
      return data;
    } catch (error) {
      logger.error("Erro ao obter cache:", error);
      return null;
    }
  } catch (error) {
    logger.error("Erro ao obter cache:", error);
    return null;
  }
}

// Método principal para definir cache
export async function set(
  key: string,
  data: any,
  options: CacheOptions = {},
  params?: any
): Promise<void> {
  const cacheKey = generateCacheKey(key, params);
  const fullKey = CACHE_CONFIG.PREFIX + cacheKey;

  try {
    const redis = getRedisClient();

    // Se o Redis não estiver disponível, não tenta operações
    if (!redis || redis.status !== "ready") {
      logger.debug(`Redis não disponível, ignorando cache para: ${key}`);
      return;
    }

    const { ttl = 3600, tags = [] } = options;

    const stringData = JSON.stringify(data);

    // Usar Promise.race com timeout para evitar bloqueios
    const setPromise = redis.setex(fullKey, ttl, stringData);
    await Promise.race<any>([
      setPromise,
      new Promise<void>((resolve) => setTimeout(() => resolve(), 1000)), // Timeout de 1 segundo
    ]);

    // Associar tags de forma não bloqueante
    for (const tag of tags) {
      try {
        redis.sadd(CACHE_CONFIG.TAG_PREFIX + tag, fullKey).catch(() => {});
        redis.expire(CACHE_CONFIG.TAG_PREFIX + tag, ttl + 3600).catch(() => {});
      } catch (tagError) {
        console.log(tagError);
        // Ignora erros nas tags para não bloquear o fluxo principal
      }
    }

    logger.debug(`Cache definido: ${key}`);
  } catch (error) {
    logger.error("Erro ao definir cache:", error);
    // Não propaga o erro para não interromper o fluxo da aplicação
  }
}

// Invalidar cache por tags
export async function invalidateByTags(tags: string[]): Promise<void> {
  try {
    const redis = getRedisClient();

    if (!redis || redis.status !== "ready") {
      logger.debug("Redis não disponível, ignorando invalidação de cache");
      return;
    }

    await Promise.all(
      tags.map(async (tag) => {
        try {
          const tagKey = CACHE_CONFIG.TAG_PREFIX + tag;
          const keys = await redis.smembers(tagKey);

          if (keys.length > 0) {
            // Deletar todas as chaves associadas à tag
            await redis.del(...keys);
            // Deletar a própria tag
            await redis.del(tagKey);

            logger.info(`Invalidados ${keys.length} caches com tag: ${tag}`);
          }
        } catch (tagError) {
          logger.warn(`Erro ao processar tag ${tag}:`, tagError);
          // Não propaga o erro para não interromper outras tags
        }
      })
    );
  } catch (error) {
    logger.error("Erro ao invalidar por tags:", error);
    // Não propaga o erro para não interromper o fluxo da aplicação
  }
}

// Limpeza de entradas expiradas
export async function cleanupExpiredEntries(): Promise<void> {
  // Redis já gerencia expiração automaticamente
  logger.debug(
    "Redis gerencia expiração automaticamente, não é necessário limpeza manual"
  );
}

// Estatísticas do cache
export async function getStats(): Promise<any> {
  try {
    const redis = getRedisClient();
    const keys = await redis?.keys(CACHE_CONFIG.PREFIX + "*");
    const redisInfo = await redis?.info("memory");

    return {
      entries: keys?.length || 0,
      memoryUsage: redisInfo,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Erro ao obter estatísticas do cache:", error);
    return null;
  }
}

// Limpar todo o cache
export async function flushAll(): Promise<void> {
  try {
    const redis = getRedisClient();

    if (!redis || redis.status !== "ready") {
      logger.debug("Redis não disponível, ignorando limpeza de cache");
      return;
    }

    // Obter todas as chaves de cache
    const cacheKeys = await redis.keys(CACHE_CONFIG.PREFIX + "*");
    const tagKeys = await redis.keys(CACHE_CONFIG.TAG_PREFIX + "*");

    // Deletar todas as chaves em lote
    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
      logger.info(`Deletadas ${cacheKeys.length} entradas de cache`);
    }

    if (tagKeys.length > 0) {
      await redis.del(...tagKeys);
      logger.info(`Deletadas ${tagKeys.length} tags de cache`);
    }

    logger.info("Cache completamente limpo");
  } catch (error) {
    logger.error("Erro ao limpar cache:", error);
  }
}

// Funções de conveniência (aliases)
export const cacheGet = get;
export const cacheSet = set;
export const cacheInvalidateByTags = invalidateByTags;
export const cacheStats = getStats;

export function invalidateCache(tags: string[]): Promise<void> {
  return invalidateByTags(tags);
}
