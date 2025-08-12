import type { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import * as categoryHandlers from "../handlers/CategoriesHandler";

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da categoria
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome da categoria
 *           example: "Ação"
 *         mangas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Manga'
 *           description: Lista de mangás nesta categoria
 *         _count:
 *           type: object
 *           properties:
 *             mangas:
 *               type: number
 *               description: Número de mangás na categoria
 *               example: 15
 *     CategoryCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome da categoria
 *           example: "Ação"
 *     CategoryUpdate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome da categoria
 *           example: "Ação"
 *     CategoryListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de categorias
 *               example: 50
 *             page:
 *               type: number
 *               description: Página atual
 *               example: 1
 *             limit:
 *               type: number
 *               description: Limite de itens por página
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
 *           example: "Categoria não encontrada"
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de sucesso
 *           example: "Categoria deletada com sucesso"
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Listar categorias
 *     description: Retorna uma lista paginada de todas as categorias
 *     tags: [Categorias]
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
 *           default: 10
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Obter categoria por ID
 *     description: Retorna uma categoria específica com seus mangás
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Criar nova categoria
 *     description: Cria uma nova categoria no sistema (apenas administradores)
 *     tags: [Categorias - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreate'
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
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
 *         description: Acesso negado - apenas administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     description: Atualiza uma categoria existente (apenas administradores)
 *     tags: [Categorias - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryUpdate'
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
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
 *         description: Acesso negado - apenas administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Deletar categoria
 *     description: Remove uma categoria do sistema (apenas administradores)
 *     tags: [Categorias - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria deletada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - apenas administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const create: RequestHandler = async (req, res) => {
    try {
        const category = await categoryHandlers.createCategory(req.body);
        res.status(201).json(category);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    try {
        const categories = await categoryHandlers.listCategories();
        res.json(categories);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const get: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await categoryHandlers.getCategoryById(id);
        res.json(category);
    } catch (error) {
        if (error instanceof Error && error.message === "Categoria não encontrada") {
            res.status(404).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
};

export const update: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const updated = await categoryHandlers.updateCategory(id, req.body);
        res.json(updated);
    } catch (error) {
        if (error instanceof Error && error.message === "Categoria não encontrada") {
            res.status(404).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
};

export const remove: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await categoryHandlers.deleteCategory(id);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "Categoria não encontrada") {
            res.status(404).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
}; 