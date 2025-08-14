import { RequestHandler } from 'express';
import { getPaginationParams } from '@/utils/pagination';
import {
  getRecentMangas,
  getMostViewedMangas,
  getMostLikedMangas,
  getFeedForUser,
  getIARecommendations,
  getMangasByCategories as getMangasByCategoriesHandler,
  getDiscoverStats
} from '../handlers/DiscoverHandler';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProcessedManga:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         manga_uuid:
 *           type: string
 *           description: UUID do mangá
 *           example: "manga-123"
 *         title:
 *           type: string
 *           description: Título do mangá no idioma especificado
 *           example: "One Piece"
 *         description:
 *           type: string
 *           description: Descrição do mangá no idioma especificado
 *           example: "Uma aventura épica sobre piratas"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da capa do mangá
 *           example: "https://example.com/cover.jpg"
 *         views_count:
 *           type: number
 *           description: Número de visualizações
 *           example: 1500
 *         likes_count:
 *           type: number
 *           description: Número de curtidas
 *           example: 250
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID da categoria
 *               name:
 *                 type: string
 *                 description: Nome da categoria
 *           description: Categorias do mangá
 *           example: [
 *             {"id": "cat-1", "name": "Ação"},
 *             {"id": "cat-2", "name": "Aventura"}
 *           ]
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total de itens
 *           example: 100
 *         page:
 *           type: number
 *           description: Página atual
 *           example: 1
 *         limit:
 *           type: number
 *           description: Limite por página
 *           example: 10
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 10
 *         next:
 *           type: boolean
 *           description: Se existe próxima página
 *           example: true
 *         prev:
 *           type: boolean
 *           description: Se existe página anterior
 *           example: false
 *     DiscoverResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProcessedManga'
 *           description: Lista de mangás
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *     DiscoverStats:
 *       type: object
 *       properties:
 *         totalMangas:
 *           type: number
 *           description: Total de mangás no sistema
 *           example: 5000
 *         averageMangasPerCategory:
 *           type: number
 *           description: Média de mangás por categoria
 *           example: 125
 *     HealthCheck:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy]
 *           description: Status do serviço
 *           example: "healthy"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp da verificação
 *           example: "2024-01-15T10:30:00Z"
 *         service:
 *           type: string
 *           description: Nome do serviço
 *           example: "discover"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Erro interno do servidor"
 */

/**
 * @swagger
 * /discover/recents:
 *   get:
 *     summary: Obter mangás recentes
 *     description: Retorna uma lista de mangás mais recentes ordenados por data de criação
 *     tags: [Discover]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           enum: [pt, en, es, fr, de, ja]
 *           default: "en"
 *         description: Idioma para traduções
 *         example: "pt"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de mangás recentes retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscoverResponse'
 *       400:
 *         description: Parâmetros inválidos
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
 * /discover/views:
 *   get:
 *     summary: Obter mangás mais vistos
 *     description: Retorna uma lista de mangás ordenados por número de visualizações
 *     tags: [Discover]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           enum: [pt, en, es, fr, de, ja]
 *           default: "en"
 *         description: Idioma para traduções
 *         example: "pt"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de mangás mais vistos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscoverResponse'
 *       400:
 *         description: Parâmetros inválidos
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
 * /discover/likes:
 *   get:
 *     summary: Obter mangás mais curtidos
 *     description: Retorna uma lista de mangás ordenados por número de curtidas
 *     tags: [Discover]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           enum: [pt, en, es, fr, de, ja]
 *           default: "en"
 *         description: Idioma para traduções
 *         example: "pt"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de mangás mais curtidos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscoverResponse'
 *       400:
 *         description: Parâmetros inválidos
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
 * /discover/feed:
 *   get:
 *     summary: Obter feed personalizado
 *     description: Retorna uma lista de mangás personalizada baseada nas preferências do usuário
 *     tags: [Discover]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           enum: [pt, en, es, fr, de, ja]
 *           default: "en"
 *         description: Idioma para traduções
 *         example: "pt"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Feed personalizado retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscoverResponse'
 *       400:
 *         description: Parâmetros inválidos
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
 * /discover/ia:
 *   get:
 *     summary: Obter recomendações de IA
 *     description: Retorna recomendações baseadas em IA para o usuário
 *     tags: [Discover]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           enum: [pt, en, es, fr, de, ja]
 *           default: "en"
 *         description: Idioma para traduções
 *         example: "pt"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Recomendações de IA retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscoverResponse'
 *       400:
 *         description: Parâmetros inválidos
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
 * /discover/categories/{categoryIds}:
 *   get:
 *     summary: Obter mangás por categorias
 *     description: Retorna uma lista de mangás de categorias específicas
 *     tags: [Discover]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryIds
 *         required: true
 *         schema:
 *           type: string
 *         description: IDs das categorias separados por vírgula
 *         example: "cat-1,cat-2,cat-3"
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           enum: [pt, en, es, fr, de, ja]
 *           default: "en"
 *         description: Idioma para traduções
 *         example: "pt"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *         example: 1
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de mangás por categorias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscoverResponse'
 *       400:
 *         description: Parâmetros inválidos
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
 * /discover/stats:
 *   get:
 *     summary: Obter estatísticas de discover
 *     description: Retorna estatísticas gerais do sistema de discover (admin only)
 *     tags: [Discover]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           enum: [pt, en, es, fr, de, ja]
 *           default: "en"
 *         description: Idioma para traduções
 *         example: "pt"
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscoverStats'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /discover/health:
 *   get:
 *     summary: Health check
 *     description: Verifica o status do serviço de discover
 *     tags: [Discover]
 *     responses:
 *       200:
 *         description: Serviço saudável
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Serviço não saudável
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */

