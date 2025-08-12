import { RequestHandler } from "express";
import * as fileHandler from "../handlers/FilesHandler";
import { cleanOrphanFiles } from "@/utils/cleanOrphanFiles";
import { uploadFileSchema } from "../validators/FilesValidator";
import { handleZodError } from '@/utils/zodError';

/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do arquivo
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         filename:
 *           type: string
 *           description: Nome original do arquivo
 *           example: "imagem.jpg"
 *         path:
 *           type: string
 *           description: Caminho físico do arquivo no servidor
 *           example: "/app/uploads/123e4567-e89b-12d3-a456-426614174000.jpg"
 *         url:
 *           type: string
 *           format: uri
 *           description: URL pública para acessar o arquivo
 *           example: "/uploads/123e4567-e89b-12d3-a456-426614174000.jpg"
 *         mimetype:
 *           type: string
 *           description: Tipo MIME do arquivo
 *           example: "image/jpeg"
 *         size:
 *           type: number
 *           description: Tamanho do arquivo em bytes
 *           example: 1024000
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do arquivo
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *     FileUpload:
 *       type: object
 *       required:
 *         - base64
 *         - filename
 *         - mimetype
 *       properties:
 *         base64:
 *           type: string
 *           description: Conteúdo do arquivo em formato base64
 *           example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
 *         filename:
 *           type: string
 *           minLength: 1
 *           description: Nome do arquivo com extensão
 *           example: "imagem.jpg"
 *         mimetype:
 *           type: string
 *           minLength: 1
 *           description: Tipo MIME do arquivo
 *           enum: ["image/jpeg", "image/png", "image/gif", "image/webp"]
 *           example: "image/jpeg"
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do arquivo
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         filename:
 *           type: string
 *           description: Nome original do arquivo
 *           example: "imagem.jpg"
 *         url:
 *           type: string
 *           format: uri
 *           description: URL pública para acessar o arquivo
 *           example: "/uploads/123e4567-e89b-12d3-a456-426614174000.jpg"
 *         mimetype:
 *           type: string
 *           description: Tipo MIME do arquivo
 *           example: "image/jpeg"
 *         size:
 *           type: number
 *           description: Tamanho do arquivo em bytes
 *           example: 1024000
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do arquivo
 *           example: "2024-01-15T10:30:00Z"
 *     CleanupResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de confirmação da limpeza
 *           example: "Limpeza de arquivos órfãos concluída com sucesso"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Arquivo não encontrado"
 *         message:
 *           type: string
 *           description: Mensagem de erro (alternativa)
 *           example: "Erro interno do servidor"
 */

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Fazer upload de arquivo
 *     description: Faz upload de um arquivo em formato base64 para o servidor
 *     tags: [Arquivos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FileUpload'
 *     responses:
 *       201:
 *         description: Arquivo enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       400:
 *         description: Dados inválidos ou arquivo não permitido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: Arquivo muito grande (máximo 5MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Obter arquivo por ID
 *     description: Retorna informações de um arquivo específico
 *     tags: [Arquivos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do arquivo
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Arquivo encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       404:
 *         description: Arquivo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Deletar arquivo
 *     description: Remove um arquivo do servidor e do banco de dados
 *     tags: [Arquivos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do arquivo
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: Arquivo deletado com sucesso
 *       404:
 *         description: Arquivo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /files/cleanup:
 *   post:
 *     summary: Limpar arquivos órfãos
 *     description: Remove arquivos físicos que não possuem registro no banco de dados
 *     tags: [Arquivos]
 *     responses:
 *       200:
 *         description: Limpeza concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CleanupResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const uploadFile: RequestHandler = async (req, res) => {
  try {
    const validatedData = uploadFileSchema.parse(req.body);
    const file = await fileHandler.uploadFile(validatedData);
    res.status(201).json(file);
  } catch (error: any) {
    handleZodError(error, res);
    res.status(400).json({ error: error.message });
  }
};

export const getFileById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await fileHandler.getFileById(id);

    if (!file) {
      res.status(404).json({ error: "Arquivo não encontrado" });
      return;
    }

    res.json(file);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await fileHandler.deleteFile(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === "Arquivo não encontrado") {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const cleanOrphanFilesEndpoint: RequestHandler = async (req, res) => {
  try {
    await cleanOrphanFiles();
    res
      .status(200)
      .json({ message: "Limpeza de arquivos órfãos concluída com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
