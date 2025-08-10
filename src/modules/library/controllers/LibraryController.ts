import { RequestHandler } from 'express';
import { getPaginationParams } from '@/utils/pagination';
import { handleZodError } from '@/utils/zodError';
import * as libraryHandlers from '../handlers/LibraryHandler';
import { upsertSchema, updateFlagsSchema } from '../validators/LibraryValidator';
import { z } from 'zod';

const toggleTypeSchema = z.enum(['progress', 'complete', 'favorite', 'following']);

/**
 * @swagger
 * components:
 *   schemas:
 *     LibraryEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da entrada da biblioteca
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         mangaId:
 *           type: string
 *           format: uuid
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         isRead:
 *           type: boolean
 *           description: Se o mangá foi lido
 *           example: true
 *         isLiked:
 *           type: boolean
 *           description: Se o mangá foi curtido
 *           example: false
 *         isFollowed:
 *           type: boolean
 *           description: Se o mangá está sendo seguido
 *           example: true
 *         isComplete:
 *           type: boolean
 *           description: Se o mangá foi completado
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *         manga:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: ID do mangá
 *             manga_uuid:
 *               type: string
 *               description: UUID do mangá
 *             cover:
 *               type: string
 *               format: uri
 *               description: URL da capa
 *             translations:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Título traduzido
 *                   language:
 *                     type: string
 *                     description: Idioma da tradução
 *               description: Traduções disponíveis
 *           description: Dados do mangá
 *     LibraryUpsert:
 *       type: object
 *       required:
 *         - mangaId
 *       properties:
 *         mangaId:
 *           type: string
 *           format: uuid
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         isRead:
 *           type: boolean
 *           description: Se o mangá foi lido
 *           example: true
 *         isLiked:
 *           type: boolean
 *           description: Se o mangá foi curtido
 *           example: false
 *         isFollowed:
 *           type: boolean
 *           description: Se o mangá está sendo seguido
 *           example: true
 *         isComplete:
 *           type: boolean
 *           description: Se o mangá foi completado
 *           example: false
 *     LibraryUpdate:
 *       type: object
 *       required:
 *         - mangaId
 *       properties:
 *         mangaId:
 *           type: string
 *           format: uuid
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         isRead:
 *           type: boolean
 *           description: Se o mangá foi lido
 *           example: true
 *         isLiked:
 *           type: boolean
 *           description: Se o mangá foi curtido
 *           example: false
 *         isFollowed:
 *           type: boolean
 *           description: Se o mangá está sendo seguido
 *           example: true
 *         isComplete:
 *           type: boolean
 *           description: Se o mangá foi completado
 *           example: false
 *     LibraryListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LibraryEntry'
 *           description: Lista de entradas da biblioteca
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de itens
 *               example: 100
 *             page:
 *               type: number
 *               description: Página atual
 *               example: 1
 *             limit:
 *               type: number
 *               description: Limite por página
 *               example: 10
 *             totalPages:
 *               type: number
 *               description: Total de páginas
 *               example: 10
 *             next:
 *               type: boolean
 *               description: Se existe próxima página
 *               example: true
 *             prev:
 *               type: boolean
 *               description: Se existe página anterior
 *               example: false
 *     MangaStatus:
 *       type: object
 *       properties:
 *         isRead:
 *           type: boolean
 *           description: Se o mangá foi lido
 *           example: true
 *         isLiked:
 *           type: boolean
 *           description: Se o mangá foi curtido
 *           example: false
 *         isFollowed:
 *           type: boolean
 *           description: Se o mangá está sendo seguido
 *           example: true
 *         isComplete:
 *           type: boolean
 *           description: Se o mangá foi completado
 *           example: false
 *     ToggleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Se a operação foi bem-sucedida
 *           example: true
 *         message:
 *           type: string
 *           description: Mensagem de confirmação
 *           example: "Status atualizado com sucesso"
 *         newStatus:
 *           type: boolean
 *           description: Novo status do flag
 *           example: true
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Tipo de biblioteca inválido"
 */

/**
 * @swagger
 * /library:
 *   post:
 *     summary: Criar ou atualizar entrada na biblioteca
 *     description: Cria uma nova entrada na biblioteca ou atualiza uma existente (upsert)
 *     tags: [Biblioteca]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LibraryUpsert'
 *     responses:
 *       200:
 *         description: Entrada criada/atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LibraryEntry'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Atualizar flags da biblioteca
 *     description: Atualiza os flags de uma entrada existente na biblioteca
 *     tags: [Biblioteca]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LibraryUpdate'
 *     responses:
 *       200:
 *         description: Flags atualizados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LibraryEntry'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Entrada não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /library/{type}:
 *   get:
 *     summary: Listar biblioteca por tipo
 *     description: Retorna uma lista paginada de mangás da biblioteca filtrados por tipo
 *     tags: [Biblioteca]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [progress, complete, favorite, following]
 *         description: Tipo de biblioteca
 *         example: "progress"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista da biblioteca retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LibraryListResponse'
 *       400:
 *         description: Tipo inválido ou parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /library/{mangaId}:
 *   delete:
 *     summary: Remover entrada da biblioteca
 *     description: Remove uma entrada específica da biblioteca do usuário
 *     tags: [Biblioteca]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do mangá
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: Entrada removida com sucesso
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Entrada não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /library/{type}/toggle/{mangaId}:
 *   post:
 *     summary: Alternar status de um flag
 *     description: Alterna o status de um flag específico (progress, complete, favorite, following) para um mangá
 *     tags: [Biblioteca]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [progress, complete, favorite, following]
 *         description: Tipo de flag para alternar
 *         example: "favorite"
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do mangá
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Status alternado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToggleResponse'
 *       400:
 *         description: Tipo inválido ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /library/status/{mangaId}:
 *   get:
 *     summary: Verificar status de um mangá
 *     description: Retorna o status atual de um mangá na biblioteca do usuário
 *     tags: [Biblioteca]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do mangá
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Status do mangá retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaStatus'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const upsertLibraryEntry: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  try {
    const body = upsertSchema.parse(req.body);
    const entry = await libraryHandlers.upsertLibraryEntry({
      userId,
      ...body
    });
    res.json(entry);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const updateLibraryEntry: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;

  try {
    const body = updateFlagsSchema.parse(req.body);
    const updated = await libraryHandlers.updateLibraryEntry({
      userId,
      ...body
    });
    res.json(updated);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const removeLibraryEntry: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const mangaId = req.params.mangaId;

  try {
    await libraryHandlers.removeLibraryEntry(userId, mangaId);
    res.status(204).send();
  } catch (err) {
    handleZodError(err, res);
  }
};

export const listLibrary: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const { take, page } = getPaginationParams(req);
  const type = req.params.type;

  try {
    const result = await libraryHandlers.listLibrary(userId, type, page, take);
    res.json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const toggleLibraryEntry: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;

    const { mangaId, type } = req.params;

    try {
        // Valida o tipo
        const validatedType = toggleTypeSchema.parse(type);
        
        const result = await libraryHandlers.toggleLibraryEntry({
            userId,
            mangaId,
            type: validatedType
        });
        res.json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const checkMangaStatus: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    const { mangaId } = req.params;

    try {
        const status = await libraryHandlers.checkMangaStatus(userId, mangaId);
        res.json(status);
    } catch (err) {
        handleZodError(err, res);
    }
};
