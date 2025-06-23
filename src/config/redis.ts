import Redis from 'ioredis';
import { logger } from '@/utils/logger';

// Configuração avançada do Redis para cache em múltiplas camadas
const redisClient = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0, // Database principal
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  // Pool de conexões
  family: 4,
  connectTimeout: 10000,
  commandTimeout: 5000
});

// Cliente Redis separado para cache L1 (alta performance)
const redisL1Client = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 1, // Database separada para L1
  retryStrategy: (times) => {
    const delay = Math.min(times * 30, 1000);
    return delay;
  },
  maxRetriesPerRequest: 2,
  lazyConnect: true,
  keepAlive: 15000
});

redisClient.on('connect', () => {
  console.log('✅ Redis conectado com sucesso')
  //logger.info('✅ Redis conectado com sucesso');
});

redisClient.on('error', (error) => {
  logger.error('Erro na conexão com Redis:', error);
});

// Eventos de conexão para ambos os clientes
redisL1Client.on('connect', () => {
  logger.info('✅ Redis L1 conectado com sucesso');
});

redisL1Client.on('error', (error) => {
  logger.error('Erro na conexão com Redis L1:', error);
});

// Funções para obter clientes
export const getRedisClient = () => redisClient;
export const getRedisL1Client = () => redisL1Client;

// Função para obter cliente baseado no tipo de cache
export const getCacheClient = (layer: 'L1' | 'default' = 'default') => {
  return layer === 'L1' ? redisL1Client : redisClient;
};

export const cacheKey = {
  manga: (id: string) => `manga:${id}`,
  chapter: (id: string) => `chapter:${id}`,
  user: (id: string) => `user:${id}`,
  search: (query: string) => `search:${query}`,
  views: (mangaId: string) => `views:${mangaId}`,
  likes: (mangaId: string) => `likes:${mangaId}`,
  comments: (mangaId: string) => `comments:${mangaId}`,
  categories: () => 'categories',
  languages: () => 'languages',
  system: {
    stats: () => 'system:stats',
    logs: () => 'system:logs'
  }
};

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