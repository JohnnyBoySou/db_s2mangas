import { RequestHandler } from 'express';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';
import {
    createComment,
    listComments,
    updateComment,
    deleteComment,
} from '../handlers/CommentHandler';
import { commentSchema, commentIdSchema } from '../validators/CommentValidator';

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do comentário
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         message:
 *           type: string
 *           description: Conteúdo do comentário
 *           example: "Muito bom esse mangá! Recomendo para todos."
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário que fez o comentário
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         mangaId:
 *           type: string
 *           format: uuid
 *           description: ID do mangá comentado
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID do comentário pai (para respostas)
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do comentário
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: ID do usuário
 *             name:
 *               type: string
 *               description: Nome do usuário
 *               example: "João Silva"
 *             avatar:
 *               type: string
 *               nullable: true
 *               description: URL do avatar do usuário
 *               example: "https://example.com/avatar.jpg"
 *             username:
 *               type: string
 *               description: Nome de usuário
 *               example: "joaosilva"
 *         parent:
 *           type: object
 *           nullable: true
 *           description: Comentário pai (para respostas)
 *           $ref: '#/components/schemas/Comment'
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *           description: Lista de respostas ao comentário
 *     CommentCreate:
 *       type: object
 *       required:
 *         - content
 *         - mangaId
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           description: Conteúdo do comentário
 *           example: "Muito bom esse mangá! Recomendo para todos."
 *         mangaId:
 *           type: string
 *           minLength: 1
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID do comentário pai (para respostas)
 *           example: null
 *     CommentUpdate:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           description: Novo conteúdo do comentário
 *           example: "Muito bom esse mangá! Recomendo para todos."
 *     CommentListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *           description: Lista de comentários
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de comentários
 *               example: 50
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
 *               example: 5
 *             next:
 *               type: boolean
 *               description: Se existe próxima página
 *               example: true
 *             prev:
 *               type: boolean
 *               description: Se existe página anterior
 *               example: false
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Comentário não encontrado"
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Criar novo comentário
 *     description: Cria um novo comentário em um mangá específico
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreate'
 *     responses:
 *       201:
 *         description: Comentário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
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

/**
 * @swagger
 * /comments/{mangaId}:
 *   get:
 *     summary: Listar comentários de um mangá
 *     description: Retorna uma lista paginada de comentários de um mangá específico
 *     tags: [Comentários]
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
 *           default: 10
 *         description: Limite por página
 *     responses:
 *       200:
 *         description: Lista de comentários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentListResponse'
 *       400:
 *         description: ID do mangá é obrigatório
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
 * /comments/{id}:
 *   put:
 *     summary: Atualizar comentário
 *     description: Atualiza o conteúdo de um comentário existente (apenas o autor)
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do comentário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentUpdate'
 *     responses:
 *       200:
 *         description: Comentário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
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
 *         description: Sem permissão para editar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comentário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Deletar comentário
 *     description: Remove um comentário (apenas o autor)
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do comentário
 *     responses:
 *       204:
 *         description: Comentário deletado com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão para deletar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comentário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const create: RequestHandler = async (req, res) => {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        const comment = await createComment({
            userId,
            ...parsed.data
        });
        res.status(201).json(comment);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    const { mangaId } = req.params;
    if (!mangaId) {
        res.status(400).json({ error: "ID do mangá é obrigatório" });
        return;
    }

    const { page, take } = getPaginationParams(req);

    try {
        const result = await listComments(mangaId, page, take);
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const update: RequestHandler = async (req, res) => {
    const parsed = commentIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const contentSchema = commentSchema.pick({ content: true });
    const contentParsed = contentSchema.safeParse(req.body);
    if (!contentParsed.success) {
        res.status(400).json(contentParsed.error);
        return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        const comment = await updateComment(parsed.data.id, userId, contentParsed.data.content);
        res.json(comment);
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Comentário não encontrado.') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para editar este comentário.') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};

export const remove: RequestHandler = async (req, res) => {
    const parsed = commentIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json(parsed.error);
        return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
        res.status(401).json({ error: "Não autorizado" });
        return;
    }

    try {
        await deleteComment(parsed.data.id, userId);
        res.status(204).send();
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Comentário não encontrado.') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message === 'Você não tem permissão para deletar este comentário.') {
                res.status(403).json({ error: err.message });
                return;
            }
        }
        handleZodError(err, res);
    }
};
