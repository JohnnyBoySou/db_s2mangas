import prisma from '@/prisma/client';
import { logger } from './logger';

/**
 * Remove notificações mais antigas que o número de dias especificado
 * @param daysOld - Número de dias para considerar uma notificação como antiga (padrão: 30)
 */
export async function cleanOldNotifications(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });
    
    logger.info(`Limpeza de notificações antigas concluída. ${result.count} notificações removidas (mais antigas que ${daysOld} dias).`);
    return result.count;
  } catch (error) {
    logger.error('Erro ao limpar notificações antigas:', error);
    throw error;
  }
}

/**
 * Remove notificações de tipos específicos mais antigas que X dias
 * @param types - Array de tipos de notificação para remover
 * @param daysOld - Número de dias para considerar como antiga
 */
export async function cleanOldNotificationsByType(types: string[], daysOld: number = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await prisma.notification.deleteMany({
      where: {
        type: {
          in: types
        },
        createdAt: {
          lt: cutoffDate
        }
      }
    });
    
    logger.info(`Limpeza de notificações por tipo concluída. ${result.count} notificações dos tipos [${types.join(', ')}] removidas.`);
    return result.count;
  } catch (error) {
    logger.error('Erro ao limpar notificações por tipo:', error);
    throw error;
  }
}