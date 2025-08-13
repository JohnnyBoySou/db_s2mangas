import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/prisma/client';

const UPLOAD_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH 
  || process.env.UPLOAD_DIR             
  || "/data/uploads";                   

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

interface Base64File {
  base64: string;
  filename: string;
  mimetype: string;
}

export const uploadFile = async ({ base64, filename, mimetype }: Base64File) => {
  // Validação do tipo de arquivo
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new Error(`Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_MIMETYPES.join(', ')}`);
  }

  // Remove o prefixo do base64 (ex: "data:image/jpeg;base64,")
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Validação do tamanho do arquivo
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const fileId = uuidv4();
  const fileExtension = path.extname(filename);
  const newFilename = `${fileId}${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, newFilename);
  
  // Salva o arquivo
  await fs.promises.writeFile(filePath, buffer);
  const publicBase = process.env.PUBLIC_BASE_URL || "";
  const publicUrl = `${publicBase}/uploads/${newFilename}`;

  // Cria o registro no banco de dados
  const fileRecord = await prisma.file.create({
    data: {
      id: fileId,
      filename: filename,
      path: filePath,
      url: publicUrl,
      mimetype: mimetype,
      size: buffer.length,
    },
  });

  return fileRecord;
};

export const getFileById = async (id: string) => {
  return prisma.file.findUnique({
    where: { id },
  });
};

export const deleteFile = async (id: string) => {
  const file = await prisma.file.findUnique({
    where: { id },
  });

  if (!file) {
    throw new Error('Arquivo não encontrado');
  }

  // Remove o arquivo físico
  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    console.error('Erro ao deletar arquivo físico:', error);
  }

  // Remove o registro do banco
  return prisma.file.delete({
    where: { id },
  });
}; 