import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger";
import crypto from "crypto";
import * as basicCache from "@/utils/basicCache";

// Tipos para configuração do cache
interface CacheConfig {
  ttl: number;
  tags?: string[];
  varyBy?: string[];
}

// Configurações padrão por tipo de endpoint
export const DEFAULT_CACHE_CONFIGS: Record<string, CacheConfig> = {
  manga: {
    ttl: 3600, // 1 hora
    tags: ["manga"],
    varyBy: ["id", "lg", "userId"],
  },
  discover: {
    ttl: 300, // 5 minutos
    tags: ["discover", "manga"],
    varyBy: ["page", "take", "lg", "userId"],
  },
  search: {
    ttl: 600, // 10 minutos
    tags: ["search"],
    varyBy: ["q", "page", "limit", "lg", "categories"],
  },
  categories: {
    ttl: 86400, // 24 horas
    tags: ["categories"],
    varyBy: ["lg"],
  },
  user: {
    ttl: 1800, // 30 minutos
    tags: ["user"],
    varyBy: ["id", "userId"],
  },
  library: {
    ttl: 900, // 15 minutos
    tags: ["library", "user"],
    varyBy: ["userId", "page", "limit", "status"],
  },
};

/**
 * Middleware de cache aprimorado
 * @param type Tipo de endpoint ou TTL numérico
 * @param customConfig Configuração personalizada opcional
 */
export const cacheMiddleware = (
  type: string | number,
  customConfig?: Partial<CacheConfig>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Só cachear GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Determinar configuração baseada no tipo ou usar TTL direto
    let config: CacheConfig;
    if (typeof type === "number") {
      config = { ttl: type, ...customConfig };
    } else {
      const defaultConfig = DEFAULT_CACHE_CONFIGS[type] || { ttl: 300 };
      config = { ...defaultConfig, ...customConfig };
    }

    try {
      // Gerar chave de cache
      const cacheKey = generateCacheKey(
        req,
        typeof type === "string" ? type : "custom",
        config
      );

      // Tentar obter do cache com timeout para evitar bloqueios
      let cachedResponse = null;
      try {
        cachedResponse = await basicCache.get(cacheKey);
      } catch (cacheError) {
        logger.warn(`Erro ao obter cache: ${cacheKey}`, cacheError);
      }

      if (cachedResponse) {
        // Adicionar headers de cache
        res.set({
          "X-Cache": "HIT",
          "X-Cache-Key": cacheKey,
          "Cache-Control": `public, max-age=${config.ttl}`,
          ETag: generateETag(cachedResponse),
        });

        res.json(cachedResponse);
        logger.debug(`Cache hit: ${cacheKey}`);
        return;
      }

      // Cache miss - interceptar resposta
      const originalJson = res.json;
      res.json = function (body: any) {
        // Salvar no cache de forma assíncrona
        setImmediate(async () => {
          try {
            // Salvar o conteúdo no cache
            await basicCache.set(cacheKey, body, {
              ttl: config.ttl,
              tags: config.tags || [],
            });

            logger.debug(`Cache definido: ${cacheKey}`);
          } catch (error) {
            logger.warn("Erro ao salvar cache:", error);
          }
        });

        // Adicionar headers de cache
        res.set({
          "X-Cache": "MISS",
          "X-Cache-Key": cacheKey,
          "Cache-Control": `public, max-age=${config.ttl}`,
          ETag: generateETag(body),
        });

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error("Erro no middleware de cache:", error);
      next();
    }
  };
};

/**
 * Middleware para invalidação de cache por tags
 * @param tags Tags para invalidar
 */
export const cacheInvalidationMiddleware = (tags: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Continuar com o processamento normal
    next();

    // Após a resposta ser enviada, invalidar o cache se a operação foi bem-sucedida
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Invalidar cache por tags usando basicCache
          await basicCache.invalidateByTags(tags);
          logger.info(`Cache invalidado para tags: ${tags.join(", ")}`);
        } catch (error) {
          logger.warn("Erro ao invalidar cache:", error);
        }
      }
    });
  };
};

/**
 * Middleware para cache de imagens com diferentes resoluções
 * @param resolutions Resoluções suportadas
 */
