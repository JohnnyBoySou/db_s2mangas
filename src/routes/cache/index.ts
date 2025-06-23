import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { requireAdmin } from '@/middlewares/admin';
import * as cacheController from '@/controllers/cache';

const cacheRouter = Router();

// Todas as rotas de cache requerem autenticação de admin
cacheRouter.use(requireAuth, requireAdmin);

// Estatísticas do cache
cacheRouter.get('/stats', cacheController.getCacheStats);

// Monitoramento em tempo real
cacheRouter.get('/monitoring', cacheController.getCacheMonitoring);

// Gerenciamento de chaves
cacheRouter.get('/keys', cacheController.listCacheKeys);
cacheRouter.get('/keys/:key', cacheController.getCacheKey);
cacheRouter.post('/keys', cacheController.setCacheKey);

// Invalidação de cache
cacheRouter.post('/invalidate/tags', cacheController.clearCacheByTags);
cacheRouter.delete('/prisma/:model', cacheController.clearPrismaModelCache);
cacheRouter.delete('/all', cacheController.clearAllCache);

// Pré-aquecimento
cacheRouter.post('/warmup', cacheController.warmupCache);

// Limpeza de imagens antigas
cacheRouter.post('/cleanup/images', cacheController.cleanupOldImagesCache);

export { cacheRouter };