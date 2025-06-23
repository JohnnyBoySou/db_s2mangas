import { getRedisClient } from '@/config/redis';
import { logger } from './logger';

/**
 * Limpa chaves de cache antigas do Redis
 * Remove chaves que seguem padrões específicos e são mais antigas que o TTL especificado
 */
export async function cleanRedisCache() {
  try {
    const redis = getRedisClient();
    
    // Busca todas as chaves de cache
    const cacheKeys = await redis.keys('cache:*');
    const adminKeys = await redis.keys('admin:*');
    
    let deletedCount = 0;
    
    // Remove chaves de cache antigas (mais de 24 horas)
    for (const key of cacheKeys) {
      const ttl = await redis.ttl(key);
      // Se TTL é -1 (sem expiração) ou muito baixo, remove
      if (ttl === -1 || ttl < 3600) { // menos de 1 hora
        await redis.del(key);
        deletedCount++;
      }
    }
    
    // Remove chaves de admin cache antigas (mais de 2 horas)
    for (const key of adminKeys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1 || ttl < 1800) { // menos de 30 minutos
        await redis.del(key);
        deletedCount++;
      }
    }
    
    logger.info(`Limpeza de cache Redis concluída. ${deletedCount} chaves removidas.`);
  } catch (error) {
    logger.error('Erro ao limpar cache Redis:', error);
  }
}

/**
 * Limpa todo o cache Redis (usar com cuidado)
 */
export async function flushRedisCache() {
  try {
    const redis = getRedisClient();
    await redis.flushdb();
    logger.info('Cache Redis completamente limpo.');
  } catch (error) {
    logger.error('Erro ao limpar completamente o cache Redis:', error);
  }
}