export const imageCacheMiddleware = (
  resolutions: string[] = ["thumbnail", "medium", "large"]
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { resolution = "medium" } = req.query;

    if (!resolutions.includes(resolution as string)) {
      res.status(400).json({ error: "Resolução não suportada" });
      return;
    }

    const cacheKey = `image:${req.params.id}:${resolution}`;

    try {
      // Verificar cache de imagem
      const cachedImage = await basicCache.get(cacheKey);

      if (cachedImage) {
        res.set({
          "Content-Type": cachedImage.contentType,
          "Cache-Control": "public, max-age=86400", // 24 horas para imagens
          "X-Cache": "HIT",
          ETag: cachedImage.etag,
        });

        res.send(Buffer.from(cachedImage.data, "base64"));
        return;
      }

      // Interceptar resposta de imagem
      const originalSend = res.send;
      res.send = function (data: any) {
        if (res.statusCode === 200 && data instanceof Buffer) {
          // Salvar imagem no cache
          setImmediate(async () => {
            try {
              const imageData = {
                data: data.toString("base64"),
                contentType: res.get("Content-Type") || "image/jpeg",
                etag: crypto.createHash("md5").update(data).digest("hex"),
              };

              await basicCache.set(cacheKey, imageData, {
                ttl: 86400, // 24 horas
                tags: ["images", `image:${req.params.id}`],
              });

              logger.debug(`Imagem cacheada: ${cacheKey}`);
            } catch (error) {
              logger.warn("Erro ao cachear imagem:", error);
            }
          });
        }

        // Adicionar headers de cache
        res.set({
          "X-Cache": "MISS",
          "Cache-Control": "public, max-age=86400", // 24 horas para imagens
        });

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error("Erro no middleware de cache de imagens:", error);
      next();
    }
  };
};

// Gerar chave de cache baseada na configuração
function generateCacheKey(
  req: Partial<Request>,
  type: string,
  config: CacheConfig
): string {
  const keyParts = [type];

  // Adicionar parâmetros da URL
  if (req.params && Object.keys(req.params).length > 0) {
    keyParts.push("params", JSON.stringify(req.params));
  }

  // Adicionar query parameters específicos
  if (config.varyBy) {
    const varyParams: Record<string, any> = {};

    for (const param of config.varyBy) {
      if (param === "userId") {
        // Obter userId do token decodificado
        varyParams.userId = (req as any).user?.id;
      } else if (req.query && req.query[param] !== undefined) {
        varyParams[param] = req.query[param];
      }
    }

    if (Object.keys(varyParams).length > 0) {
      keyParts.push("query", JSON.stringify(varyParams));
    }
  }

  return keyParts.join(":");
}

// Gerar ETag para controle de cache
function generateETag(data: any): string {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("md5").update(str).digest("hex");
}

/**
 * Middleware para cache condicional (ETag)
 * Implementa verificação de ETag para evitar transferência desnecessária de dados
 */
export const conditionalCacheMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientETag = req.get("If-None-Match");

    if (clientETag) {
      const originalJson = res.json;
      res.json = function (body: any) {
        const serverETag = generateETag(body);

        if (clientETag === serverETag) {
          return res.status(304).end();
        }

        res.set("ETag", serverETag);
        return originalJson.call(this, body);
      };
    }

    next();
  };
};

/**
 * Função para pré-aquecer cache
 * @param routes Rotas para pré-aquecer
 */
export async function warmupCache(
  routes?: Array<{ path: string; type: string; params?: any }>
) {
  logger.info("Iniciando pré-aquecimento do cache...");

  // Rotas padrão para pré-aquecimento se nenhuma for fornecida
  const defaultRoutes = [
    { path: "/discover/recents", type: "discover" },
    { path: "/discover/views", type: "discover" },
    { path: "/discover/likes", type: "discover" },
    { path: "/categories", type: "categories" },
  ];

  const routesToWarm = routes || defaultRoutes;

  for (const route of routesToWarm) {
    try {
      // Simular requisição para pré-aquecer
      const mockReq: Partial<Request> = {
        method: "GET",
        path: route.path,
        query: {},
      };

      const config = DEFAULT_CACHE_CONFIGS[route.type] || { ttl: 300 };
      const cacheKey = generateCacheKey(mockReq, route.type, config);

      logger.debug(`Pré-aquecendo cache: ${cacheKey}`);
      // Nota: O aquecimento real seria feito fazendo requisições aos endpoints
      // ou pré-populando o cache com dados conhecidos
    } catch (error) {
      logger.error(`Erro ao pré-aquecer ${route.path}:`, error);
    }
  }

  logger.info("Pré-aquecimento do cache concluído");
}
