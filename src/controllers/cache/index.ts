import { Request, Response } from 'express';
import * as advancedCache from '@/utils/advancedCache';
import { prismaCacheStats, resetPrismaCacheStats, invalidatePrismaModel } from '@/utils/prismaCache';
import { getImageCacheStats, cleanupOldImages, preprocessDirectory } from '@/utils/imageCache';
import { getRedisClient, getRedisL1Client } from '@/config/redis';
import { logger } from '@/utils/logger';
import { handleZodError } from '@/utils/zodError';
import path from 'path';

// Obter estatísticas gerais do cache
export const getCacheStats = async (req: Request, res: Response) => {
  try {
    const [generalStats, prismaStats, imageStats] = await Promise.all([
      advancedCache.getStats(),
      prismaCacheStats(),
      getImageCacheStats()
    ]);

    const redis = getRedisClient();
    const redisL1 = getRedisL1Client();
    
    const [redisInfo, redisL1Info] = await Promise.all([
      redis.info('memory'),
      redisL1.info('memory')
    ]);

    const stats = {
      general: generalStats,
      prisma: prismaStats,
      images: imageStats,
      redis: {
        main: parseRedisInfo(redisInfo),
        l1: parseRedisInfo(redisL1Info)
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas do cache:', error);
    handleZodError(error, res);
  }
};

// Limpar cache por tags
export const clearCacheByTags = async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;
    
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tags devem ser fornecidas como array não vazio'
      });
    }

    await advancedCache.invalidateByTags(tags);
    
    logger.info(`Cache invalidado para tags: ${tags.join(', ')}`);
    
    res.json({
      success: true,
      message: `Cache invalidado para ${tags.length} tag(s)`,
      tags
    });
  } catch (error) {
    logger.error('Erro ao limpar cache por tags:', error);
    handleZodError(error, res);
  }
};

// Limpar cache de um modelo específico do Prisma
export const clearPrismaModelCache = async (req: Request, res: Response) => {
  try {
    const { model } = req.params;
    
    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Modelo deve ser especificado'
      });
    }

    await invalidatePrismaModel(model);
    
    logger.info(`Cache do modelo Prisma invalidado: ${model}`);
    
    res.json({
      success: true,
      message: `Cache do modelo ${model} invalidado`,
      model
    });
  } catch (error) {
    logger.error('Erro ao limpar cache do modelo Prisma:', error);
    handleZodError(error, res);
  }
};

// Limpar todo o cache
export const clearAllCache = async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const redisL1 = getRedisL1Client();
    
    // Limpar ambos os bancos Redis
    await Promise.all([
      redis.flushdb(),
      redisL1.flushdb()
    ]);
    
    // Resetar estatísticas do Prisma
    resetPrismaCacheStats();
    
    logger.warn('Todo o cache foi limpo');
    
    res.json({
      success: true,
      message: 'Todo o cache foi limpo com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao limpar todo o cache:', error);
    handleZodError(error, res);
  }
};

// Pré-aquecer cache
export const warmupCache = async (req: Request, res: Response) => {
  try {
    const { type = 'all' } = req.body;
    
    const warmupTasks = [];
    
    if (type === 'all' || type === 'images') {
      // Pré-aquecer cache de imagens
      const uploadsDir = path.join(process.cwd(), 'uploads');
      warmupTasks.push(
        preprocessDirectory(uploadsDir, 'manga_cover')
          .catch(error => logger.error('Erro no pré-aquecimento de imagens:', error))
      );
    }
    
    if (type === 'all' || type === 'prisma') {
      // Pré-aquecer cache do Prisma seria feito aqui
      // warmupTasks.push(warmupPrismaCache(prisma));
    }
    
    await Promise.allSettled(warmupTasks);
    
    logger.info(`Pré-aquecimento do cache concluído: ${type}`);
    
    res.json({
      success: true,
      message: `Pré-aquecimento do cache ${type} iniciado`,
      type
    });
  } catch (error) {
    logger.error('Erro no pré-aquecimento do cache:', error);
    handleZodError(error, res);
  }
};

