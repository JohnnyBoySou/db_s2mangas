import Redis from 'ioredis';
import { logger } from '@/utils/logger';

const REDIS_URL = process.env.REDIS_URL; 
if (!REDIS_URL) {
  logger.warn('REDIS_URL não configurada; Redis ficará OFF');
}

// Cliente principal (DB 0)
const redisClient = REDIS_URL
  ? new Redis(REDIS_URL, {
      // NÃO force family:4 (rede interna é IPv6-friendly)
      lazyConnect: true,
      connectTimeout: 10_000,
      commandTimeout: 5_000,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      keepAlive: 30_000,
    })
  : null;

// Cliente L1 (DB 1) baseado no mesmo servidor
const redisL1Client = REDIS_URL
  ? new Redis(REDIS_URL, {
      db: 1,
      lazyConnect: true,
      connectTimeout: 10_000,
      retryStrategy: (times) => Math.min(times * 30, 1000),
      maxRetriesPerRequest: 2,
      keepAlive: 15_000,
    })
  : null;

// Eventos
for (const [name, client] of [
  ['Redis', redisClient],
  ['Redis L1', redisL1Client],
]) {
  if (!client) continue;
  (client as any).on('connect', () => logger.info(`✅ ${name} conectado`));
  (client as any).on('error', (e: any) => logger.error(`Erro em ${name}:`, e));
}

// Helpers
export const getRedisClient = () => redisClient;
export const getRedisL1Client = () => redisL1Client;
export const getCacheClient = (layer: 'L1' | 'default' = 'default') =>
  layer === 'L1' ? redisL1Client : redisClient;

export const cacheTTL = {
  // Cache L1 (Redis) - TTLs mais curtos para dados frequentes
  l1: {
    manga: 3600, // 1 hora
    chapter: 1800, // 30 minutos
    user: 900, // 15 minutos
    search: 300, // 5 minutos
    views: 60, // 1 minuto
    likes: 60, // 1 minuto
    comments: 300, // 5 minutos
    categories: 7200, // 2 horas
    languages: 7200, // 2 horas
    discover: 300, // 5 minutos
    analytics: 1800, // 30 minutos
  },
  // Cache L2 (File System) - TTLs mais longos para dados estáveis
  l2: {
    manga: 86400, // 1 dia
    chapter: 43200, // 12 horas
    categories: 86400 * 7, // 7 dias
    languages: 86400 * 7, // 7 dias
    images: 86400 * 30, // 30 dias
    analytics: 86400, // 1 dia
  },
  // Compatibilidade com sistema antigo
  manga: 86400, // 1 dia
  chapter: 1800, // 30 minutos
  user: 1800, // 30 minutos
  search: 300, // 5 minutos
  views: 60, // 1 minuto
  likes: 60, // 1 minuto
  comments: 300, // 5 minutos
  categories: 86400, // 1 dia
  languages: 86400, // 1 dia
  system: {
    stats: 300, // 5 minutos
    logs: 60 // 1 minuto
  }
};