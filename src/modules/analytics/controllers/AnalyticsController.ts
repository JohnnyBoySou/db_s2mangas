import prisma from '@/prisma/client';
import { RequestHandler, Request, Response } from 'express';
import { handleZodError } from '@/utils/zodError';
import * as analyticsHandlers from '../handlers/AnalyticsHandler';

/**
 * @swagger
 * components:
 *   schemas:
 *     GeneralStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: number
 *           description: Total de usuários registrados
 *           example: 15000
 *         totalMangas:
 *           type: number
 *           description: Total de mangás cadastrados
 *           example: 2500
 *         totalChapters:
 *           type: number
 *           description: Total de capítulos
 *           example: 15000
 *         totalViews:
 *           type: number
 *           description: Total de visualizações
 *           example: 500000
 *         totalLikes:
 *           type: number
 *           description: Total de curtidas
 *           example: 25000
 *         totalComments:
 *           type: number
 *           description: Total de comentários
 *           example: 12000
 *     ViewData:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *           description: Data da visualização
 *           example: "2024-01-15T00:00:00Z"
 *         count:
 *           type: number
 *           description: Número de visualizações
 *           example: 150
 *     UserData:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *           description: Data do registro
 *           example: "2024-01-15T00:00:00Z"
 *         count:
 *           type: number
 *           description: Número de usuários registrados
 *           example: 25
 *     MangaRanking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         title:
 *           type: string
 *           description: Título do mangá
 *           example: "One Piece"
 *         views:
 *           type: number
 *           description: Número de visualizações
 *           example: 15000
 *         likes:
 *           type: number
 *           description: Número de curtidas
 *           example: 2500
 *         comments:
 *           type: number
 *           description: Número de comentários
 *           example: 800
 *     ActiveUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID do usuário
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *         name:
 *           type: string
 *           description: Nome do usuário
 *           example: "João Silva"
 *         username:
 *           type: string
 *           description: Nome de usuário
 *           example: "joaosilva"
 *         views:
 *           type: number
 *           description: Número de visualizações
 *           example: 500
 *         likes:
 *           type: number
 *           description: Número de curtidas
 *           example: 150
 *         comments:
 *           type: number
 *           description: Número de comentários
 *           example: 75
 *         totalActivity:
 *           type: number
 *           description: Total de atividades
 *           example: 725
 *     CategoryStat:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome da categoria
 *           example: "Ação"
 *         mangaCount:
 *           type: number
 *           description: Número de mangás na categoria
 *           example: 450
 *     LanguageStat:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: Código do idioma
 *           example: "pt-BR"
 *         mangaCount:
 *           type: number
 *           description: Número de mangás no idioma
 *           example: 1200
 *     TypeStat:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Tipo do mangá
 *           example: "Manga"
 *         count:
 *           type: number
 *           description: Número de mangás do tipo
 *           example: 800
 *     StatusStat:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Status do mangá
 *           example: "Em andamento"
 *         count:
 *           type: number
 *           description: Número de mangás com o status
 *           example: 1500
 *     ChartDataPoint:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *           description: Rótulo do dado
 *           example: "Ação"
 *         value:
 *           type: number
 *           description: Valor do dado
 *           example: 450
 *     LineChartPoint:
 *       type: object
 *       properties:
 *         x:
 *           type: string
 *           format: date-time
 *           description: Data do ponto
 *           example: "2024-01-15T00:00:00Z"
 *         y:
 *           type: number
 *           description: Valor do ponto
 *           example: 150
 *     BarChartMangaData:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *           description: Título do mangá
 *           example: "One Piece"
 *         views:
 *           type: number
 *           description: Número de visualizações
 *           example: 15000
 *         likes:
 *           type: number
 *           description: Número de curtidas
 *           example: 2500
 *         comments:
 *           type: number
 *           description: Número de comentários
 *           example: 800
 *     BarChartUserData:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *           description: Nome do usuário
 *           example: "João Silva"
 *         views:
 *           type: number
 *           description: Número de visualizações
 *           example: 500
 *         likes:
 *           type: number
 *           description: Número de curtidas
 *           example: 150
 *         comments:
 *           type: number
 *           description: Número de comentários
 *           example: 75
 *         total:
 *           type: number
 *           description: Total de atividades
 *           example: 725
 *     DashboardData:
 *       type: object
 *       properties:
 *         generalStats:
 *           $ref: '#/components/schemas/GeneralStats'
 *         timeSeriesData:
 *           type: object
 *           properties:
 *             viewsByPeriod:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ViewData'
 *             usersByPeriod:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserData'
 *         mangaRankings:
 *           type: object
 *           properties:
 *             mostViewed:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MangaRanking'
 *             mostLiked:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MangaRanking'
 *             mostCommented:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MangaRanking'
 *         userStats:
 *           type: object
 *           properties:
 *             mostActive:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActiveUser'
 *         categoryData:
 *           type: object
 *           properties:
 *             categories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryStat'
 *             languages:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LanguageStat'
 *             mangaTypes:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TypeStat'
 *             mangaStatus:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StatusStat'
 *         chartMetadata:
 *           type: object
 *           properties:
 *             period:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *             pieChartData:
 *               type: object
 *               properties:
 *                 mangaStatus:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChartDataPoint'
 *                 mangaTypes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChartDataPoint'
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChartDataPoint'
 *                 languages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChartDataPoint'
 *             lineChartData:
 *               type: object
 *               properties:
 *                 views:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LineChartPoint'
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LineChartPoint'
 *             barChartData:
 *               type: object
 *               properties:
 *                 mangaPopularity:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BarChartMangaData'
 *                 userActivity:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BarChartUserData'
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Data inicial e final são obrigatórias"
 *         message:
 *           type: string
 *           description: Mensagem de erro (alternativa)
 *           example: "Erro interno do servidor"
 */

