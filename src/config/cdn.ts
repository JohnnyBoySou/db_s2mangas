import { logger } from '@/utils/logger';
import { getCachedImage } from '@/utils/imageCache';
import { Request, Response, NextFunction } from 'express';
import path from 'path';

// Configurações do CDN
interface CDNConfig {
  enabled: boolean;
  baseUrl?: string;
  regions: string[];
  cacheTTL: {
    images: number;
    static: number;
    api: number;
  };
  compression: {
    enabled: boolean;
    level: number;
    threshold: number;
  };
  headers: Record<string, string>;
}

const CDN_CONFIG: CDNConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  baseUrl: process.env.CDN_BASE_URL,
  regions: (process.env.CDN_REGIONS || 'us-east-1,eu-west-1,ap-southeast-1').split(','),
  cacheTTL: {
    images: 86400 * 30, // 30 dias
    static: 86400 * 7,  // 7 dias
    api: 300            // 5 minutos
  },
  compression: {
    enabled: true,
    level: 6,
    threshold: 1024 // 1KB
  },
  headers: {
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  }
};

// Tipos de conteúdo para CDN
const CONTENT_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  static: ['text/css', 'application/javascript', 'font/woff', 'font/woff2'],
  api: ['application/json']
};

// Middleware para simular comportamento de CDN
export const cdnMiddleware = (type: keyof typeof CONTENT_TYPES) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!CDN_CONFIG.enabled) {
      return next();
    }

    try {
      // Configurar headers de CDN
      const ttl = CDN_CONFIG.cacheTTL[type];
      
      res.set({
        ...CDN_CONFIG.headers,
        'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
        'X-CDN-Cache': 'MISS',
        'X-CDN-Region': getClosestRegion(req),
        'Vary': 'Accept-Encoding, Accept'
      });

      // Para imagens, tentar servir do cache otimizado
      if (type === 'images' && req.params.id) {
        const { resolution = 'medium', format = 'webp' } = req.query;
        const cachedImage = await getCachedImage(
          req.params.id,
          resolution as string,
          format as string
        );

        if (cachedImage) {
          res.set({
            'Content-Type': cachedImage.contentType,
            'Content-Length': cachedImage.size.toString(),
            'ETag': cachedImage.etag,
            'Last-Modified': cachedImage.lastModified,
            'X-CDN-Cache': 'HIT',
            'X-Image-Width': cachedImage.width.toString(),
            'X-Image-Height': cachedImage.height.toString()
          });

          // Verificar If-None-Match
          if (req.get('If-None-Match') === cachedImage.etag) {
            res.status(304).end();
            return;
          }

          // Verificar If-Modified-Since
          const ifModifiedSince = req.get('If-Modified-Since');
          if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(cachedImage.lastModified)) {
            res.status(304).end();
            return;
          }

          const buffer = Buffer.from(cachedImage.data, 'base64');
          res.send(buffer);
          return; 
        }
      }

      // Interceptar resposta para adicionar headers de CDN
      const originalSend = res.send;
      res.send = function (data: any) {
        // Adicionar headers específicos baseados no conteúdo
        if (data instanceof Buffer || typeof data === 'string') {
          const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
          res.set('Content-Length', size.toString());
          
          // Adicionar compressão se necessário
          if (CDN_CONFIG.compression.enabled && size > CDN_CONFIG.compression.threshold) {
            res.set('X-CDN-Compressed', 'true');
          }
        }

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Erro no middleware CDN:', error);
      next();
    }
  };
};

// Obter região mais próxima baseada no IP
function getClosestRegion(req: Request): string {
  // Implementação simplificada - em produção usaria geolocalização real
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Lógica básica baseada em headers
  const cfRegion = req.get('CF-IPCountry'); // Cloudflare
  const awsRegion = req.get('CloudFront-Viewer-Country'); // AWS CloudFront
  
  if (cfRegion || awsRegion) {
    const country = cfRegion || awsRegion;
    
    // Mapear países para regiões
    const regionMap: Record<string, string> = {
      'US': 'us-east-1',
      'CA': 'us-east-1',
      'BR': 'sa-east-1',
      'GB': 'eu-west-1',
      'DE': 'eu-west-1',
      'FR': 'eu-west-1',
      'JP': 'ap-northeast-1',
      'KR': 'ap-northeast-2',
      'SG': 'ap-southeast-1',
      'AU': 'ap-southeast-2'
    };
    
    return regionMap[country!] || CDN_CONFIG.regions[0];
  }
  
  return CDN_CONFIG.regions[0];
}

