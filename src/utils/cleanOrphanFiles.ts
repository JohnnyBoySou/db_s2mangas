import fs from 'fs';
import path from 'path';
import prisma from '@/prisma/client';
import { logger } from './logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function cleanOrphanFiles() {
  try {
    // Lista todos os arquivos físicos
    const physicalFiles = fs.readdirSync(UPLOAD_DIR);

    // Busca todos os registros de arquivo no banco
    const dbFiles = await prisma.file.findMany({
      select: { id: true }
    });

    // Cria um Set com os IDs dos arquivos no banco
    const dbFileIds = new Set(dbFiles.map((file: any) => file.id));

    // Verifica cada arquivo físico
    for (const filename of physicalFiles) {
      const fileId = path.parse(filename).name;
      
      // Se o arquivo não existe no banco, remove
      if (!dbFileIds.has(fileId)) {
        const filePath = path.join(UPLOAD_DIR, filename);
        fs.unlinkSync(filePath);
        logger.info(`Arquivo órfão removido: ${filename}`);
      }
    }

    logger.info('Limpeza de arquivos órfãos concluída');
  } catch (error) {
    logger.error('Erro ao limpar arquivos órfãos:', error);
  }
}