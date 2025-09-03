import { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from "@/utils/pagination";
import * as reviewHandlers from "../handlers/ReviewHandler";
import { createReviewSchema, updateReviewSchema } from "../validators/ReviewSchemas";

/**
 * @swagger
 * components:
 *   schemas:
 *     Rating:
 *       type: object
 *       properties:
 *         art:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da arte
 *           example: 8
 *         story:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da história
 *           example: 9
 *         characters:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos personagens
 *           example: 8
 *         worldbuilding:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do mundo
 *           example: 7
 *         pacing:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do ritmo
 *           example: 8
 *         emotion:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação emocional
 *           example: 9
 *         originality:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da originalidade
 *           example: 7
 *         dialogues:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos diálogos
 *           example: 8
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID do usuário
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome do usuário
 *           example: "João Silva"
 *         username:
 *           type: string
 *           description: Nome de usuário
 *           example: "joaosilva"
 *         avatar:
 *           type: string
 *           format: uri
 *           description: URL do avatar
 *           example: "https://example.com/avatar.jpg"
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da review
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Título da review
 *           example: "Uma obra-prima do gênero"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação geral
 *           example: 8.5
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           description: Conteúdo da review
 *           example: "Esta é uma review detalhada sobre o mangá..."
 *         art:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da arte
 *           example: 8
 *         story:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da história
 *           example: 9
 *         characters:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos personagens
 *           example: 8
 *         worldbuilding:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do mundo
 *           example: 7
 *         pacing:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do ritmo
 *           example: 8
 *         emotion:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação emocional
 *           example: 9
 *         originality:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da originalidade
 *           example: 7
 *         dialogues:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos diálogos
 *           example: 8
 *         upvotes:
 *           type: number
 *           description: Número de upvotes
 *           example: 15
 *         downvotes:
 *           type: number
 *           description: Número de downvotes
 *           example: 2
 *         userVote:
 *           type: string
 *           enum: ["upvote", "downvote", null]
 *           description: Voto do usuário atual
 *           example: "upvote"
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
 *         user:
 *           $ref: '#/components/schemas/User'
 *     ReviewCreate:
 *       type: object
 *       required:
 *         - mangaId
 *         - title
 *         - rating
 *         - content
 *         - art
 *         - story
 *         - characters
 *         - worldbuilding
 *         - pacing
 *         - emotion
 *         - originality
 *         - dialogues
 *       properties:
 *         mangaId:
 *           type: string
 *           format: uuid
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Título da review
 *           example: "Uma obra-prima do gênero"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação geral
 *           example: 8.5
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           description: Conteúdo da review
 *           example: "Esta é uma review detalhada sobre o mangá..."
 *         art:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da arte
 *           example: 8
 *         story:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da história
 *           example: 9
 *         characters:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos personagens
 *           example: 8
 *         worldbuilding:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do mundo
 *           example: 7
 *         pacing:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do ritmo
 *           example: 8
 *         emotion:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação emocional
 *           example: 9
 *         originality:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da originalidade
 *           example: 7
 *         dialogues:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos diálogos
 *           example: 8
 *     ReviewUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Título da review
 *           example: "Uma obra-prima do gênero"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação geral
 *           example: 8.5
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           description: Conteúdo da review
 *           example: "Esta é uma review detalhada sobre o mangá..."
 *         art:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da arte
 *           example: 8
 *         story:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da história
 *           example: 9
 *         characters:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos personagens
 *           example: 8
 *         worldbuilding:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do mundo
 *           example: 7
 *         pacing:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação do ritmo
 *           example: 8
 *         emotion:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação emocional
 *           example: 9
 *         originality:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação da originalidade
 *           example: 7
 *         dialogues:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Avaliação dos diálogos
 *           example: 8
 *     ReviewListResponse:
 *       type: object
 *       properties:
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         total:
 *           type: number
 *           description: Total de reviews
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
 *           example: "Você já fez uma review para este manga"
 *         message:
 *           type: string
 *           description: Mensagem de erro (alternativa)
 *           example: "Review não encontrada"
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Criar nova review
 *     description: Cria uma nova review para um mangá
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewCreate'
 *     responses:
 *       201:
 *         description: Review criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Dados inválidos ou review já existe
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
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /reviews/{reviewId}:
 *   put:
 *     summary: Atualizar review
 *     description: Atualiza uma review existente
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewUpdate'
 *     responses:
 *       200:
 *         description: Review atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
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
 *         description: Review não encontrada
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
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Deletar review
 *     description: Remove uma review do sistema
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da review
 *     responses:
 *       204:
 *         description: Review deletada com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review não encontrada
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
 * /mangas/{mangaId}/reviews:
 *   get:
 *     summary: Listar reviews de um mangá
 *     description: Retorna uma lista paginada das reviews de um mangá específico
 *     tags: [Reviews]
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
 *           default: 20
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de reviews retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewListResponse'
 *       404:
 *         description: Mangá não encontrado
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
 * /mangas/{mangaId}/reviews/user:
 *   get:
 *     summary: Obter review do usuário para um mangá
 *     description: Retorna a review do usuário autenticado para um mangá específico
 *     tags: [Reviews]
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
 *     responses:
 *       200:
 *         description: Review do usuário encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review não encontrada
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
 * /reviews/{reviewId}/upvote:
 *   post:
 *     summary: Alternar upvote em uma review
 *     description: Adiciona ou remove um upvote em uma review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da review
 *     responses:
 *       200:
 *         description: Upvote alternado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review não encontrada
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
 * /reviews/{reviewId}/downvote:
 *   post:
 *     summary: Alternar downvote em uma review
 *     description: Adiciona ou remove um downvote em uma review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da review
 *     responses:
 *       200:
 *         description: Downvote alternado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review não encontrada
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
 * /reviews/{reviewId}:
 *   get:
 *     summary: Obter review por ID
 *     description: Retorna uma review específica por ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da review
 *     responses:
 *       200:
 *         description: Review encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       404:
 *         description: Review não encontrada
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

export const createReview: RequestHandler = async (req, res) => {
    try {
        const data = createReviewSchema.parse(req.body);
        const userId = req.user!.id;

        const review = await reviewHandlers.createReview({
            ...data,
            userId
        });

        res.status(201).json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const updateReview: RequestHandler = async (req, res) => {
    try {
        const data = updateReviewSchema.parse(req.body);
        const { reviewId } = req.params;

        const review = await reviewHandlers.updateReview(reviewId, data);

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const deleteReview: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;

        await reviewHandlers.deleteReview(reviewId);

        res.status(204).send();
    } catch (error) {
        handleZodError(error, res);
    }
};

export const getMangaReviews: RequestHandler = async (req, res) => {
    try {
        const { mangaId } = req.params;
        const { page, take } = getPaginationParams(req);

        const reviews = await reviewHandlers.getMangaReviews(mangaId, page, take);

        res.json(reviews);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const getUserReview: RequestHandler = async (req, res) => {
    try {
        const { mangaId } = req.params;
        const userId = req.user!.id;

        const review = await reviewHandlers.getUserReview(userId, mangaId);

        if (!review) {
            res.status(404).json({ message: "Review não encontrada" });
            return 
        }

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const toggleUpvote: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user!.id;

        const review = await reviewHandlers.toggleUpvote(userId, reviewId);

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const toggleDownvote: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user!.id;

        const review = await reviewHandlers.toggleDownvote(userId, reviewId);

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const getReview: RequestHandler = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await reviewHandlers.getReview(reviewId);

        if (!review) {
            res.status(404).json({ message: "Review não encontrada" });
            return;
        }

        res.json(review);
    } catch (error) {
        handleZodError(error, res);
    }
};

/**
 * @swagger
 * /mangas/{mangaId}/reviews/stats:
 *   get:
 *     summary: Obter overview das reviews de um mangá
 *     description: Retorna estatísticas e médias de todas as avaliações de um mangá específico
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do mangá
 *     responses:
 *       200:
 *         description: Overview das reviews retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReviews:
 *                   type: number
 *                   description: Número total de reviews
 *                   example: 25
 *                 averages:
 *                   type: object
 *                   properties:
 *                     rating:
 *                       type: number
 *                       description: Média da avaliação geral
 *                       example: 8.5
 *                     art:
 *                       type: number
 *                       description: Média da avaliação da arte
 *                       example: 8.2
 *                     story:
 *                       type: number
 *                       description: Média da avaliação da história
 *                       example: 8.8
 *                     characters:
 *                       type: number
 *                       description: Média da avaliação dos personagens
 *                       example: 8.3
 *                     worldbuilding:
 *                       type: number
 *                       description: Média da avaliação do worldbuilding
 *                       example: 7.9
 *                     pacing:
 *                       type: number
 *                       description: Média da avaliação do ritmo
 *                       example: 8.1
 *                     emotion:
 *                       type: number
 *                       description: Média da avaliação emocional
 *                       example: 8.7
 *                     originality:
 *                       type: number
 *                       description: Média da avaliação da originalidade
 *                       example: 7.8
 *                     dialogues:
 *                       type: number
 *                       description: Média da avaliação dos diálogos
 *                       example: 8.4
 *       404:
 *         description: Mangá não encontrado
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
export const getReviewOverview: RequestHandler = async (req, res) => {
    try {
        const { mangaId } = req.params;

        const overview = await reviewHandlers.getReviewOverview(mangaId);

        res.json(overview);
    } catch (error) {
        handleZodError(error, res);
    }
};