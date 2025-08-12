import type { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { updateUserSchema, loginSchema, registerSchema  } from "../validators/AuthSchema";
import * as authHandlers from "../handlers/AuthHandler";

type VerifyEmailBody = { email: string; code: string };

// ✅ Criação de usuário
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     description: Cria uma nova conta de usuário no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do usuário
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *                 example: "joao@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Senha do usuário
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário criado com sucesso"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register: RequestHandler = async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authHandlers.register(data);
        res.status(201).json(result);
    } catch (error: unknown) {
        console.log(error)
        handleZodError(error, res);
    }
};

// ✅ Verificar email do usuário
/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verificar código de email
 *     description: Verifica o código enviado por email para ativar a conta
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *                 example: "joao@example.com"
 *               code:
 *                 type: string
 *                 description: Código de verificação enviado por email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verificado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verificado com sucesso"
 *       400:
 *         description: Código inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const verifyEmailCode: RequestHandler<{}, any, VerifyEmailBody> = async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await authHandlers.verifyEmailCode(email, code);
        res.json(result);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// ✅ Login e token JWT
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Fazer login
 *     description: Autentica o usuário e retorna um token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *                 example: "joao@example.com"
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login: RequestHandler = async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authHandlers.login(data);
        res.status(200).json(result);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// ✅ Dados do usuário
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obter perfil do usuário
 *     description: Retorna os dados do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso
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
 */
export const getProfile: RequestHandler = async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const result = await authHandlers.getProfile(userId);
        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// ✅ Editar a propria conta do usuário
/**
 * @swagger
 * /auth/me:
 *   patch:
 *     summary: Atualizar perfil do usuário
 *     description: Atualiza os dados do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do usuário
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *                 example: "joao@example.com"
 *               username:
 *                 type: string
 *                 description: Nome de usuário
 *                 example: "joaosilva"
 *               avatar:
 *                 type: string
 *                 description: URL do avatar
 *                 example: "https://example.com/avatar.jpg"
 *               cover:
 *                 type: string
 *                 description: URL da imagem de capa
 *                 example: "https://example.com/cover.jpg"
 *               bio:
 *                 type: string
 *                 description: Biografia do usuário
 *                 example: "Apaixonado por mangás"
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento
 *                 example: "1990-01-01"
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
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
 */
export const updateMe: RequestHandler = async (req, res) => {
    try {
        //TODO - ADICIONAR CATEGORIAS E LINGUAGENS
        const userId = req.user?.id;
        const data = updateUserSchema.parse(req.body);
        const result = await authHandlers.updateMe(userId as string, {
            name: data.name,
            email: data.email,
            username: data.username,
            avatar: data.avatar,
            cover: data.cover,
            bio: data.bio || undefined,
            birthdate: data.birthdate,
            //categories: data.categories?.map(({ id, name }) => ({ id, name: name ?? undefined })) || [],
            //languages: data.languages?.map(({ id, name, code  }) => ({ id, name: name ?? undefined, code })) || []
        });
        res.json(result);
    } catch (error: unknown) {
        console.error('Error updating user profile:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
};

// ✅ Deletar a propria conta do usuário
/**
 * @swagger
 * /auth/me:
 *   delete:
 *     summary: Deletar conta do usuário
 *     description: Remove permanentemente a conta do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conta deletada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Conta deletada com sucesso"
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const deleteMe: RequestHandler = async (req, res) => {
    try {
        const userId = (req as any).user?.id;
        const result = await authHandlers.deleteMe(userId);
        res.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// ✅ Login com Google
/*
export const googleSignIn: RequestHandler<{}, any, GoogleSignInBody> = async (req, res) => {
    console.log("google comecou")
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: "Token do Google é obrigatório" });
            return;
        }
        
        const result = await authHandlers.googleSignIn(token);
        res.status(200).json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};
*/