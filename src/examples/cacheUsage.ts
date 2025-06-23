/**
 * Exemplos de uso do Sistema de Cache Avançado
 * 
 * Este arquivo demonstra como utilizar todas as funcionalidades
 * do sistema de cache implementado no projeto.
 */

import * as advancedCache from '@/utils/advancedCache';
import { processAndCacheImage, getCachedImage, getImageCacheStats, cleanupOldImages } from '@/utils/imageCache';
import { createCachedPrismaClient, invalidatePrismaModel, prismaCacheStats } from '@/utils/prismaCache';
import { purgeCDNCache } from '@/config/cdn';
import { logger } from '@/utils/logger';

// Inicializar cliente Prisma
const prisma = createCachedPrismaClient();

/**
 * Exemplo 1: Cache básico de dados
 */
export async function exemploBasicCache() {
  logger.info('=== Exemplo 1: Cache Básico ===');
  
  // Dados de exemplo
  const mangaData = {
    id: '123',
    name: 'One Piece',
    description: 'Aventuras de Luffy...',
    chapters: 1000
  };
  
  // Armazenar no cache com tags
  await advancedCache.set(
    'manga:123', 
    mangaData, 
    { ttl: 3600, tags: ['manga', 'discover', 'popular'] } // TTL: 1 hora e tags para invalidação
  );
  
  // Recuperar do cache
  const cachedManga = await advancedCache.get('manga:123');
  logger.info('Manga do cache:', cachedManga);
  
  // Invalidar por tag
  await advancedCache.invalidateByTags(['manga']);
  logger.info('Cache invalidado por tag "manga"');
}

/**
 * Exemplo 2: Cache de imagens com múltiplas resoluções
 */
export async function exemploImageCache() {
  logger.info('=== Exemplo 2: Cache de Imagens ===');
  
  // Simular buffer de imagem (normalmente viria de upload/URL)
  const imageBuffer = Buffer.from('fake-image-data');
  
  // Processar e cachear em diferentes resoluções
  const resolutions = ['thumbnail', 'small', 'medium', 'large'];
  const formats = ['webp', 'jpeg', 'avif'];
  
  // Processar imagem para diferentes tipos
  try {
    await processAndCacheImage(
      'manga:123:cover',
      imageBuffer,
      'manga_cover'
    );
    
    logger.info('Imagem processada para todas as resoluções e formatos');
  } catch (error) {
    logger.warn('Erro ao processar imagem:', error);
  }
  
  // Recuperar imagem específica
  const cachedImage = await getCachedImage(
    'manga:123:cover',
    'medium',
    'webp'
  );
  
  if (cachedImage) {
    logger.info('Imagem recuperada do cache:', {
      contentType: cachedImage.contentType,
      size: cachedImage.size,
      etag: cachedImage.etag
    });
  }
  
  // Limpar imagens antigas (mais de 7 dias)
  await cleanupOldImages(7 * 24 * 60 * 60 * 1000);
  logger.info('Limpeza de imagens antigas concluída');
}

/**
 * Exemplo 3: Cache inteligente do Prisma
 */
