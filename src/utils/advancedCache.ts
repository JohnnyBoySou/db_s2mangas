import { getRedisClient } from '@/config/redis';
import { logger } from '@/utils/logger';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Tipos para o sistema de cache
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compression?: boolean;
  l2Cache?: boolean;
  invalidateOn?: string[];
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  compressed: boolean;
}

interface L2CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
}

// Configurações do cache
const CACHE_CONFIG = {
  L1_PREFIX: 'l1:',
  L2_PREFIX: 'l2:',
  TAG_PREFIX: 'tag:',
  L2_DIR: path.join(process.cwd(), 'cache', 'l2'),
  COMPRESSION_THRESHOLD: 1024, // 1KB
  MAX_L2_SIZE: 100 * 1024 * 1024, // 100MB
  CLEANUP_INTERVAL: 3600000, // 1 hora
};

// Estado global para o cache L2
let l2CacheSize = 0;
let cleanupSchedulerStarted = false;
let cleanupTimer: NodeJS.Timeout | null = null;

// Inicialização do cache L2
export async function initializeL2Cache(): Promise<void> {
  try {
    await fs.mkdir(CACHE_CONFIG.L2_DIR, { recursive: true });
    await calculateL2CacheSize();
  } catch (error) {
    logger.error('Erro ao inicializar cache L2:', error);
  }
}

// Calcular tamanho do cache L2
export async function calculateL2CacheSize(): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_CONFIG.L2_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(CACHE_CONFIG.L2_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
    
    l2CacheSize = totalSize;
  } catch (error) {
    logger.error('Erro ao calcular tamanho do cache L2:', error);
  }
}

