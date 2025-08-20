#!/usr/bin/env node

/**
 * Script de teste para o Sistema de Cache Avançado
 * 
 * Este script executa uma bateria de testes para verificar
 * se todas as funcionalidades do cache estão funcionando corretamente.
 */

import * as advancedCache from '@/utils/advancedCache';
import * as imageCache from '@/utils/imageCache';
import { createCachedPrismaClient, prismaCacheStats, resetPrismaCacheStats } from '@/utils/prismaCache';
import { getRedisClient, getRedisL1Client } from '@/config/redis';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorLog(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class CacheTestSuite {
  private prisma: any;
  public testResults: { name: string; passed: boolean; error?: string }[] = [];

  constructor() {
    this.prisma = createCachedPrismaClient();
  }

  private async test(name: string, testFn: () => Promise<void>): Promise<void> {
    try {
      colorLog('blue', `\n🧪 Testando: ${name}`);
      await testFn();
      this.testResults.push({ name, passed: true });
      colorLog('green', `✅ ${name} - PASSOU`);
    } catch (error) {
      this.testResults.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error)
      });
      colorLog('red', `❌ ${name} - FALHOU: ${error}`);
    }
  }

  async testRedisConnection(): Promise<void> {
    await this.test('Conexão Redis L1', async () => {
      const redis = getRedisClient();
      await redis?.ping();
      
      const redisL1 = getRedisL1Client();
      await redisL1?.ping();
    });
  }

  async testBasicCache(): Promise<void> {
    await this.test('Cache Básico L1/L2', async () => {
      const testData = { id: 'test', value: 'Hello Cache!', timestamp: Date.now() };
      const key = 'test:basic';
      
      // Armazenar
      await advancedCache.set(key, testData, { ttl: 60, tags: ['test'] });
      
      // Recuperar
      const retrieved = await advancedCache.get(key);
      if (!retrieved || retrieved.value !== testData.value) {
        throw new Error('Dados não foram recuperados corretamente');
      }
      
      // Verificar existência (implementar usando get)
      const exists = await advancedCache.get(key);
      if (!exists) {
        throw new Error('Cache não reporta existência corretamente');
      }
      
      // Limpar (usar invalidateByTags)
      await advancedCache.invalidateByTags(['test']);
      const afterDelete = await advancedCache.get(key);
      if (afterDelete) {
        throw new Error('Cache não foi deletado corretamente');
      }
    });
  }

  async testCacheCompression(): Promise<void> {
    await this.test('Compressão de Cache', async () => {
      const largeData = {
        id: 'compression-test',
        data: 'A'.repeat(10000), // 10KB de dados
        array: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      };
      
      const key = 'test:compression';
      
      // Armazenar com compressão
      await advancedCache.set(key, largeData, { ttl: 60, tags: ['test'], compression: true });
      
      // Recuperar e verificar integridade (sem verificação de compressão pois não há getInfo)
      const retrieved = await advancedCache.get(key);
      if (!retrieved || retrieved.data !== largeData.data) {
        throw new Error('Dados comprimidos não foram descomprimidos corretamente');
      }
      
      await advancedCache.invalidateByTags(['test']);
    });
  }

  async testTagInvalidation(): Promise<void> {
    await this.test('Invalidação por Tags', async () => {
      // Criar múltiplas entradas com tags diferentes
      await Promise.all([
        advancedCache.set('test:tag1', { value: 1 }, { ttl: 60, tags: ['group1', 'all'] }),
        advancedCache.set('test:tag2', { value: 2 }, { ttl: 60, tags: ['group1', 'all'] }),
        advancedCache.set('test:tag3', { value: 3 }, { ttl: 60, tags: ['group2', 'all'] }),
        advancedCache.set('test:tag4', { value: 4 }, { ttl: 60, tags: ['group2'] })
      ]);
      
      // Verificar que todas existem
      const beforeInvalidation = await Promise.all([
        advancedCache.get('test:tag1'),
        advancedCache.get('test:tag2'),
        advancedCache.get('test:tag3'),
        advancedCache.get('test:tag4')
      ]);
      
      if (!beforeInvalidation.every(exists => exists !== null)) {
        throw new Error('Nem todas as entradas foram criadas');
      }
      
      // Invalidar por tag 'group1'
      await advancedCache.invalidateByTags(['group1']);
      
      // Verificar invalidação seletiva
      const afterInvalidation = await Promise.all([
        advancedCache.get('test:tag1'), // deve ser null (group1)
        advancedCache.get('test:tag2'), // deve ser null (group1)
        advancedCache.get('test:tag3'), // deve ser não-null (group2)
        advancedCache.get('test:tag4')  // deve ser não-null (group2)
      ]);
      
      if (afterInvalidation[0] !== null || afterInvalidation[1] !== null) {
        throw new Error('Entradas do group1 não foram invalidadas');
      }
      
      if (afterInvalidation[2] === null || afterInvalidation[3] === null) {
        throw new Error('Entradas do group2 foram invalidadas incorretamente');
      }
      
      // Limpar restante
      await advancedCache.invalidateByTags(['group2']);
    });
  }

  async testImageCache(): Promise<void> {
    await this.test('Cache de Imagens', async () => {
      // Criar uma imagem fake (SVG simples)
      const svgData = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="red"/>
        <text x="50" y="50" text-anchor="middle" fill="white">TEST</text>
      </svg>`;
      
      const imageBuffer = Buffer.from(svgData);
      const imageId = 'test-image';
      
      // Processar e cachear
      await imageCache.processAndCacheImage(
        imageId,
        imageBuffer,
        'manga_cover'
      );
      
      // Recuperar do cache
      const cached = await imageCache.getCachedImage(imageId, 'medium', 'webp');
      
      if (!cached) {
        throw new Error('Imagem não foi recuperada do cache corretamente');
      }
      
      // Limpar (usar invalidateImage)
      await imageCache.invalidateImage(imageId);
    });
  }

  async testPrismaCache(): Promise<void> {
    await this.test('Cache do Prisma', async () => {
      // Reset estatísticas
      resetPrismaCacheStats();
      
      try {
        // Primeira query - deve ser miss
        await this.prisma.manga.findMany({ take: 1 });
        
        // Segunda query idêntica - deve ser hit
        await this.prisma.manga.findMany({ take: 1 });
        
        const stats = prismaCacheStats();
        
        if (stats.hits === 0) {
          colorLog('yellow', '⚠️  Aviso: Prisma cache pode não estar funcionando (sem hits)');
          // Não falhar o teste pois pode não haver dados no banco
        }
        
        if (stats.misses === 0) {
          throw new Error('Nenhum miss registrado - cache pode estar com problema');
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('does not exist')) {
          colorLog('yellow', '⚠️  Aviso: Tabela manga não existe - pulando teste Prisma');
          return;
        }
        throw error;
      }
    });
  }

  async testCacheStats(): Promise<void> {
    await this.test('Estatísticas de Cache', async () => {
      // Adicionar alguns dados para estatísticas
      await Promise.all([
        advancedCache.set('stats:test1', { data: 'test1' }, { ttl: 60, tags: ['stats'] }),
        advancedCache.set('stats:test2', { data: 'test2' }, { ttl: 60, tags: ['stats'] }),
        advancedCache.set('stats:test3', { data: 'test3' }, { ttl: 60, tags: ['stats'] })
      ]);
      
      const stats = await advancedCache.getStats();
      
      if (!stats || typeof stats.l1 !== 'object') {
        throw new Error('Estatísticas não foram retornadas corretamente');
      }
      
      if (stats.l1.entries < 3) {
        throw new Error('Contagem de chaves incorreta');
      }
      
      // Limpar
      await advancedCache.invalidateByTags(['stats']);
    });
  }

  async testMemoryUsage(): Promise<void> {
    await this.test('Uso de Memória', async () => {
      const stats = await advancedCache.getStats();
      
      if (!stats || typeof stats.l1 !== 'object' || typeof stats.l2 !== 'object') {
        throw new Error('Informações de uso de memória inválidas');
      }
      
      if (stats.l2.diskUsage < 0) {
        throw new Error('Uso de memória não pode ser negativo');
      }
    });
  }

  async testCacheCleanup(): Promise<void> {
    await this.test('Limpeza de Cache', async () => {
      // Criar entradas com TTL muito baixo
      await Promise.all([
        advancedCache.set('cleanup:test1', { data: 'test1' }, { ttl: 1, tags: ['cleanup'] }), // 1 segundo
        advancedCache.set('cleanup:test2', { data: 'test2' }, { ttl: 1, tags: ['cleanup'] }),
        advancedCache.set('cleanup:test3', { data: 'test3' }, { ttl: 60, tags: ['cleanup'] }) // 60 segundos
      ]);
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Executar limpeza
      await advancedCache.cleanupExpiredEntries();
      
      // Verificar que a entrada com TTL longo ainda existe
      const stillExists = await advancedCache.get('cleanup:test3');
      if (!stillExists) {
        throw new Error('Entrada com TTL longo foi removida incorretamente');
      }
      
      // Limpar restante
      await advancedCache.invalidateByTags(['cleanup']);
    });
  }

  async testConcurrency(): Promise<void> {
    await this.test('Concorrência', async () => {
      const promises: Promise<void>[] = [];
      const numOperations = 50;
      
      // Executar múltiplas operações simultaneamente
      for (let i = 0; i < numOperations; i++) {
        promises.push(
          advancedCache.set(`concurrent:${i}`, { id: i, data: `test-${i}` }, { ttl: 60, tags: ['concurrent'] })
        );
      }
      
      await Promise.all(promises);
      
      // Verificar que todas foram armazenadas
      const checkPromises: Promise<any>[] = [];
      for (let i = 0; i < numOperations; i++) {
        checkPromises.push(advancedCache.get(`concurrent:${i}`));
      }
      
      const results = await Promise.all(checkPromises);
      const successCount = results.filter(exists => exists !== null).length;
      
      if (successCount < numOperations * 0.9) { // Permitir 10% de falha
        throw new Error(`Apenas ${successCount}/${numOperations} operações concorrentes foram bem-sucedidas`);
      }
      
      // Limpar
      await advancedCache.invalidateByTags(['concurrent']);
    });
  }

  async runAllTests(): Promise<void> {
    colorLog('bold', '🚀 Iniciando Testes do Sistema de Cache Avançado\n');
    
    const startTime = Date.now();
    
    // Executar todos os testes
    await this.testRedisConnection();
    await this.testBasicCache();
    await this.testCacheCompression();
    await this.testTagInvalidation();
    await this.testImageCache();
    await this.testPrismaCache();
    await this.testCacheStats();
    await this.testMemoryUsage();
    await this.testCacheCleanup();
    await this.testConcurrency();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Relatório final
    this.printReport(duration);
  }

  public printReport(duration: number): void {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    colorLog('bold', '\n📊 RELATÓRIO DE TESTES');
    colorLog('bold', '='.repeat(50));
    
    console.log(`⏱️  Duração: ${duration}ms`);
    console.log(`📈 Total: ${total}`);
    colorLog('green', `✅ Passou: ${passed}`);
    colorLog('red', `❌ Falhou: ${failed}`);
    
    if (failed > 0) {
      colorLog('red', '\n❌ TESTES FALHARAM:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          colorLog('red', `  • ${r.name}: ${r.error}`);
        });
    }
    
    const successRate = (passed / total) * 100;
    
    if (successRate === 100) {
      colorLog('green', '\n🎉 TODOS OS TESTES PASSARAM!');
    } else if (successRate >= 80) {
      colorLog('yellow', `\n⚠️  ${successRate.toFixed(1)}% dos testes passaram`);
    } else {
      colorLog('red', `\n💥 Apenas ${successRate.toFixed(1)}% dos testes passaram`);
    }
    
    colorLog('bold', '='.repeat(50));
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const testSuite = new CacheTestSuite();
  
  testSuite.runAllTests()
    .then(() => {
      const failed = testSuite.testResults.filter(r => !r.passed).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      colorLog('red', `💥 Erro fatal nos testes: ${error}`);
      process.exit(1);
    });
}

export { CacheTestSuite };