// Middleware para otimização de imagens baseada no User-Agent
export const imageOptimizationMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userAgent = req.get('User-Agent') || '';
    const accept = req.get('Accept') || '';
    
    // Detectar suporte a formatos modernos
    const supportsWebP = accept.includes('image/webp');
    const supportsAVIF = accept.includes('image/avif');
    
    // Detectar dispositivo
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isRetina = req.get('DPR') === '2' || userAgent.includes('Retina');
    
    // Definir formato e resolução otimizados
    if (!req.query.format) {
      if (supportsAVIF) {
        req.query.format = 'avif';
      } else if (supportsWebP) {
        req.query.format = 'webp';
      } else {
        req.query.format = 'jpeg';
      }
    }
    
    if (!req.query.resolution) {
      if (isMobile) {
        req.query.resolution = isRetina ? 'medium' : 'small';
      } else {
        req.query.resolution = isRetina ? 'large' : 'medium';
      }
    }
    
    // Adicionar headers de otimização
    res.set({
      'X-Image-Optimized': 'true',
      'X-Device-Type': isMobile ? 'mobile' : 'desktop',
      'X-Supports-WebP': supportsWebP.toString(),
      'X-Supports-AVIF': supportsAVIF.toString()
    });
    
    next();
  };
};

// Middleware para cache de recursos estáticos
export const staticCacheMiddleware = (maxAge: number = 86400) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ext = path.extname(req.path).toLowerCase();
    
    // Configurar cache baseado na extensão
    const cacheConfig: Record<string, number> = {
      '.css': 86400 * 7,   // 7 dias
      '.js': 86400 * 7,    // 7 dias
      '.woff': 86400 * 30, // 30 dias
      '.woff2': 86400 * 30, // 30 dias
      '.ttf': 86400 * 30,  // 30 dias
      '.ico': 86400 * 30,  // 30 dias
      '.svg': 86400 * 7,   // 7 dias
    };
    
    const ttl = cacheConfig[ext] || maxAge;
    
    res.set({
      'Cache-Control': `public, max-age=${ttl}, immutable`,
      'X-Static-Cache': 'true',
      'Expires': new Date(Date.now() + ttl * 1000).toUTCString()
    });
    
    next();
  };
};

// Função para purgar cache do CDN
export async function purgeCDNCache(paths: string[]): Promise<void> {
  if (!CDN_CONFIG.enabled || !CDN_CONFIG.baseUrl) {
    logger.info('CDN não configurado, pulando purge');
    return;
  }
  
  try {
    // Implementação específica dependeria do provedor CDN
    // Cloudflare, AWS CloudFront, etc.
    
    logger.info(`Purge CDN iniciado para ${paths.length} paths`);
    
    // Exemplo para Cloudflare
    if (process.env.CLOUDFLARE_API_TOKEN) {
      await purgeCloudflarePaths(paths);
    }
    
    // Exemplo para AWS CloudFront
    if (process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID) {
      await purgeCloudFrontPaths(paths);
    }
    
    logger.info('Purge CDN concluído');
  } catch (error) {
    logger.error('Erro no purge CDN:', error);
  }
}

// Implementação específica para Cloudflare
async function purgeCloudflarePaths(paths: string[]): Promise<void> {
  // Implementação real faria chamada para API do Cloudflare
  logger.debug(`Cloudflare purge: ${paths.join(', ')}`);
}

// Implementação específica para AWS CloudFront
async function purgeCloudFrontPaths(paths: string[]): Promise<void> {
  // Implementação real faria chamada para API do CloudFront
  logger.debug(`CloudFront purge: ${paths.join(', ')}`);
}

// Obter estatísticas do CDN
export async function getCDNStats(): Promise<any> {
  return {
    enabled: CDN_CONFIG.enabled,
    regions: CDN_CONFIG.regions,
    config: CDN_CONFIG,
    timestamp: new Date().toISOString()
  };
}

export { CDN_CONFIG };