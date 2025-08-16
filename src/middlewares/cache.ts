import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/utils/logger';

export const cacheMiddleware = (ttl: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      return next();
    }

    const redis = getRedisClient();
    const key = `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await redis?.get(key);

      if (cachedResponse) {
        const data = JSON.parse(cachedResponse);
        res.json(data);
        return;
      }

      // Intercepta a resposta original
      const originalJson = res.json;
      res.json = function (body: any) {
        redis?.setex(key, ttl, JSON.stringify(body))
          .catch(error => logger.error('Erro ao salvar cache:', error));
        
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Erro no middleware de cache:', error);
      next();
    }
  };
}; 