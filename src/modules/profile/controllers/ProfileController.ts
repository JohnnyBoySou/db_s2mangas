import { RequestHandler } from 'express';
import * as profileHandler from '../handlers/ProfileHandler';
import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da conta
 *           example: "2024-01-15T10:30:00Z"
 *         isFollowing:
 *           type: boolean
 *           description: Se o usuário autenticado está seguindo este perfil
 *           example: true
 *         isLiked:
 *           type: boolean
 *           description: Se o usuário autenticado curtiu este perfil
 *           example: false
 *         collections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProfileCollection'
 *           description: Coleções públicas do usuário
 *         stats:
 *           type: object
 *           properties:
 *             libraryEntries:
 *               type: number
 *               description: Número de mangás na biblioteca
 *               example: 25
 *             likes:
 *               type: number
 *               description: Número de curtidas recebidas
 *               example: 150
 *             comments:
 *               type: number
 *               description: Número de comentários feitos
 *               example: 45
 *             followers:
 *               type: number
 *               description: Número de seguidores
 *               example: 89
 *             following:
 *               type: number
 *               description: Número de usuários seguindo
 *               example: 67
 *     ProfileCollection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID da coleção
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *         name:
 *           type: string
 *           description: Nome da coleção
 *           example: "Meus Mangás Favoritos"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da capa da coleção
 *           example: "https://example.com/collection-cover.jpg"
 *         description:
 *           type: string
 *           description: Descrição da coleção
 *           example: "Coleção dos meus mangás preferidos"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da coleção
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *         stats:
 *           type: object
 *           properties:
 *             likes:
 *               type: number
 *               description: Número de curtidas da coleção
 *               example: 12
 *             mangas:
 *               type: number
 *               description: Número de mangás na coleção
 *               example: 8
 *     ProfileListResponse:
 *       type: object
 *       properties:
 *         profiles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Profile'
 *         total:
 *           type: number
 *           description: Total de perfis
 *           example: 50
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 5
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *     SearchProfilesResponse:
 *       type: object
 *       properties:
 *         profiles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Profile'
 *         total:
 *           type: number
 *           description: Total de perfis encontrados
 *           example: 15
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 2
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *         query:
 *           type: string
 *           description: Query de busca utilizada
 *           example: "joão"
 *     SimilarProfilesResponse:
 *       type: object
 *       properties:
 *         profiles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Profile'
 *     FollowersResponse:
 *       type: object
 *       properties:
 *         followers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Profile'
 *         total:
 *           type: number
 *           description: Total de seguidores
 *           example: 89
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 9
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *     FollowingResponse:
 *       type: object
 *       properties:
 *         following:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Profile'
 *         total:
 *           type: number
 *           description: Total de usuários seguindo
 *           example: 67
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 7
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *     ToggleResponse:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *           enum: [liked, unliked, followed, unfollowed]
 *           description: Ação realizada
 *           example: "liked"
 *         message:
 *           type: string
 *           description: Mensagem de confirmação
 *           example: "Perfil curtido com sucesso"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Perfil não encontrado"
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           description: Detalhes dos erros de validação
 *           example: ["Query é obrigatória"]
 */

