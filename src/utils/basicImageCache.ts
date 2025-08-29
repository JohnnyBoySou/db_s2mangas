import * as basicCache from './basicCache';
import { logger } from './logger';
import sharp from 'sharp';
import crypto from 'crypto';

// Tipos para configuração de imagens
interface ImageResolution {
  name: string;
  width: number;
  height?: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  progressive?: boolean;
}

interface CachedImage {
  data: string; // Base64
  contentType: string;
  etag: string;
}

// Configurações de resolução predefinidas
const IMAGE_RESOLUTIONS: Record<string, ImageResolution> = {
  thumbnail: {
    name: 'thumbnail',
    width: 150,
    height: 200,
    quality: 80,
    format: 'webp',
    progressive: true
  },
  medium: {
    name: 'medium',
    width: 600,
    height: 800,
    quality: 90,
    format: 'webp',
    progressive: true
  },
  large: {
    name: 'large',
    width: 1200,
    height: 1600,
    quality: 95,
    format: 'webp',
    progressive: true
  }
};

// Gerar chave de cache para imagem
function generateImageKey(imageId: string, resolution: string): string {
  return `image:${imageId}:${resolution}`;
}

// Otimizar imagem para resolução específica
async function optimizeImage(
  buffer: Buffer,
  resolution: ImageResolution
): Promise<{ buffer: Buffer; metadata: any }> {
  try {
    let sharpInstance = sharp(buffer);
    
    // Redimensionar se necessário
    if (resolution.width > 0) {
      sharpInstance = sharpInstance.resize(resolution.width, resolution.height, {
        fit: 'cover',
        position: 'center'
      });
    }
    
    // Aplicar formato e qualidade
    const format = resolution.format;
    
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality: resolution.quality,
          progressive: resolution.progressive
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality: resolution.quality,
          progressive: resolution.progressive
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality: resolution.quality,
          lossless: resolution.progressive
        });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality: resolution.quality
        });
        break;
    }
    
    const optimizedBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(optimizedBuffer).metadata();
    
    return { buffer: optimizedBuffer, metadata };
  } catch (error) {
    logger.error('Erro ao otimizar imagem:', error);
    throw error;
  }
}

// Processar e cachear imagem
export async function processAndCacheImage(
  imageId: string,
  buffer: Buffer,
  resolutions: string[] = ['thumbnail', 'medium', 'large']
): Promise<void> {
  logger.info(`Processando imagem ${imageId} para ${resolutions.length} resoluções`);
  
  const processingPromises: Promise<void>[] = [];
  
  for (const resolutionName of resolutions) {
    const resolution = IMAGE_RESOLUTIONS[resolutionName];
    if (!resolution) continue;
    
    const cacheKey = generateImageKey(imageId, resolutionName);
    
    processingPromises.push(
      (async () => {
        try {
          const { buffer: optimizedBuffer } = await optimizeImage(buffer, resolution);
          
          const cachedImage: CachedImage = {
            data: optimizedBuffer.toString('base64'),
            contentType: `image/${resolution.format}`,
            etag: crypto.createHash('md5').update(optimizedBuffer).digest('hex')
          };
          
          // Salvar no cache
          await basicCache.set(cacheKey, cachedImage, {
            ttl: 86400 * 7, // 7 dias
            tags: ['images', `image:${imageId}`]
          });
          
          logger.debug(`Imagem cacheada: ${cacheKey}`);
        } catch (error) {
          logger.error(`Erro ao processar variante ${cacheKey}:`, error);
        }
      })()
    );
  }
  
  await Promise.allSettled(processingPromises);
  logger.info(`Processamento da imagem ${imageId} concluído`);
}

// Obter imagem do cache
export async function getCachedImage(
  imageId: string,
  resolution: string = 'medium'
): Promise<CachedImage | null> {
  const cacheKey = generateImageKey(imageId, resolution);
  
  try {
    const cached = await basicCache.get(cacheKey);
    
    if (cached) {
      logger.debug(`Cache hit para imagem: ${cacheKey}`);
      return cached as CachedImage;
    }
    
    return null;
  } catch (error) {
    logger.error('Erro ao obter imagem do cache:', error);
    return null;
  }
}

// Invalidar cache de uma imagem específica
export async function invalidateImage(imageId: string): Promise<void> {
  try {
    await basicCache.invalidateByTags([`image:${imageId}`]);
    logger.info(`Cache invalidado para imagem: ${imageId}`);
  } catch (error) {
    logger.error('Erro ao invalidar cache da imagem:', error);
  }
}

// Exportar configurações
export { IMAGE_RESOLUTIONS };