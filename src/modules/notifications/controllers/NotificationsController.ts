import { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from "@/utils/pagination";
import * as notificationHandlers from "../handlers/NotificationsHandler";
import { 
  createNotificationSchema, 
  updateNotificationSchema, 
  patchNotificationSchema 
} from "../validators/NotificationValidators";

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da notificação
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         title:
 *           type: string
 *           description: Título da notificação
 *           example: "Novo Capítulo Disponível"
 *         message:
 *           type: string
 *           description: Mensagem da notificação
 *           example: "O capítulo 123 do mangá One Piece foi publicado"
 *         type:
 *           type: string
 *           description: Tipo da notificação
 *           example: "chapter_release"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa da notificação
 *           example: "https://example.com/cover.jpg"
 *         data:
 *           type: object
 *           description: Dados adicionais da notificação (JSON)
 *           example: {"mangaId": "123e4567-e89b-12d3-a456-426614174001", "chapterNumber": 123}
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da notificação
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *     NotificationCreate:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Título da notificação
 *           example: "Novo Capítulo Disponível"
 *         message:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Mensagem da notificação
 *           example: "O capítulo 123 do mangá One Piece foi publicado"
 *         type:
 *           type: string
 *           description: Tipo da notificação
 *           example: "chapter_release"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa da notificação
 *           example: "https://example.com/cover.jpg"
 *     NotificationUpdate:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Título da notificação
 *           example: "Novo Capítulo Disponível"
 *         message:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Mensagem da notificação
 *           example: "O capítulo 123 do mangá One Piece foi publicado"
 *         type:
 *           type: string
 *           description: Tipo da notificação
 *           example: "chapter_release"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa da notificação
 *           example: "https://example.com/cover.jpg"
 *     NotificationPatch:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Título da notificação
 *           example: "Novo Capítulo Disponível"
 *         message:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Mensagem da notificação
 *           example: "O capítulo 123 do mangá One Piece foi publicado"
 *         type:
 *           type: string
 *           description: Tipo da notificação
 *           example: "chapter_release"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa da notificação
 *           example: "https://example.com/cover.jpg"
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         notifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         total:
 *           type: number
 *           description: Total de notificações
 *           example: 50
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 5
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Notificação não encontrada"
 *         message:
 *           type: string
 *           description: Mensagem de erro (alternativa)
 *           example: "Notificação não encontrada"
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Listar notificações do usuário
 *     description: Retorna uma lista paginada das notificações do usuário autenticado
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de notificações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         description: Não autorizado
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
 * /notifications/{notificationId}:
 *   get:
 *     summary: Obter notificação por ID
 *     description: Retorna uma notificação específica
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada
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
 * /admin/notifications:
 *   get:
 *     summary: Listar todas as notificações (Admin)
 *     description: Retorna uma lista paginada de todas as notificações (apenas administradores)
 *     tags: [Notificações - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de notificações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
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
 * /admin/notifications:
 *   post:
 *     summary: Criar nova notificação (Admin)
 *     description: Cria uma nova notificação no sistema (apenas administradores)
 *     tags: [Notificações - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationCreate'
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
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
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/notifications/{notificationId}:
 *   put:
 *     summary: Atualizar notificação completa (Admin)
 *     description: Atualiza uma notificação existente com todos os campos (apenas administradores)
 *     tags: [Notificações - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationUpdate'
 *     responses:
 *       200:
 *         description: Notificação atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
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
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/notifications/{notificationId}:
 *   patch:
 *     summary: Atualizar notificação parcial (Admin)
 *     description: Atualiza uma notificação existente com campos específicos (apenas administradores)
 *     tags: [Notificações - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationPatch'
 *     responses:
 *       200:
 *         description: Notificação atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
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
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/notifications/{notificationId}:
 *   delete:
 *     summary: Deletar notificação (Admin)
 *     description: Remove uma notificação do sistema (apenas administradores)
 *     tags: [Notificações - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     responses:
 *       204:
 *         description: Notificação deletada com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Listar todas as notificações (apenas admin)
export const listAllNotifications: RequestHandler = async (req, res) => {
  const { take, page } = getPaginationParams(req);

  try {
    const result = await notificationHandlers.listNotifications(page, take);
    res.json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

// Criar notificação (apenas admin)
export const createNotification: RequestHandler = async (req, res) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);
    const notification = await notificationHandlers.createNotification(validatedData);
    res.status(201).json(notification);
  } catch (err) {
    console.log(err)
    handleZodError(err, res);
  }
};

// Deletar notificação (apenas admin)
export const deleteNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    await notificationHandlers.deleteNotification(notificationId);
    res.status(204).send();
  } catch (err) {
    handleZodError(err, res);
  }
};

// Buscar uma única notificação
export const getNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await notificationHandlers.getNotification(notificationId);
    res.json(notification);
  } catch (err) {
    if (err instanceof Error && err.message === "Notificação não encontrada") {
      res.status(404).json({ message: err.message });
      return;
    }
    handleZodError(err, res);
  }
};

// Atualizar notificação completa (PUT) - apenas admin
export const updateNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const validatedData = updateNotificationSchema.parse(req.body);
    const notification = await notificationHandlers.updateNotification(notificationId, validatedData);
    res.json(notification);
  } catch (err) {
    if (err instanceof Error && err.message === "Notificação não encontrada") {
      res.status(404).json({ message: err.message });
      return;
    }
    handleZodError(err, res);
  }
};

// Atualizar notificação parcial (PATCH) - apenas admin
export const patchNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const validatedData = patchNotificationSchema.parse(req.body);
    const notification = await notificationHandlers.patchNotification(notificationId, validatedData);
    res.json(notification);
  } catch (err) {
    if (err instanceof Error && err.message === "Notificação não encontrada") {
      res.status(404).json({ message: err.message });
      return;
    }
    handleZodError(err, res);
  }
};