#!/usr/bin/env ts-node

/**
 * Script de teste para o Sistema de Observabilidade
 * 
 * Este script testa todas as funcionalidades de observabilidade
 * implementadas no projeto.
 */

import axios from 'axios';
import { logger, logMetric, logPerformance, logError } from '@/utils/logger';
import { generateHealthReport } from '@/middlewares/observability';

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

class ObservabilityTestSuite {
  private baseUrl: string;
  public testResults: { name: string; passed: boolean; error?: string }[] = [];

  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:3000';
  }

  private async test(name: string, testFn: () => Promise<void>): Promise<void> {
    try {
      await testFn();
      this.testResults.push({ name, passed: true });
      colorLog('green', `✅ ${name}`);
    } catch (error: any) {
      this.testResults.push({ name, passed: false, error: error.message });
      colorLog('red', `❌ ${name}: ${error.message}`);
    }
  }

  async runAllTests() {
    colorLog('blue', '🔍 Testando Sistema de Observabilidade');
    colorLog('blue', '=====================================\n');

    // Teste 1: Logging estruturado
    await this.test('Logging estruturado', async () => {
      logger.info('Teste de log estruturado', {
        test: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    });

    // Teste 2: Métricas de performance
    await this.test('Métricas de performance', async () => {
      logPerformance('test_operation', 150, {
        operation: 'test',
        success: true
      });
    });

    // Teste 3: Métricas de negócio
    await this.test('Métricas de negócio', async () => {
      logMetric('test_metric', 42, {
        type: 'test',
        category: 'observability'
      });
    });

    // Teste 4: Log de erro estruturado
    await this.test('Log de erro estruturado', async () => {
      const testError = new Error('Erro de teste para observabilidade');
      logError(testError, {
        context: 'test',
        severity: 'low'
      });
    });

    // Teste 5: Health report
    await this.test('Health report', async () => {
      const report = generateHealthReport();
      if (!report.timestamp || !report.uptime) {
        throw new Error('Health report inválido');
      }
    });

    // Teste 6: Endpoint de métricas JSON
    await this.test('Endpoint de métricas JSON', async () => {
      const response = await axios.get(`${this.baseUrl}/metrics/json`);
      if (response.status !== 200) {
        throw new Error(`Status inválido: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.timestamp || !data.system) {
        throw new Error('Resposta de métricas inválida');
      }
    });

    // Teste 7: Endpoint de métricas Prometheus
    await this.test('Endpoint de métricas Prometheus', async () => {
      const response = await axios.get(`${this.baseUrl}/metrics/prometheus`);
      if (response.status !== 200) {
        throw new Error(`Status inválido: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.includes('node_uptime_seconds') || !data.includes('cache_hit_rate')) {
        throw new Error('Formato Prometheus inválido');
      }
    });

    // Teste 8: Health check detalhado
    await this.test('Health check detalhado', async () => {
      const response = await axios.get(`${this.baseUrl}/metrics/health`);
      if (response.status !== 200) {
        throw new Error(`Status inválido: ${response.status}`);
      }
      
      const data = response.data;
      if (!data.status || !data.cache) {
        throw new Error('Health check detalhado inválido');
      }
    });

    // Teste 9: Request ID tracking
    await this.test('Request ID tracking', async () => {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: {
          'x-request-id': 'test-request-id-123'
        }
      });
      
      if (response.headers['x-request-id'] !== 'test-request-id-123') {
        throw new Error('Request ID não foi preservado');
      }
    });

    // Teste 10: Logs com contexto Railway
    await this.test('Logs com contexto Railway', async () => {
      logger.info('Teste de contexto Railway', {
        railway: {
          environment: process.env.RAILWAY_ENVIRONMENT || 'local',
          projectId: process.env.RAILWAY_PROJECT_ID || 'test',
          serviceId: process.env.RAILWAY_SERVICE_ID || 'test'
        }
      });
    });

    this.printResults();
  }

  private printResults() {
    colorLog('blue', '\n📊 Resultados dos Testes');
    colorLog('blue', '=======================\n');

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;

    colorLog('green', `✅ Passaram: ${passed}/${total}`);
    colorLog('red', `❌ Falharam: ${total - passed}/${total}`);

    if (total - passed > 0) {
      colorLog('yellow', '\n🔍 Detalhes dos erros:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          colorLog('red', `   • ${r.name}: ${r.error}`);
        });
    }

    colorLog('blue', '\n🎯 Próximos passos:');
    colorLog('blue', '1. Verifique os logs estruturados');
    colorLog('blue', '2. Monitore as métricas no Railway');
    colorLog('blue', '3. Configure alertas baseados nas métricas');
    colorLog('blue', '4. Integre com sistemas externos de observabilidade');
  }
}

// Executar testes
async function main() {
  const testSuite = new ObservabilityTestSuite();
  await testSuite.runAllTests();
}

main().catch(error => {
  colorLog('red', `❌ Erro ao executar testes: ${error.message}`);
  process.exit(1);
});
