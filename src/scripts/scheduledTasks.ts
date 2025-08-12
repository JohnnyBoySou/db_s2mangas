import cron from 'node-cron';
import { cleanOrphanFiles } from '@/utils/cleanOrphanFiles';
import { cleanRedisCache } from '@/utils/cleanRedisCache';
import { cleanOldNotifications } from '@/utils/cleanOldNotifications';
import { backupDatabase } from '@/utils/backupDatabase';
//import { generateAnalytics } from '@/utils/generateAnalytics';
//import { checkSystemIntegrity } from '@/utils/checkSystemIntegrity';
import { logger } from '@/utils/logger';

// Limpeza de arquivos órfãos - diariamente à meia-noite
cron.schedule('0 0 * * *', async () => {
  logger.info('Iniciando limpeza de arquivos órfãos...');
  await cleanOrphanFiles();
});

// Backup do banco de dados - diariamente à 1h da manhã
cron.schedule('0 1 * * *', async () => {
  logger.info('Iniciando backup do banco de dados...');
  try {
    await backupDatabase();
  } catch (error) {
    logger.error('Erro no backup automático:', error);
  }
});

// Verificação de integridade do sistema - semanalmente aos domingos às 2h
/*cron.schedule('0 2 * * 0', async () => {
  logger.info('Iniciando verificação de integridade do sistema...');
  try {
    await checkSystemIntegrity();
  } catch (error) {
    logger.error('Erro na verificação de integridade:', error);
  }
});
*/
// Limpeza de cache Redis - diariamente às 3h da manhã
cron.schedule('0 3 * * *', async () => {
  logger.info('Iniciando limpeza de cache Redis...');
  try {
    await cleanRedisCache();
  } catch (error) {
    logger.error('Erro na limpeza de cache Redis:', error);
  }
});

// Limpeza de notificações antigas - semanalmente aos domingos às 4h
cron.schedule('0 4 * * 0', async () => {
  logger.info('Iniciando limpeza de notificações antigas...');
  try {
    await cleanOldNotifications(30); // Remove notificações com mais de 30 dias
  } catch (error) {
    logger.error('Erro na limpeza de notificações:', error);
  }
});

// Geração de relatórios de analytics - semanalmente aos domingos às 5h
/*cron.schedule('0 5 * * 0', async () => {
  logger.info('Iniciando geração de relatório de analytics...');
  try {
    await generateAnalytics();
  } catch (error) {
    logger.error('Erro na geração de analytics:', error);
  }
});*/

logger.info('Tarefas agendadas configuradas com sucesso!');
logger.info('Horários das tarefas:');
logger.info('- Limpeza de arquivos órfãos: Diariamente às 00:00');
logger.info('- Backup do banco: Diariamente às 01:00');
logger.info('- Verificação de integridade: Domingos às 02:00');
logger.info('- Limpeza de cache Redis: Diariamente às 03:00');
logger.info('- Limpeza de notificações: Domingos às 04:00');
logger.info('- Geração de analytics: Domingos às 05:00');