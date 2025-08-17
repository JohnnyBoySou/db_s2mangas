import { Router } from 'express';
import { logger, logMetric } from '@/utils/logger';
import { generateHealthReport } from '@/middlewares/observability';
import { prismaCacheStats } from '@/utils/prismaCache';
import { getRedisClient } from '@/config/redis';

const router = Router();

// Endpoint para métricas do Prometheus
router.get('/prometheus', async (req, res) => {
  try {
    const metrics = await generatePrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Erro ao gerar métricas Prometheus:', error);
    res.status(500).send('# Erro ao gerar métricas\n');
  }
});

// Endpoint para métricas em JSON
router.get('/json', async (req, res) => {
  try {
    const metrics = await generateJSONMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Erro ao gerar métricas JSON:', error);
    res.status(500).json({ error: 'Erro ao gerar métricas' });
  }
});

// Endpoint para health check detalhado
router.get('/health', async (req, res) => {
  try {
    const healthReport = generateHealthReport();
    const cacheStats = prismaCacheStats();
    
    // Verificar conectividade com Redis
    const redis = getRedisClient();
    let redisStatus = 'unknown';
    if (redis) {
      try {
        await redis.ping();
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'disconnected';
      }
    }

    const detailedHealth = {
      ...healthReport,
      cache: {
        ...cacheStats,
        redis: redisStatus
      },
      status: 'healthy'
    };

    res.json(detailedHealth);
  } catch (error) {
    logger.error('Erro no health check:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Função para gerar métricas no formato Prometheus
async function generatePrometheusMetrics(): Promise<string> {
  const healthReport = generateHealthReport();
  const cacheStats = prismaCacheStats();
  
  let metrics = '';
  
  // Métricas do sistema
  metrics += `# HELP node_uptime_seconds Uptime do processo em segundos\n`;
  metrics += `# TYPE node_uptime_seconds gauge\n`;
  metrics += `node_uptime_seconds ${healthReport.uptime}\n\n`;
  
  metrics += `# HELP node_memory_usage_bytes Uso de memória em bytes\n`;
  metrics += `# TYPE node_memory_usage_bytes gauge\n`;
  metrics += `node_memory_usage_bytes{type="rss"} ${healthReport.memory.rss}\n`;
  metrics += `node_memory_usage_bytes{type="heapTotal"} ${healthReport.memory.heapTotal}\n`;
  metrics += `node_memory_usage_bytes{type="heapUsed"} ${healthReport.memory.heapUsed}\n`;
  metrics += `node_memory_usage_bytes{type="external"} ${healthReport.memory.external}\n\n`;
  
  // Métricas de cache
  metrics += `# HELP cache_hits_total Total de hits no cache\n`;
  metrics += `# TYPE cache_hits_total counter\n`;
  metrics += `cache_hits_total ${cacheStats.hits}\n\n`;
  
  metrics += `# HELP cache_misses_total Total de misses no cache\n`;
  metrics += `# TYPE cache_misses_total counter\n`;
  metrics += `cache_misses_total ${cacheStats.misses}\n\n`;
  
  metrics += `# HELP cache_hit_rate Cache hit rate percentage\n`;
  metrics += `# TYPE cache_hit_rate gauge\n`;
  metrics += `cache_hit_rate ${parseFloat(cacheStats.hitRate.replace('%', ''))}\n\n`;
  
  // Métricas de ambiente
  metrics += `# HELP app_environment_info Informações do ambiente\n`;
  metrics += `# TYPE app_environment_info gauge\n`;
  metrics += `app_environment_info{environment="${healthReport.environment}"} 1\n`;
  
  if (healthReport.railway.environment) {
    metrics += `app_environment_info{railway_environment="${healthReport.railway.environment}"} 1\n`;
  }
  
  return metrics;
}

// Função para gerar métricas em JSON
async function generateJSONMetrics() {
  const healthReport = generateHealthReport();
  const cacheStats = prismaCacheStats();
  
  // Log das métricas para observabilidade
  logMetric('uptime_seconds', healthReport.uptime);
  logMetric('memory_rss_bytes', healthReport.memory.rss);
  logMetric('memory_heap_used_bytes', healthReport.memory.heapUsed);
  logMetric('cache_hit_rate', parseFloat(cacheStats.hitRate.replace('%', '')));
  logMetric('cache_hits_total', cacheStats.hits);
  logMetric('cache_misses_total', cacheStats.misses);
  
  return {
    timestamp: new Date().toISOString(),
    system: {
      uptime: healthReport.uptime,
      memory: healthReport.memory,
      cpu: healthReport.cpu,
      environment: healthReport.environment
    },
    cache: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: cacheStats.hitRate,
      total: cacheStats.total
    },
    railway: healthReport.railway
  };
}

export default router;
