import prisma from '@/prisma/client';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface IntegrityReport {
  timestamp: string;
  database: {
    status: 'ok' | 'error';
    issues: string[];
  };
  files: {
    status: 'ok' | 'error';
    orphanFiles: number;
    missingFiles: number;
    issues: string[];
  };
  redis: {
    status: 'ok' | 'error';
    issues: string[];
  };
  diskSpace: {
    status: 'ok' | 'warning' | 'error';
    available: string;
    used: string;
    issues: string[];
  };
  overall: 'healthy' | 'warning' | 'critical';
}

/**
 * Verifica a integridade geral do sistema
 */
export async function checkSystemIntegrity(): Promise<IntegrityReport> {
  try {
    logger.info('Iniciando verificação de integridade do sistema...');
    
    const report: IntegrityReport = {
      timestamp: new Date().toISOString(),
      database: { status: 'ok', issues: [] },
      files: { status: 'ok', orphanFiles: 0, missingFiles: 0, issues: [] },
      redis: { status: 'ok', issues: [] },
      diskSpace: { status: 'ok', available: '', used: '', issues: [] },
      overall: 'healthy'
    };
    
    // Verifica banco de dados
    await checkDatabaseIntegrity(report);
    
    // Verifica arquivos
    await checkFilesIntegrity(report);
    
    // Verifica Redis
    await checkRedisIntegrity(report);
    
    // Verifica espaço em disco
    await checkDiskSpace(report);
    
    // Determina status geral
    determineOverallStatus(report);
    
    // Salva relatório
    await saveIntegrityReport(report);
    
    logger.info(`Verificação de integridade concluída. Status: ${report.overall}`);
    return report;
  } catch (error) {
    logger.error('Erro na verificação de integridade:', error);
    throw error;
  }
}

/**
 * Verifica integridade do banco de dados
 */
async function checkDatabaseIntegrity(report: IntegrityReport) {
  try {
    // Testa conexão básica
    await prisma.$queryRaw`SELECT 1`;
    
    // Verifica consistência de dados
    const issues: string[] = [];
    
    // Verifica usuários sem email
    const usersWithoutEmail = await prisma.user.count({
      where: {
        OR: [
          { email: null },
          { email: '' }
        ]
      }
    });
    
    if (usersWithoutEmail > 0) {
      issues.push(`${usersWithoutEmail} usuários sem email`);
    }
    
    // Verifica mangás sem traduções
    const mangasWithoutTranslations = await prisma.manga.count({
      where: {
        translations: {
          none: {}
        }
      }
    });
    
    if (mangasWithoutTranslations > 0) {
      issues.push(`${mangasWithoutTranslations} mangás sem traduções`);
    }
    
    // Verifica capítulos órfãos
    const orphanChapters = await prisma.chapter.count({
      where: {
        manga: null
      }
    });
    
    if (orphanChapters > 0) {
      issues.push(`${orphanChapters} capítulos órfãos`);
    }
    
    report.database.issues = issues;
    report.database.status = issues.length > 0 ? 'error' : 'ok';
  } catch (error) {
    report.database.status = 'error';
    report.database.issues.push(`Erro de conexão: ${error}`);
  }
}

/**
 * Verifica integridade dos arquivos
 */
async function checkFilesIntegrity(report: IntegrityReport) {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const issues: string[] = [];
    
    if (!fs.existsSync(uploadsDir)) {
      issues.push('Diretório de uploads não existe');
      report.files.status = 'error';
      report.files.issues = issues;
      return;
    }
    
    // Lista arquivos físicos
    const physicalFiles = fs.readdirSync(uploadsDir);
    
    // Busca registros no banco
    const dbFiles = await prisma.file.findMany({
      select: { id: true, filename: true }
    });
    
    const dbFileIds = new Set(dbFiles.map(file => file.id));
    
    // Verifica arquivos órfãos (físicos sem registro no banco)
    let orphanCount = 0;
    for (const filename of physicalFiles) {
      const fileId = path.parse(filename).name;
      if (!dbFileIds.has(fileId)) {
        orphanCount++;
      }
    }
    
    // Verifica arquivos faltantes (registros no banco sem arquivo físico)
    let missingCount = 0;
    for (const file of dbFiles) {
      const expectedFilename = `${file.id}.png`;
      if (!physicalFiles.includes(expectedFilename)) {
        missingCount++;
      }
    }
    
    report.files.orphanFiles = orphanCount;
    report.files.missingFiles = missingCount;
    
    if (orphanCount > 0) {
      issues.push(`${orphanCount} arquivos órfãos encontrados`);
    }
    
    if (missingCount > 0) {
      issues.push(`${missingCount} arquivos faltantes`);
    }
    
    report.files.issues = issues;
    report.files.status = issues.length > 0 ? 'error' : 'ok';
  } catch (error) {
    report.files.status = 'error';
    report.files.issues.push(`Erro na verificação de arquivos: ${error}`);
  }
}

