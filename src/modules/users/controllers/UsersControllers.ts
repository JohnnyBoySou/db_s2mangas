import type { RequestHandler } from "express";
import * as userHandlers from "@/handlers/user";
import { handleZodError } from "@/utils/zodError";
import { createUserSchema, updateUserSchema } from "../validators/UsersValidator";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "joao.silva@example.com"
 *         username:
 *           type: string
 *           description: Nome de usuário único
 *           example: "joaosilva"
 *         emailVerified:
 *           type: boolean
 *           description: Se o email foi verificado
 *           example: true
 *         avatar:
 *           type: string
 *           format: uri
 *           description: URL do avatar do usuário
 *           example: "https://example.com/avatar.jpg"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa do perfil
 *           example: "https://example.com/cover.jpg"
 *         bio:
 *           type: string
 *           description: Biografia do usuário
 *           example: "Apaixonado por mangás e animes"
 *         birthdate:
 *           type: string
 *           format: date
 *           description: Data de nascimento
 *           example: "1990-01-15"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da conta
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *     UserCreate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           description: Nome completo do usuário
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "joao.silva@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Senha do usuário
 *           example: "senha123"
 *         username:
 *           type: string
 *           description: Nome de usuário único (opcional)
 *           example: "joaosilva"
 *         avatar:
 *           type: string
 *           format: uri
 *           description: URL do avatar do usuário
 *           example: "https://example.com/avatar.jpg"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa do perfil
 *           example: "https://example.com/cover.jpg"
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           description: Nome completo do usuário
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "joao.silva@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Nova senha do usuário
 *           example: "novaSenha123"
 *         username:
 *           type: string
 *           description: Nome de usuário único
 *           example: "joaosilva"
 *         avatar:
 *           type: string
 *           format: uri
 *           description: URL do avatar do usuário
 *           example: "https://example.com/avatar.jpg"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa do perfil
 *           example: "https://example.com/cover.jpg"
 *         bio:
 *           type: string
 *           description: Biografia do usuário
 *           example: "Apaixonado por mangás e animes"
 *         birthdate:
 *           type: string
 *           format: date
 *           description: Data de nascimento
 *           example: "1990-01-15"
 *     UserListResponse:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         total:
 *           type: number
 *           description: Total de usuários
 *           example: 50
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 5
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de sucesso
 *           example: "Usuário deletado com sucesso"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Usuário não encontrado"
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Listar usuários
 *     description: Retorna uma lista paginada de todos os usuários (apenas administradores)
 *     tags: [Usuários - Admin]
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
 *           default: 10
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
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
 * /admin/users/{id}:
 *   get:
 *     summary: Obter usuário por ID
 *     description: Retorna um usuário específico (apenas administradores)
 *     tags: [Usuários - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *         description: Usuário não encontrado
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
 * /admin/users:
 *   post:
 *     summary: Criar novo usuário
 *     description: Cria um novo usuário no sistema (apenas administradores)
 *     tags: [Usuários - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *       409:
 *         description: Email ou username já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     description: Atualiza um usuário existente (apenas administradores)
 *     tags: [Usuários - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ou username já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Deletar usuário
 *     description: Remove um usuário do sistema (apenas administradores)
 *     tags: [Usuários - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
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
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuário não encontrado
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

// Listar todos os usuários
export const listUsers: RequestHandler = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        
        const result = await userHandlers.listUsers(page, limit);
        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// Buscar usuário por ID
export const getUserById: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userHandlers.getUserById(id);
        res.json(user);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// Criar novo usuário
export const createUser: RequestHandler = async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);
        const user = await userHandlers.createUser(data);
        res.status(201).json(user);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// Atualizar usuário
export const updateUser: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        
        const updateData = {
            ...data,
            birthdate: data.birthdate ? new Date(data.birthdate) : undefined
        };
        
        const user = await userHandlers.updateUser(id, updateData);
        res.json(user);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// Deletar usuário
export const deleteUser: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await userHandlers.deleteUser(id);
        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
}; 