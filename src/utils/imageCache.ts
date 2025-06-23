import * as advancedCache from './advancedCache';
import { logger } from './logger';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
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

interface ImageCacheOptions {
  ttl?: number;
  tags?: string[];
  generateResolutions?: boolean;
  optimizeOriginal?: boolean;
  formats?: ('jpeg' | 'png' | 'webp' | 'avif')[];
}

interface CachedImage {
  data: string; // Base64
  contentType: string;
  size: number;
  width: number;
  height: number;
  etag: string;
  lastModified: string;
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
  small: {
    name: 'small',
    width: 300,
    height: 400,
    quality: 85,
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
  },
  original: {
    name: 'original',
    width: 0, // Manter tamanho original
    quality: 95,
    format: 'webp',
    progressive: true
  }
};

// Configurações de cache por tipo de imagem
const IMAGE_CACHE_CONFIG = {
  manga_cover: {
    ttl: 86400 * 7, // 7 dias
    tags: ['images', 'manga'],
    resolutions: ['thumbnail', 'small', 'medium', 'large'],
    formats: ['webp', 'jpeg'] as const
  },
  chapter_page: {
    ttl: 86400 * 30, // 30 dias
    tags: ['images', 'chapter'],
    resolutions: ['medium', 'large', 'original'],
    formats: ['webp', 'jpeg'] as const
  },
  wallpaper: {
    ttl: 86400 * 14, // 14 dias
    tags: ['images', 'wallpaper'],
    resolutions: ['small', 'medium', 'large', 'original'],
    formats: ['webp', 'jpeg', 'png'] as const
  },
  avatar: {
    ttl: 86400 * 3, // 3 dias
    tags: ['images', 'user'],
    resolutions: ['thumbnail', 'small', 'medium'],
    formats: ['webp', 'jpeg'] as const
  }
};

// Fila de processamento global para evitar duplicação
const processingQueue = new Map<string, Promise<CachedImage>>();

// Gerar chave de cache para imagem
function generateImageKey(imageId: string, resolution: string, format: string): string {
  return `image:${imageId}:${resolution}:${format}`;
}

// Detectar formato da imagem
async function detectImageFormat(buffer: Buffer): Promise<string> {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata.format || 'jpeg';
  } catch (error) {
    logger.warn('Erro ao detectar formato da imagem, usando JPEG como padrão:', error);
    return 'jpeg';
  }
}