// Iniciar agendador de limpeza
export function startCleanupScheduler(): void {
  if (cleanupSchedulerStarted) return;
  
  cleanupTimer = setInterval(() => {
    cleanupExpiredEntries();
    cleanupL2Cache();
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
  
  cleanupSchedulerStarted = true;
}

// Parar agendador de limpeza
export function stopCleanupScheduler(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    cleanupSchedulerStarted = false;
  }
}

// Gera chave de cache baseada em parâmetros
export function generateCacheKey(key: string, params?: any): string {
  if (!params) return key;
  
  const paramString = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('md5').update(paramString).digest('hex');
  return `${key}:${hash}`;
}

// Comprime dados se necessário
export async function compressData(data: any): Promise<{ data: string; compressed: boolean }> {
  const jsonString = JSON.stringify(data);
  
  if (jsonString.length < CACHE_CONFIG.COMPRESSION_THRESHOLD) {
    return { data: jsonString, compressed: false };
  }

  try {
    const zlib = await import('zlib');
    const compressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gzip(jsonString, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    return { data: compressed.toString('base64'), compressed: true };
  } catch (error) {
    logger.warn('Erro na compressão, usando dados não comprimidos:', error);
    return { data: jsonString, compressed: false };
  }
}

// Descomprime dados se necessário
export async function decompressData(data: string, compressed: boolean): Promise<any> {
  if (!compressed) {
    return JSON.parse(data);
  }

  try {
    const zlib = await import('zlib');
    const buffer = Buffer.from(data, 'base64');
    const decompressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gunzip(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    return JSON.parse(decompressed.toString());
  } catch (error) {
    logger.error('Erro na descompressão:', error);
    throw error;
  }
}

// Cache L1 (Redis)
export async function setL1Cache(key: string, data: any, options: CacheOptions = {}): Promise<void> {
  try {
    const redis = getRedisClient();
    const { ttl = 3600, tags = [], compression = true } = options;
    const fullKey = CACHE_CONFIG.L1_PREFIX + key;
    
    const { data: processedData, compressed } = compression 
      ? await compressData(data)
      : { data: JSON.stringify(data), compressed: false };

    const cacheEntry: CacheEntry = {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      tags,
      compressed
    };

    await redis?.setex(fullKey, ttl, JSON.stringify(cacheEntry));

    // Associar tags
    for (const tag of tags) {
      await redis?.sadd(CACHE_CONFIG.TAG_PREFIX + tag, fullKey);
      await redis?.expire(CACHE_CONFIG.TAG_PREFIX + tag, ttl + 3600);
    }

    logger.debug(`Cache L1 definido: ${key}`);
  } catch (error) {
    logger.error('Erro ao definir cache L1:', error);
  }
}

export async function getL1Cache(key: string): Promise<any | null> {
  try {
    const redis = getRedisClient();
    const fullKey = CACHE_CONFIG.L1_PREFIX + key;
    const cached = await redis?.get(fullKey);
    
    if (!cached) return null;

    const cacheEntry: CacheEntry = JSON.parse(cached);
    
    // Verificar se expirou
    if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl * 1000) {
      await redis?.del(fullKey);
      return null;
    }

    const data = await decompressData(cacheEntry.data, cacheEntry.compressed);
    logger.debug(`Cache L1 hit: ${key}`);
    return data;
  } catch (error) {
    logger.error('Erro ao obter cache L1:', error);
    return null;
  }
}

// Cache L2 (Sistema de arquivos)
export async function setL2Cache(key: string, data: any, etag?: string): Promise<void> {
  try {
    const fileName = crypto.createHash('md5').update(key).digest('hex') + '.json';
    const filePath = path.join(CACHE_CONFIG.L2_DIR, fileName);
    
    const l2Entry: L2CacheEntry = {
      data,
      timestamp: Date.now(),
      etag: etag || crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
    };

    const content = JSON.stringify(l2Entry);
    await fs.writeFile(filePath, content);
    
    l2CacheSize += Buffer.byteLength(content);
    logger.debug(`Cache L2 definido: ${key}`);
  } catch (error) {
    logger.error('Erro ao definir cache L2:', error);
  }
}

export async function getL2Cache(key: string): Promise<{ data: any; etag: string } | null> {
  try {
    const fileName = crypto.createHash('md5').update(key).digest('hex') + '.json';
    const filePath = path.join(CACHE_CONFIG.L2_DIR, fileName);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const l2Entry: L2CacheEntry = JSON.parse(content);
    
    logger.debug(`Cache L2 hit: ${key}`);
    return { data: l2Entry.data, etag: l2Entry.etag };
  } catch (error) {
    if ((error as any).code !== 'ENOENT') {
      logger.error('Erro ao obter cache L2:', error);
    }
    return null;
  }
}

// Método principal para obter cache (L1 -> L2)
export async function get(key: string, params?: any): Promise<any | null> {
  const cacheKey = generateCacheKey(key, params);
  
  // Tentar L1 primeiro
  const data = await getL1Cache(cacheKey);
  if (data) return data;

  // Tentar L2
  const l2Result = await getL2Cache(cacheKey);
  if (l2Result) {
    // Promover para L1
    await setL1Cache(cacheKey, l2Result.data, { ttl: 1800 });
    return l2Result.data;
  }

  return null;
}

// Método principal para definir cache (L1 + L2 opcional)
export async function set(key: string, data: any, options: CacheOptions = {}, params?: any): Promise<void> {
  const cacheKey = generateCacheKey(key, params);
  
  // Sempre definir em L1
  await setL1Cache(cacheKey, data, options);
  
  // Definir em L2 se solicitado
  if (options.l2Cache) {
    await setL2Cache(cacheKey, data);
  }
}

// Invalidação por tags
export async function invalidateByTags(tags: string[]): Promise<void> {
  try {
    const redis = getRedisClient();
    for (const tag of tags) {
      const tagKey = CACHE_CONFIG.TAG_PREFIX + tag;
      const keys = await redis?.smembers(tagKey);
      
      if (keys && keys.length > 0) {
        await redis?.del(...keys);
        await redis?.del(tagKey);
        logger.info(`Invalidados ${keys.length} caches com tag: ${tag}`);
      }
    }
  } catch (error) {
    logger.error('Erro ao invalidar por tags:', error);
  }
}

// Limpeza de entradas expiradas
export async function cleanupExpiredEntries(): Promise<void> {
  try {
    const redis = getRedisClient();
    const pattern = CACHE_CONFIG.L1_PREFIX + '*';
    const keys = await redis?.keys(pattern);
    let cleanedCount = 0;

    for (const key of keys || []) {
      const cached = await redis?.get(key);
      if (!cached) continue;

      try {
        const cacheEntry: CacheEntry = JSON.parse(cached);
        if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl * 1000) {
          await redis?.del(key);
          cleanedCount++;
        }
      } catch (error) {
        console.log(error)
        // Entrada corrompida, remover
        await redis?.del(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Limpeza L1: ${cleanedCount} entradas removidas`);
    }
  } catch (error) {
    logger.error('Erro na limpeza de cache L1:', error);
  }
}

// Limpeza do cache L2
export async function cleanupL2Cache(): Promise<void> {
  try {
    if (l2CacheSize < CACHE_CONFIG.MAX_L2_SIZE) return;

    const files = await fs.readdir(CACHE_CONFIG.L2_DIR);
    const fileStats = [];

    for (const file of files) {
      const filePath = path.join(CACHE_CONFIG.L2_DIR, file);
      const stats = await fs.stat(filePath);
      fileStats.push({ file, path: filePath, mtime: stats.mtime, size: stats.size });
    }

    // Ordenar por data de modificação (mais antigos primeiro)
    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    let removedSize = 0;
    let removedCount = 0;
    const targetSize = CACHE_CONFIG.MAX_L2_SIZE * 0.8; // Reduzir para 80% do limite

    for (const fileInfo of fileStats) {
      if (l2CacheSize - removedSize <= targetSize) break;
      
      await fs.unlink(fileInfo.path);
      removedSize += fileInfo.size;
      removedCount++;
    }

    l2CacheSize -= removedSize;
    
    if (removedCount > 0) {
      logger.info(`Limpeza L2: ${removedCount} arquivos removidos (${removedSize} bytes)`);
    }
  } catch (error) {
    logger.error('Erro na limpeza de cache L2:', error);
  }
}

// Estatísticas do cache
export async function getStats(): Promise<any> {
  try {
    const redis = getRedisClient();
    const l1Keys = await redis?.keys(CACHE_CONFIG.L1_PREFIX + '*');
    const l2Files = await fs.readdir(CACHE_CONFIG.L2_DIR);
    const redisInfo = await redis?.info('memory');
    
    return {
      l1: {
        entries: l1Keys?.length || 0,
        memoryUsage: redisInfo
      },
      l2: {
        entries: l2Files.length,
        diskUsage: l2CacheSize
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Erro ao obter estatísticas do cache:', error);
    return null;
  }
}

// Inicialização automática
(async () => {
  await initializeL2Cache();
  startCleanupScheduler();
})();

// Funções de conveniência (aliases)
export const cacheGet = get;
export const cacheSet = set;
export const cacheInvalidateByTags = invalidateByTags;
export const cacheStats = getStats;