// Limpar imagens antigas
export const cleanupOldImagesCache = async (req: Request, res: Response) => {
  try {
    const { maxAge = 86400 * 30 } = req.body; // 30 dias por padrão
    
    await cleanupOldImages(maxAge);
    
    logger.info(`Limpeza de imagens antigas concluída (maxAge: ${maxAge}s)`);
    
    res.json({
      success: true,
      message: 'Limpeza de imagens antigas concluída',
      maxAge
    });
  } catch (error) {
    logger.error('Erro na limpeza de imagens antigas:', error);
    handleZodError(error, res);
  }
};

// Obter informações de uma chave específica
export const getCacheKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { layer = 'default' } = req.query;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Chave deve ser especificada'
      });
    }

    const redis = layer === 'L1' ? getRedisL1Client() : getRedisClient();
    
    const [value, ttl, type] = await Promise.all([
      redis.get(key),
      redis.ttl(key),
      redis.type(key)
    ]);
    
    if (!value) {
      return res.status(404).json({
        success: false,
        error: 'Chave não encontrada'
      });
    }
    
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    
    res.json({
      success: true,
      data: {
        key,
        value: parsedValue,
        ttl,
        type,
        layer,
        size: Buffer.byteLength(value, 'utf8')
      }
    });
  } catch (error) {
    logger.error('Erro ao obter chave do cache:', error);
    handleZodError(error, res);
  }
};

// Definir uma chave no cache
export const setCacheKey = async (req: Request, res: Response) => {
  try {
    const { key, value, ttl = 3600, tags = [] } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Chave e valor são obrigatórios'
      });
    }

    await advancedCache.set(key, value, {
      ttl,
      tags,
      compression: true,
      l2Cache: false
    });
    
    logger.info(`Chave definida no cache: ${key}`);
    
    res.json({
      success: true,
      message: 'Chave definida com sucesso',
      key,
      ttl,
      tags
    });
  } catch (error) {
    logger.error('Erro ao definir chave no cache:', error);
    handleZodError(error, res);
  }
};

// Listar chaves do cache
export const listCacheKeys = async (req: Request, res: Response) => {
  try {
    const { pattern = '*', layer = 'default', limit = 100 } = req.query;
    
    const redis = layer === 'L1' ? getRedisL1Client() : getRedisClient();
    
    const keys = await redis.keys(pattern as string);
    const limitedKeys = keys.slice(0, Number(limit));
    
    const keyInfoPromises = limitedKeys.map(async (key) => {
      const [ttl, type, size] = await Promise.all([
        redis.ttl(key),
        redis.type(key),
        redis.memory('USAGE', key).catch(() => 0)
      ]);
      
      return {
        key,
        ttl,
        type,
        size
      };
    });
    
    const keyInfos = await Promise.all(keyInfoPromises);
    
    res.json({
      success: true,
      data: {
        keys: keyInfos,
        total: keys.length,
        showing: limitedKeys.length,
        pattern,
        layer
      }
    });
  } catch (error) {
    logger.error('Erro ao listar chaves do cache:', error);
    handleZodError(error, res);
  }
};

// Função auxiliar para parsear informações do Redis
function parseRedisInfo(info: string): Record<string, any> {
  const parsed: Record<string, any> = {};
  
  info.split('\r\n').forEach(line => {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      parsed[key] = isNaN(Number(value)) ? value : Number(value);
    }
  });
  
  return parsed;
}

// Monitoramento em tempo real do cache
export const getCacheMonitoring = async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const redisL1 = getRedisL1Client();
    
    const [mainInfo, l1Info] = await Promise.all([
      redis.info('stats'),
      redisL1.info('stats')
    ]);
    
    const monitoring = {
      main: parseRedisInfo(mainInfo),
      l1: parseRedisInfo(l1Info),
      prisma: prismaCacheStats(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: monitoring
    });
  } catch (error) {
    logger.error('Erro no monitoramento do cache:', error);
    handleZodError(error, res);
  }
};