/**
 * Verifica integridade do Redis
 */
async function checkRedisIntegrity(report: IntegrityReport) {
  try {
    const { getRedisClient } = await import('@/config/redis');
    const redis = getRedisClient();
    
    // Testa conexão
    await redis.ping();
    
    // Verifica uso de memória
    const info = await redis.info('memory');
    const memoryUsage = info.match(/used_memory_human:(\S+)/);
    
    if (memoryUsage) {
      const usage = memoryUsage[1];
      // Se usar mais de 100MB, adiciona aviso
      if (usage.includes('G') || (usage.includes('M') && parseInt(usage) > 100)) {
        report.redis.issues.push(`Alto uso de memória Redis: ${usage}`);
      }
    }
    
    report.redis.status = report.redis.issues.length > 0 ? 'error' : 'ok';
  } catch (error) {
    report.redis.status = 'error';
    report.redis.issues.push(`Erro de conexão Redis: ${error}`);
  }
}

/**
 * Verifica espaço em disco
 */
async function checkDiskSpace(report: IntegrityReport) {
  try {
    const { stdout } = await execAsync('df -h .');
    const lines = stdout.trim().split('\n');
    
    if (lines.length >= 2) {
      const diskInfo = lines[1].split(/\s+/);
      const used = diskInfo[2];
      const available = diskInfo[3];
      const usePercent = parseInt(diskInfo[4].replace('%', ''));
      
      report.diskSpace.used = used;
      report.diskSpace.available = available;
      
      if (usePercent > 90) {
        report.diskSpace.status = 'error';
        report.diskSpace.issues.push(`Disco quase cheio: ${usePercent}% usado`);
      } else if (usePercent > 80) {
        report.diskSpace.status = 'warning';
        report.diskSpace.issues.push(`Disco com pouco espaço: ${usePercent}% usado`);
      }
    }
  } catch (error) {
    report.diskSpace.status = 'error';
    report.diskSpace.issues.push(`Erro ao verificar espaço em disco: ${error}`);
  }
}

/**
 * Determina o status geral do sistema
 */
function determineOverallStatus(report: IntegrityReport) {
  const hasErrors = [
    report.database.status,
    report.files.status,
    report.redis.status,
    report.diskSpace.status
  ].includes('error');
  
  const hasWarnings = [
    report.diskSpace.status
  ].includes('warning');
  
  if (hasErrors) {
    report.overall = 'critical';
  } else if (hasWarnings) {
    report.overall = 'warning';
  } else {
    report.overall = 'healthy';
  }
}

/**
 * Salva relatório de integridade
 */
async function saveIntegrityReport(report: IntegrityReport) {
  try {
    const reportsDir = path.join(process.cwd(), 'reports', 'integrity');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportsDir, `integrity-${timestamp}.json`);
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    logger.info(`Relatório de integridade salvo em: ${reportFile}`);
  } catch (error) {
    logger.error('Erro ao salvar relatório de integridade:', error);
  }
}

/**
 * Verifica apenas a saúde básica do sistema
 */
export async function quickHealthCheck() {
  try {
    // Testa banco
    await prisma.$queryRaw`SELECT 1`;
    
    // Testa Redis
    const { getRedisClient } = await import('@/config/redis');
    const redis = getRedisClient();
    await redis.ping();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'ok',
      redis: 'ok'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}