import Redis from "ioredis";
import { logger } from "@/utils/logger";

const getRedisConfig = () => {
  const REDIS_URL = process.env.REDIS_URL;

  if (!REDIS_URL) {
    return null;
  }

  const baseConfig = {
    family: 0,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000,
    enableOfflineQueue: true, // Habilita fila offline para melhor resiliência
    enableReadyCheck: true,
    retryStrategy: (times: number) => {
      // Estratégia de reconexão exponencial com limite máximo
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    maxRetriesPerRequest: 3, // Permite algumas tentativas de retry
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        // Apenas reconecta em erros específicos
        return true;
      }
      return false;
    },
  };

  return {
    url: REDIS_URL,
    config: baseConfig,
  };
};

const createRedisClient = (db: number = 0) => {
  const redisConfig = getRedisConfig();
  if (!redisConfig) return null;

  return new Redis(redisConfig.url, {
    ...redisConfig.config,
    db,
  });
};

const redisClient = createRedisClient(0);
const redisL1Client = createRedisClient(1);

// Variável para controlar se já tentamos conectar
let connectionAttempted = false;

const setupRedisEvents = (client: Redis | null, name: string) => {
  if (!client) return;

  client.on("connect", () => logger.info(`✅ ${name} conectado`));
  client.on("ready", () => logger.info(`✅ ${name} pronto para uso`));
  client.on("close", () => {
    // Só loga desconexão se ainda não tentamos conectar ou se foi bem-sucedido antes
    if (!connectionAttempted) {
      logger.warn(`🔌 ${name} desconectado`);
    }
  });
  client.on("end", () => {
    if (!connectionAttempted) {
      logger.warn(`🔚 ${name} conexão finalizada`);
    }
  });
  client.on("error", (error: any) => {
    // Ignora erros de conexão comuns
    const ignoreErrors = [
      "ETIMEDOUT",
      "ECONNREFUSED",
      "Command timed out",
      "Connection is closed",
      "Reached the max retries per request limit",
    ];

    const shouldIgnore = ignoreErrors.some(
      (err) => error.code === err || error.message.includes(err)
    );

    if (!shouldIgnore) {
      logger.error(`❌ Erro em ${name}:`, error.message);
    }
  });
};

// Configurar eventos para ambos os clientes
setupRedisEvents(redisClient, "Redis Principal");
setupRedisEvents(redisL1Client, "Redis L1");

/**
 * Inicializa as conexões do Redis de forma simplificada
 */
export const initRedis = async (): Promise<boolean> => {
  try {
    const redisConfig = getRedisConfig();
    if (!process.env.REDIS_URL) return false;
    if (!redisConfig) {
      return true;
    }

    connectionAttempted = true;

    const clients = [
      { client: redisClient, name: "Redis Principal" },
      { client: redisL1Client, name: "Redis L1" },
    ].filter(({ client }) => client !== null);

    // Configurar evento de reconexão automática para ambos os clientes
    clients.forEach(({ client, name }) => {
      if (client) {
        // Adicionar evento para tentar reconectar automaticamente quando a conexão for fechada
        client.on("close", async () => {
          logger.warn(`🔌 ${name} desconectado, tentando reconectar...`);
          try {
            if (client.status !== "ready" && client.status !== "connecting") {
              await client.connect();
              logger.info(`✅ ${name} reconectado com sucesso`);
            }
          } catch (reconnectError) {
            logger.error(`❌ Falha ao reconectar ${name}:`, reconnectError);
          }
        });
      }
    });

    const connectionPromises = clients.map(async ({ client, name }) => {
      try {
        // Verifica se o cliente já está conectado
        if (client!.status === "ready") {
          logger.info(`✅ ${name} já está conectado`);
          return true;
        }

        // Tenta conectar com timeout
        const connectWithTimeout = async () => {
          return new Promise<boolean>((resolve, reject) => {
            const timeout = setTimeout(() => {
              logger.warn(`⚠️ Timeout ao conectar ${name}`);
              resolve(false);
            }, 5000);

            client!
              .connect()
              .then(() => {
                clearTimeout(timeout);
                logger.info(`✅ ${name} conectado com sucesso`);
                resolve(true);
              })
              .catch((error: any) => {
                clearTimeout(timeout);
                reject(error);
              });
          });
        };

        return await connectWithTimeout();
      } catch (error: any) {
        if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
          logger.warn(`⚠️ ${name} não disponível (${error.code})`);
        } else {
          logger.error(`❌ Erro ao conectar ${name}:`, error.message);
        }

        try {
          if (client!.status !== "end") {
            await client!.disconnect();
          }
        } catch (disconnectError) {
          console.log(disconnectError);
        }

        return false;
      }
    });

    // Usa Promise.allSettled para garantir que todas as promessas sejam resolvidas
    const results = await Promise.allSettled(connectionPromises);
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;

    if (successCount > 0) {
      logger.info(
        `🎉 ${successCount}/${clients.length} conexões Redis estabelecidas`
      );
      return true;
    } else {
      logger.warn(
        "⚠️ Nenhuma conexão Redis estabelecida - aplicação funcionará sem cache"
      );

      clients.forEach(async ({ client }) => {
        try {
          if (client!.status !== "end") {
            await client!.disconnect();
          }
        } catch (error) {
          console.log(error);
          // Ignora erros de desconexão
        }
      });

      return false;
    }
  } catch (error) {
    logger.error("❌ Erro durante a inicialização do Redis:", error);
    return false;
  }
};