export async function exemploPrismaCache() {
  logger.info('=== Exemplo 3: Cache do Prisma ===');
  
  try {
    // Query que será automaticamente cacheada
    const manga = await prisma.manga.findUnique({
      where: { id: '123' },
      include: {
        categories: true,
        chapters: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    logger.info('Manga encontrado:', manga);
    
    // Segunda query - deve vir do cache
    const mangaCached = await prisma.manga.findUnique({
      where: { id: '123' },
      include: {
        categories: true,
        chapters: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    logger.info('Manga do cache:', mangaCached);
    
    // Obter estatísticas
    const stats = prismaCacheStats();
    logger.info('Estatísticas do Prisma Cache:', {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)}%`
    });
    
    // Invalidar cache de um modelo específico
    await invalidatePrismaModel('manga');
    logger.info('Cache do modelo "manga" invalidado');
    
  } catch (error) {
    logger.error('Erro no exemplo Prisma:', error);
  }
}

/**
 * Exemplo 4: Cache com compressão e tags avançadas
 */
export async function exemploAdvancedFeatures() {
  logger.info('=== Exemplo 4: Funcionalidades Avançadas ===');
  
  // Dados grandes para demonstrar compressão
  const bigData = {
    manga: {
      id: '456',
      name: 'Naruto',
      description: 'A'.repeat(10000), // String grande
      chapters: Array.from({ length: 700 }, (_, i) => ({
        id: i + 1,
        title: `Capítulo ${i + 1}`,
        pages: 20
      }))
    }
  };
  
  // Cache com compressão automática
  await advancedCache.set(
    'manga:456:full',
    bigData,
    { 
      ttl: 7200, // 2 horas
      tags: ['manga', 'naruto', 'shonen', 'complete'],
      compression: true // Forçar compressão
    }
  );
  
  // Verificar tamanho comprimido vs original
  const originalSize = JSON.stringify(bigData).length;
  
  logger.info('Compressão:', {
    originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
    compressedSize: 'N/A (informação não disponível)',
    compressionRatio: 'N/A (informação não disponível)'
  });
  
  // Cache hierárquico com tags relacionadas
  const tags = {
    manga: ['manga', 'content'],
    discover: ['discover', 'recommendation'],
    user: ['user', 'profile'],
    search: ['search', 'index']
  };
  
  // Armazenar dados relacionados
  await Promise.all([
    advancedCache.set('discover:trending', ['456', '123', '789'], { ttl: 1800, tags: tags.discover }),
    advancedCache.set('discover:new', ['456', '321', '654'], { ttl: 1800, tags: tags.discover }),
    advancedCache.set('search:index:naruto', ['456'], { ttl: 3600, tags: tags.search }),
    advancedCache.set('user:123:library', ['456', '123'], { ttl: 7200, tags: tags.user })
  ]);
  
  // Invalidação em cascata
  logger.info('Invalidando cache de descoberta...');
  await advancedCache.invalidateByTags(['discover']);
  
  // Verificar o que foi invalidado
  const stillExists = await Promise.all([
    advancedCache.get('discover:trending').then(result => result !== null),
    advancedCache.get('discover:new').then(result => result !== null),
    advancedCache.get('search:index:naruto').then(result => result !== null),
    advancedCache.get('user:123:library').then(result => result !== null)
  ]);
  
  logger.info('Status após invalidação:', {
    'discover:trending': stillExists[0],
    'discover:new': stillExists[1],
    'search:index:naruto': stillExists[2],
    'user:123:library': stillExists[3]
  });
}

/**
 * Exemplo 5: Integração com CDN
 */
export async function exemploCDNIntegration() {
  logger.info('=== Exemplo 5: Integração CDN ===');
  
  // Simular purge de CDN para recursos atualizados
  const pathsToPurge = [
    '/images/manga/123/cover.webp',
    '/images/manga/123/cover-medium.webp',
    '/images/manga/123/cover-small.webp',
    '/static/css/main.css',
    '/api/manga/123'
  ];
  
  try {
    await purgeCDNCache(pathsToPurge);
    logger.info('CDN purge concluído para:', pathsToPurge);
  } catch (error) {
    logger.error('Erro no CDN purge:', error);
  }
  
  // Simular warming de cache para conteúdo popular
  const popularContent = [
    'manga:123', 'manga:456', 'manga:789',
    'discover:trending', 'discover:popular',
    'categories:all'
  ];
  
  logger.info('Warming cache para conteúdo popular...');
  for (const key of popularContent) {
    const cached = await advancedCache.get(key);
    if (!cached) {
      // Simular carregamento de dados
      const mockData = { id: key, loadedAt: new Date().toISOString() };
      await advancedCache.set(key, mockData, { ttl: 3600, tags: ['popular', 'warmed'] });
      logger.info(`Cache warmed: ${key}`);
    }
  }
}

/**
 * Exemplo 6: Monitoramento e estatísticas
 */
export async function exemploMonitoring() {
  logger.info('=== Exemplo 6: Monitoramento ===');
  
  // Obter estatísticas gerais
  const generalStats = await advancedCache.getStats();
  logger.info('Estatísticas Gerais:', generalStats);
  
  // Estatísticas do Prisma
  const prismaStats = prismaCacheStats();
  logger.info('Estatísticas Prisma:', prismaStats);
  
  // Estatísticas de imagens
  const imageStats = await getImageCacheStats();
  logger.info('Estatísticas Imagens:', imageStats);
  
  logger.info('Monitoramento de cache concluído');
}

/**
 * Executar todos os exemplos
 */
export async function executarTodosExemplos() {
  logger.info('🚀 Iniciando exemplos do Sistema de Cache Avançado');
  
  try {
    await exemploBasicCache();
    await exemploImageCache();
    await exemploPrismaCache();
    await exemploAdvancedFeatures();
    await exemploCDNIntegration();
    await exemploMonitoring();
    
    logger.info('✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao executar exemplos:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executarTodosExemplos()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Erro fatal:', error);
      process.exit(1);
    });
}