/**
 * @swagger
 * /profiles:
 *   get:
 *     summary: Listar perfis
 *     description: Retorna uma lista paginada de todos os perfis de usuários
 *     tags: [Perfis]
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
 *           maximum: 50
 *           default: 10
 *         description: Número de itens por página (máximo 50)
 *     responses:
 *       200:
 *         description: Lista de perfis retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileListResponse'
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
 * /profiles/search:
 *   get:
 *     summary: Buscar perfis
 *     description: Busca perfis de usuários por nome ou username
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Termo de busca (nome ou username)
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
 *           maximum: 50
 *           default: 10
 *         description: Número de itens por página (máximo 50)
 *     responses:
 *       200:
 *         description: Perfis encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchProfilesResponse'
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
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /profiles/{username}:
 *   get:
 *     summary: Obter perfil por username
 *     description: Retorna os dados completos de um perfil específico
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username do perfil
 *     responses:
 *       200:
 *         description: Perfil encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Username é obrigatório
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
 *         description: Perfil não encontrado
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
 * /profiles/{username}/like:
 *   post:
 *     summary: Curtir/descurtir perfil
 *     description: Alterna o status de curtida de um perfil
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username do perfil
 *     responses:
 *       200:
 *         description: Status de curtida alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToggleResponse'
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
 *         description: Perfil não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /profiles/{username}/follow:
 *   post:
 *     summary: Seguir/deixar de seguir perfil
 *     description: Alterna o status de seguimento de um perfil
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username do perfil
 *     responses:
 *       200:
 *         description: Status de seguimento alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToggleResponse'
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
 *         description: Perfil não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /profiles/{userId}/similar:
 *   get:
 *     summary: Obter perfis similares
 *     description: Retorna perfis similares baseados nos interesses do usuário
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário para encontrar perfis similares
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Número de perfis similares (máximo 20)
 *     responses:
 *       200:
 *         description: Perfis similares encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimilarProfilesResponse'
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
 * /profiles/{userId}/followers:
 *   get:
 *     summary: Obter seguidores
 *     description: Retorna a lista de seguidores de um usuário
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
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
 *           maximum: 50
 *           default: 10
 *         description: Número de itens por página (máximo 50)
 *     responses:
 *       200:
 *         description: Seguidores retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowersResponse'
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
 * /profiles/{userId}/following:
 *   get:
 *     summary: Obter usuários seguindo
 *     description: Retorna a lista de usuários que um usuário está seguindo
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
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
 *           maximum: 50
 *           default: 10
 *         description: Número de itens por página (máximo 50)
 *     responses:
 *       200:
 *         description: Usuários seguindo retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowingResponse'
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

// Schemas de validação
const searchProfilesSchema = z.object({
  q: z.string().min(1, 'Query é obrigatória').max(100, 'Query muito longa'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 10, 50) : 10)
});

const similarProfilesSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido'),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 10, 20) : 10)
});

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!username) {
      res.status(400).json({ error: 'Username é obrigatório' });
      return;
    }

    const profile = await profileHandler.getProfileData(username, userId);
    res.json(profile);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const likeProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const like = await profileHandler.likeProfile(userId, username);
    res.status(201).json(like);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const searchProfiles: RequestHandler = async (req, res) => {
  try {
    const validatedQuery = searchProfilesSchema.parse(req.query);
    const userId = req.user?.id;

    const result = await profileHandler.searchProfiles({
      query: validatedQuery.q,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      authenticatedUserId: userId
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors.map(e => e.message)
      });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const getSimilarProfiles: RequestHandler = async (req, res) => {
  try {
    const validatedParams = similarProfilesSchema.parse({
      userId: req.params.userId,
      limit: req.query.limit as string
    });
    const authenticatedUserId = req.user?.id;

    const profiles = await profileHandler.getSimilarProfiles({
      userId: validatedParams.userId,
      authenticatedUserId,
      limit: validatedParams.limit
    });

    res.json({ profiles });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors.map(e => e.message)
      });
      return;
    }
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const unlikeProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;


    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    await profileHandler.unlikeProfile(userId, username);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const toggleFollowProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    const result = await profileHandler.toggleFollowProfile(userId, username);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const toggleLikeProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!userId || !username) {
      throw new Error('Usuário não autenticado');
    }
    const result = await profileHandler.toggleLikeProfile(userId, username);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const listProfiles: RequestHandler = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50); // Máximo 50 por página
    
    const result = await profileHandler.listProfiles(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Adicionar novos schemas de validação após os existentes
const followersSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 10, 50) : 10)
});

const followingSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 10, 50) : 10)
});

export const getFollowers: RequestHandler = async (req, res) => {
  try {
    const validatedParams = followersSchema.parse({
      userId: req.params.userId,
      page: req.query.page as string,
      limit: req.query.limit as string
    });
    const authenticatedUserId = req.user?.id;

    const result = await profileHandler.getFollowers({
      userId: validatedParams.userId,
      page: validatedParams.page,
      limit: validatedParams.limit,
      authenticatedUserId
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors.map(e => e.message)
      });
      return;
    }
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const getFollowing: RequestHandler = async (req, res) => {
  try {
    const validatedParams = followingSchema.parse({
      userId: req.params.userId,
      page: req.query.page as string,
      limit: req.query.limit as string
    });
    const authenticatedUserId = req.user?.id;

    const result = await profileHandler.getFollowing({
      userId: validatedParams.userId,
      page: validatedParams.page,
      limit: validatedParams.limit,
      authenticatedUserId
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors.map(e => e.message)
      });
      return;
    }
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};