/**
 * @swagger
 * /analytics/ping:
 *   get:
 *     summary: Verificar status da conexão
 *     description: Verifica se a conexão com o banco de dados está funcionando
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Conexão estabelecida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "pong"
 *                 dbStatus:
 *                   type: string
 *                   example: "connected"
 *       500:
 *         description: Erro na conexão com o banco
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/stats/general:
 *   get:
 *     summary: Estatísticas gerais
 *     description: Retorna estatísticas gerais da plataforma
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeneralStats'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/stats/views:
 *   get:
 *     summary: Visualizações por período
 *     description: Retorna dados de visualizações agrupados por data
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Dados de visualizações retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ViewData'
 *       400:
 *         description: Datas inválidas ou não fornecidas
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
 * /analytics/mangas/most-viewed:
 *   get:
 *     summary: Mangás mais visualizados
 *     description: Retorna os mangás com mais visualizações
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de mangás a retornar
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de mangás mais visualizados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MangaRanking'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/mangas/most-liked:
 *   get:
 *     summary: Mangás mais curtidos
 *     description: Retorna os mangás com mais curtidas
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de mangás a retornar
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de mangás mais curtidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MangaRanking'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/mangas/most-commented:
 *   get:
 *     summary: Mangás mais comentados
 *     description: Retorna os mangás com mais comentários
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de mangás a retornar
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de mangás mais comentados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MangaRanking'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/users/by-period:
 *   get:
 *     summary: Usuários registrados por período
 *     description: Retorna dados de usuários registrados agrupados por data
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Dados de usuários retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserData'
 *       400:
 *         description: Datas inválidas ou não fornecidas
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
 * /analytics/users/most-active:
 *   get:
 *     summary: Usuários mais ativos
 *     description: Retorna os usuários com mais atividades na plataforma
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de usuários a retornar
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de usuários mais ativos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActiveUser'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/stats/categories:
 *   get:
 *     summary: Estatísticas por categoria
 *     description: Retorna estatísticas de mangás por categoria
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Estatísticas de categorias retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryStat'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/stats/languages:
 *   get:
 *     summary: Estatísticas por idioma
 *     description: Retorna estatísticas de mangás por idioma
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Estatísticas de idiomas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LanguageStat'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/stats/manga-types:
 *   get:
 *     summary: Estatísticas por tipo de mangá
 *     description: Retorna estatísticas de mangás por tipo (Manga, Manhwa, etc.)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Estatísticas de tipos retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TypeStat'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/stats/manga-status:
 *   get:
 *     summary: Estatísticas por status de mangá
 *     description: Retorna estatísticas de mangás por status (Em andamento, Completo, etc.)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Estatísticas de status retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StatusStat'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Dados completos do dashboard
 *     description: Retorna todos os dados necessários para o dashboard de analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD) - padrão 30 dias atrás
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD) - padrão hoje
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Dados do dashboard retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export async function ping(req: Request, res: Response) {
  try {
    await prisma.$connect();
    res.status(200).json({ message: 'pong', dbStatus: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  } finally {
    await prisma.$disconnect();
  }
}

export const getGeneralStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getGeneralStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getViewsByPeriod: RequestHandler = async (req, res): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
            return;
        }

        const stats = await analyticsHandlers.getViewsByPeriod({
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string)
        });

        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostViewedMangas: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const mangas = await analyticsHandlers.getMostViewedMangas(limit);
        res.status(200).json(mangas);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostLikedMangas: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const mangas = await analyticsHandlers.getMostLikedMangas(limit);
        res.status(200).json(mangas);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostCommentedMangas: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const mangas = await analyticsHandlers.getMostCommentedMangas(limit);
        res.status(200).json(mangas);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getUsersByPeriod: RequestHandler = async (req, res): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
            return;
        }

        const stats = await analyticsHandlers.getUsersByPeriod({
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string)
        });

        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostActiveUsers: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const users = await analyticsHandlers.getMostActiveUsers(limit);
        res.status(200).json(users);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getCategoryStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getCategoryStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getLanguageStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getLanguageStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMangaTypeStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getMangaTypeStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMangaStatusStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getMangaStatusStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

// Controller para o dashboard completo
export const getDashboardData: RequestHandler = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Definir período padrão se não for fornecido (últimos 30 dias)
        const endDateObj = endDate ? new Date(endDate as string) : new Date();
        const startDateObj = startDate ? new Date(startDate as string) : new Date(endDateObj);
        
        // Se não foi fornecida data inicial, usar 30 dias atrás
        if (!startDate) {
            startDateObj.setDate(startDateObj.getDate() - 30);
        }
        
        const dashboardData = await analyticsHandlers.getDashboardData({
            startDate: startDateObj,
            endDate: endDateObj
        });
        
        res.status(200).json(dashboardData);
    } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
        handleZodError(err, res);
    }
};