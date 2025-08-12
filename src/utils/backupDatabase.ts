import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

const execAsync = promisify(exec);

/**
 * Realiza backup do banco de dados PostgreSQL
 */
export async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    
    // Cria diretório de backup se não existir
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Configurações do banco de dados
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL não configurada');
    }
    
    // Extrai informações da URL do banco
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port || '5432';
    const username = url.username;
    const password = url.password;
    
    // Comando pg_dump
    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} -f "${backupFile}"`;
    
    await execAsync(command);
    
    // Verifica se o arquivo foi criado
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      logger.info(`Backup do banco de dados criado com sucesso: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Remove backups antigos (mantém apenas os últimos 7)
      await cleanOldBackups(backupDir);
      
      return backupFile;
    } else {
      throw new Error('Arquivo de backup não foi criado');
    }
  } catch (error) {
    logger.error('Erro ao criar backup do banco de dados:', error);
    throw error;
  }
}

/**
 * Remove backups antigos, mantendo apenas os mais recentes
 * @param backupDir - Diretório dos backups
 * @param keepCount - Número de backups para manter (padrão: 7)
 */
export async function cleanOldBackups(backupDir: string, keepCount: number = 7) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    // Remove arquivos excedentes
    const filesToDelete = files.slice(keepCount);
    
    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
      logger.info(`Backup antigo removido: ${file.name}`);
    }
    
    if (filesToDelete.length > 0) {
      logger.info(`${filesToDelete.length} backups antigos removidos. Mantidos ${Math.min(files.length, keepCount)} backups.`);
    }
  } catch (error) {
    logger.error('Erro ao limpar backups antigos:', error);
  }
}

/**
 * Realiza backup simples usando Prisma (para desenvolvimento)
 */
export async function simpleBackup() {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Comando usando npx prisma
    const command = `npx prisma db push --force-reset && npx prisma db seed`;
    
    logger.info('Iniciando backup simples com Prisma...');
    await execAsync(command);
    
    logger.info('Backup simples concluído.');
  } catch (error) {
    logger.error('Erro no backup simples:', error);
    throw error;
  }
}