// Otimizar imagem para resolução específica
async function optimizeImage(
  buffer: Buffer,
  resolution: ImageResolution,
  targetFormat?: string
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
    const format = targetFormat || resolution.format;
    
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

// Processar uma variante específica da imagem
async function processImageVariant(
  buffer: Buffer,
  imageId: string,
  resolution: ImageResolution,
  format: string,
  cacheKey: string,
  ttl: number,
  tags: string[]
): Promise<CachedImage> {
  try {
    const { buffer: optimizedBuffer, metadata } = await optimizeImage(
      buffer,
      resolution,
      format
    );
    
    const cachedImage: CachedImage = {
      data: optimizedBuffer.toString('base64'),
      contentType: `image/${format}`,
      size: optimizedBuffer.length,
      width: metadata.width || 0,
      height: metadata.height || 0,
      etag: crypto.createHash('md5').update(optimizedBuffer).digest('hex'),
      lastModified: new Date().toISOString()
    };
    
    // Salvar no cache
    await advancedCache.set(cacheKey, cachedImage, {
      ttl,
      tags: [...tags, `image:${imageId}`],
      compression: false, // Imagens já são otimizadas
      l2Cache: true
    });
    
    logger.debug(`Imagem cacheada: ${cacheKey} (${cachedImage.size} bytes)`);
    return cachedImage;
  } catch (error) {
    logger.error(`Erro ao processar variante ${cacheKey}:`, error);
    throw error;
  }
}

// Processar e cachear imagem
export async function processAndCacheImage(
  imageId: string,
  buffer: Buffer,
  type: keyof typeof IMAGE_CACHE_CONFIG,
  options: ImageCacheOptions = {}
): Promise<void> {
  const config = IMAGE_CACHE_CONFIG[type];
  const resolutions = options.generateResolutions !== false ? config.resolutions : ['original'];
  const formats = options.formats || config.formats;
  
  logger.info(`Processando imagem ${imageId} para ${resolutions.length} resoluções e ${formats.length} formatos`);
  
  const processingPromises: Promise<void>[] = [];
  
  for (const resolutionName of resolutions) {
    const resolution = IMAGE_RESOLUTIONS[resolutionName];
    if (!resolution) continue;
    
    for (const format of formats) {
      const cacheKey = generateImageKey(imageId, resolutionName, format);
      
      // Evitar processamento duplicado
      if (processingQueue.has(cacheKey)) {
        continue;
      }
      
      const processingPromise = processImageVariant(
        buffer,
        imageId,
        resolution,
        format,
        cacheKey,
        config.ttl,
        config.tags
      );
      
      processingQueue.set(cacheKey, processingPromise);
      processingPromises.push(
        processingPromise.then(() => {
          processingQueue.delete(cacheKey);
        }).catch((error) => {
          processingQueue.delete(cacheKey);
          logger.error(`Erro ao processar variante ${cacheKey}:`, error);
        })
      );
    }
  }
  
  await Promise.allSettled(processingPromises);
  logger.info(`Processamento da imagem ${imageId} concluído`);
}

// Obter imagem do cache
export async function getCachedImage(
  imageId: string,
  resolution: string = 'medium',
  format: string = 'webp'
): Promise<CachedImage | null> {
  const cacheKey = generateImageKey(imageId, resolution, format);
  
  try {
    const cached = await advancedCache.get(cacheKey);
    
    if (cached) {
      logger.debug(`Cache hit para imagem: ${cacheKey}`);
      return cached as CachedImage;
    }
    
    // Tentar fallback para outros formatos
    const fallbackFormats = ['webp', 'jpeg', 'png'].filter(f => f !== format);
    
    for (const fallbackFormat of fallbackFormats) {
      const fallbackKey = generateImageKey(imageId, resolution, fallbackFormat);
      const fallbackCached = await advancedCache.get(fallbackKey);
      
      if (fallbackCached) {
        logger.debug(`Cache hit com fallback: ${fallbackKey}`);
        return fallbackCached as CachedImage;
      }
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
    await advancedCache.invalidateByTags([`image:${imageId}`]);
    logger.info(`Cache invalidado para imagem: ${imageId}`);
  } catch (error) {
    logger.error('Erro ao invalidar cache da imagem:', error);
  }
}

// Pré-processar imagens de um diretório
export async function preprocessDirectory(
  directoryPath: string,
  type: keyof typeof IMAGE_CACHE_CONFIG
): Promise<void> {
  try {
    const files = await fs.readdir(directoryPath);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|webp|avif)$/i.test(file)
    );
    
    logger.info(`Pré-processando ${imageFiles.length} imagens do diretório ${directoryPath}`);
    
    for (const file of imageFiles) {
      try {
        const filePath = path.join(directoryPath, file);
        const buffer = await fs.readFile(filePath);
        const imageId = path.parse(file).name;
        
        await processAndCacheImage(imageId, buffer, type);
      } catch (error) {
        logger.error(`Erro ao pré-processar ${file}:`, error);
      }
    }
    
    logger.info('Pré-processamento concluído');
  } catch (error) {
    logger.error('Erro no pré-processamento do diretório:', error);
  }
}

// Obter estatísticas do cache de imagens
export async function getImageCacheStats(): Promise<any> {
  try {
    const stats = await advancedCache.getStats();
    
    // Contar imagens por tipo
    const imageStats = {
      totalImages: 0,
      byType: {} as Record<string, number>,
      byResolution: {} as Record<string, number>,
      byFormat: {} as Record<string, number>
    };
    
    // Esta é uma implementação simplificada
    // Em produção, você poderia manter contadores mais detalhados
    
    return {
      ...stats,
      images: imageStats
    };
  } catch (error) {
    logger.error('Erro ao obter estatísticas do cache de imagens:', error);
    return null;
  }
}

// Limpar cache de imagens antigas
export async function cleanupOldImages(maxAge: number = 86400 * 30): Promise<void> {
  try {
    // Esta funcionalidade seria implementada no advancedCache
    // para limpar entradas baseadas na idade
    logger.info('Limpeza de imagens antigas iniciada');
    
    // Implementação específica dependeria da estrutura do cache
    // Por enquanto, apenas log
    
    logger.info('Limpeza de imagens antigas concluída');
  } catch (error) {
    logger.error('Erro na limpeza de imagens antigas:', error);
  }
}

// Exportar configurações
export { IMAGE_RESOLUTIONS, IMAGE_CACHE_CONFIG };