/**
 * Fecha as conexões do Redis
 */
export const closeRedis = async (): Promise<void> => {
  try {
    logger.info("🔄 Fechando conexões do Redis...");

    const clients = [redisClient, redisL1Client].filter(Boolean);

    if (clients.length === 0) {
      logger.info("ℹ️ Nenhuma conexão Redis para fechar");
      return;
    }

    await Promise.all(
      clients.map(async (client) => {
        try {
          await client!.quit();
          logger.info("✅ Conexão Redis fechada");
        } catch (error) {
          logger.error("❌ Erro ao fechar conexão Redis:", error);
        }
      })
    );

    logger.info("🎉 Todas as conexões do Redis foram fechadas");
  } catch (error) {
    logger.error("❌ Erro ao fechar conexões do Redis:", error);
  }
};

// Exportar clientes
export const getRedisClient = () => redisClient;
export const getRedisL1Client = () => redisL1Client;
export const getCacheClient = (layer: "L1" | "default" = "default") =>
  layer === "L1" ? redisL1Client : redisClient;

/**
 * Verifica se o Redis está conectado e disponível
 */
export const isRedisAvailable = (client?: Redis | null): boolean => {
  const targetClient = client || redisClient;
  return targetClient ? targetClient.status === "ready" : false;
};

/**
 * Verifica se o Redis L1 está conectado e disponível
 */
export const isRedisL1Available = (): boolean => {
  return redisL1Client ? redisL1Client.status === "ready" : false;
};

/**
 * Verifica se o Redis está configurado (mesmo que não conectado)
 */
export const isRedisConfigured = (): boolean => {
  return !!process.env.REDIS_URL;
};

/**
 * Função segura para operações Redis que verifica disponibilidade primeiro
 */
export const safeRedisOperationWithCheck = async <T>(
  operation: () => Promise<T>,
  fallback?: T,
  client?: Redis | null
): Promise<T | null> => {
  const targetClient = client || redisClient;

  // Se não há Redis configurado, retorna fallback
  if (!isRedisConfigured()) {
    return fallback || null;
  }

  // Se o cliente não está pronto, retorna fallback
  if (!isRedisAvailable(targetClient)) {
    return fallback || null;
  }

  // Tenta executar a operação
  return await safeRedisOperation(operation, fallback);
};

/**
 * Executa uma operação Redis de forma segura
 */
export const safeRedisOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error: any) {
    // Verifica se é um erro de conexão ou stream não disponível
    const isConnectionError =
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNREFUSED" ||
      error.message === "Command timed out" ||
      error.message.includes("Stream isn't writeable") ||
      error.message.includes("enableOfflineQueue options is false") ||
      error.message.includes("Connection is closed") ||
      error.message.includes("Reached the max retries per request limit");

    if (isConnectionError) {
      // Tenta reconectar o cliente Redis se a conexão estiver fechada
      if (error.message.includes("Connection is closed")) {
        logger.warn("⚠️ Conexão Redis fechada, tentando reconectar...");
        try {
          // Verifica qual cliente está com problema
          if (redisClient && redisClient.status !== "ready") {
            await redisClient.connect();
          }
          if (redisL1Client && redisL1Client.status !== "ready") {
            await redisL1Client.connect();
          }

          // Tenta executar a operação novamente após reconexão
          return await operation();
        } catch (reconnectError) {
          logger.error("❌ Falha ao reconectar ao Redis:", reconnectError);
        }
      } else {
        logger.warn(`⚠️ Erro de conexão Redis: ${error.message}`);
      }
    } else {
      logger.warn("⚠️ Operação Redis falhou:", error.message);
    }
    return fallback || null;
  }
};

// Configurações de TTL do cache
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
    logs: 60, // 1 minuto
  },
};
