import Redis from 'ioredis';
import { logger } from '@/utils/logger';

const getRedisUrl = () => {
  const REDIS_URL = process.env.REDIS_URL;

  if (!REDIS_URL) {
    logger.warn('REDIS_URL não configurada; Redis ficará OFF');
  }

  return REDIS_URL;
};

const redisClient = getRedisUrl()
  ? new Redis(getRedisUrl()!, {
    family: 0,
    lazyConnect: true,
    connectTimeout: 10_000,
    commandTimeout: 5_000,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    keepAlive: 30_000,
  })
  : null;

const redisL1Client = getRedisUrl()
  ? new Redis(getRedisUrl()!, {
    db: 1,
    family: 0,
    lazyConnect: true,
    connectTimeout: 10_000,
    retryStrategy: (times) => Math.min(times * 30, 1000),
    maxRetriesPerRequest: 2,
    keepAlive: 15_000,
  })
  : null;

for (const [name, client] of [
  ['Redis', redisClient],
  ['Redis L1', redisL1Client],
]) {
  if (!client) continue;
  (client as any).on('connect', () => logger.info(`✅ ${name} conectado`));
  (client as any).on('error', (e: any) => logger.error(`Erro em ${name}:`, e));
}

export const getRedisClient = () => redisClient;
export const getRedisL1Client = () => redisL1Client;
export const getCacheClient = (layer: 'L1' | 'default' = 'default') =>
  layer === 'L1' ? redisL1Client : redisClient;

export const cacheTTL = {
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
  l2: {
    manga: 86400, // 1 dia
    chapter: 43200, // 12 horas
    categories: 86400 * 7, // 7 dias
    languages: 86400 * 7, // 7 dias
    images: 86400 * 30, // 30 dias
    analytics: 86400, // 1 dia
  },
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