class DiscoverController {
  /**
   * GET /discover/recents
   * Retorna mangás recentes
   */
  static getRecent: RequestHandler = async (req, res) => {
    try {
      const { page, take } = getPaginationParams(req);
      const language = (req.query.lg as string) || 'pt-BR';
      
      const result = await getRecentMangas({
        page,
        take,
        language
      });
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/views
   * Retorna mangás mais vistos
   */
  static getMostViewed: RequestHandler = async (req, res) => {
    try {
      const { page, take } = getPaginationParams(req);
      const language = (req.query.lg as string) || 'pt-BR';
      
      const result = await getMostViewedMangas({
        page,
        take,
        language
      });
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/likes
   * Retorna mangás mais curtidos
   */
  static getMostLiked: RequestHandler = async (req, res) => {
    try {
      const { page, take } = getPaginationParams(req);
      const language = (req.query.lg as string) || 'pt-BR';
      
      const result = await getMostLikedMangas({
        page,
        take,
        language
      });
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/feed
   * Retorna feed personalizado para o usuário
   */
  static getFeed: RequestHandler = async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
      }

      const { page, take } = getPaginationParams(req);
      const language = (req.query.lg as string) || 'pt-BR';
      
      const result = await getFeedForUser(userId, {
        page,
        take,
        language
      });
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/ia
   * Retorna recomendações baseadas em IA
   */
  static getIA: RequestHandler = async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
      }

      const { page, take } = getPaginationParams(req);
      const language = (req.query.lg as string) || 'pt-BR';
      
      const result = await getIARecommendations(userId, {
        page,
        take,
        language
      });
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/categories/:categoryIds
   * Retorna mangás de categorias específicas
   */
  static getMangasByCategories: RequestHandler = async (req, res) => {
    try {
      const categoryIds = req.params.categoryIds?.split(',') || [];
      
      if (categoryIds.length === 0) {
        res.status(400).json({ error: 'IDs de categorias são obrigatórios' });
        return;
      }

      const { page, take } = getPaginationParams(req);
      const language = (req.query.lg as string) || 'pt-BR';
      
      const result = await getMangasByCategoriesHandler(categoryIds, {
        page,
        take,
        language
      });
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/stats
   * Retorna estatísticas de discover (admin only)
   */
  static getStats: RequestHandler = async (req, res) => {
    try {
      const language = (req.query.lg as string) || 'pt-BR';
      
      const stats = await getDiscoverStats(language);
      
      res.status(200).json(stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /discover/health
   * Health check endpoint
   */
  static healthCheck: RequestHandler = async (req, res) => {
    try {
      // Pode incluir checks de conectividade com banco, etc.
      res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'discover'
      });
    } catch {
      res.status(503).json({ 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'discover'
      });
    }
  };
}

// Exports nomeados para compatibilidade com o router atual
export const getRecent = DiscoverController.getRecent;
export const getMostViewed = DiscoverController.getMostViewed;
export const getMostLiked = DiscoverController.getMostLiked;
export const getFeed = DiscoverController.getFeed;
export const getIA = DiscoverController.getIA;
export const getMangasByCategories = DiscoverController.getMangasByCategories;
export const getStats = DiscoverController.getStats;
export const healthCheck = DiscoverController.healthCheck;