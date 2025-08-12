import type { RequestHandler } from "express";
import * as chapterHandlers from "../handlers/ChaptersHandler";

/**
 * @swagger
 * components:
 *   schemas:
 *     Chapter:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do capítulo
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         title:
 *           type: string
 *           description: Título do capítulo
 *           example: "Capítulo 1 - O Início"
 *         chapter:
 *           type: number
 *           format: float
 *           description: Número do capítulo
 *           example: 1.0
 *         volume:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Número do volume
 *           example: 1.0
 *         language:
 *           type: array
 *           items:
 *             type: string
 *           description: Idiomas disponíveis
 *           example: ["pt-br"]
 *         publish_date:
 *           type: string
 *           description: Data de publicação formatada
 *           example: "15 jan 2024"
 *         pages:
 *           type: number
 *           description: Número de páginas do capítulo
 *           example: 20
 *     ChapterListResponse:
 *       type: object
 *       properties:
 *         current_page:
 *           type: number
 *           description: Página atual
 *           example: 1
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Chapter'
 *           description: Lista de capítulos
 *         first_page_url:
 *           type: string
 *           description: URL da primeira página
 *           example: "http://localhost:3000/chapters/manga/123?page=1&limit=20&lang=pt-br&order=desc"
 *         from:
 *           type: number
 *           description: Índice do primeiro item da página
 *           example: 1
 *         last_page:
 *           type: number
 *           description: Número da última página
 *           example: 5
 *         last_page_url:
 *           type: string
 *           description: URL da última página
 *           example: "http://localhost:3000/chapters/manga/123?page=5&limit=20&lang=pt-br&order=desc"
 *         next_page_url:
 *           type: string
 *           nullable: true
 *           description: URL da próxima página
 *           example: "http://localhost:3000/chapters/manga/123?page=2&limit=20&lang=pt-br&order=desc"
 *         path:
 *           type: string
 *           description: URL base da paginação
 *           example: "http://localhost:3000/chapters/manga/123"
 *         per_page:
 *           type: number
 *           description: Itens por página
 *           example: 20
 *         prev_page_url:
 *           type: string
 *           nullable: true
 *           description: URL da página anterior
 *           example: null
 *         to:
 *           type: number
 *           description: Índice do último item da página
 *           example: 20
 *         total:
 *           type: number
 *           description: Total de capítulos
 *           example: 100
 *     ChapterPagesResponse:
 *       type: object
 *       properties:
 *         pages:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs das páginas do capítulo
 *           example: [
 *             "https://uploads.mangadex.org/data/abc123/page1.jpg",
 *             "https://uploads.mangadex.org/data/abc123/page2.jpg"
 *           ]
 *         total:
 *           type: number
 *           description: Total de páginas
 *           example: 20
 *         chapter_id:
 *           type: string
 *           description: ID do capítulo
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Erro ao buscar capítulos"
 */

/**
 * @swagger
 * /chapters/manga/{id}:
 *   get:
 *     summary: Listar capítulos de um mangá
 *     description: Retorna uma lista paginada de capítulos de um mangá específico
 *     tags: [Capítulos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do mangá
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           default: "pt-br"
 *         description: Idioma dos capítulos
 *         example: "pt-br"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         description: Ordem dos capítulos
 *         example: "desc"
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
 *           default: 20
 *         description: Número de capítulos por página
 *         example: 20
 *     responses:
 *       200:
 *         description: Lista de capítulos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChapterListResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /chapters/{chapterID}/pages:
 *   get:
 *     summary: Obter páginas de um capítulo
 *     description: Retorna as URLs das páginas de um capítulo específico
 *     tags: [Capítulos]
 *     parameters:
 *       - in: path
 *         name: chapterID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do capítulo
 *     responses:
 *       200:
 *         description: Páginas do capítulo retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChapterPagesResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const list: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const lg = req.query.lang as string || 'pt-br';
    const order = req.query.order as string || 'desc';
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = parseInt(req.query.limit as string || '20');
    const offset = (page - 1) * limit;
    const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;

    try {
        const result = await chapterHandlers.listChapters({ id, lg, order, page, limit, offset });
        
        // Adiciona o baseUrl aos links de paginação
        const response = {
            ...result,
            first_page_url: baseUrl + result.first_page_url,
            last_page_url: baseUrl + result.last_page_url,
            next_page_url: result.next_page_url ? baseUrl + result.next_page_url : null,
            prev_page_url: result.prev_page_url ? baseUrl + result.prev_page_url : null,
            path: baseUrl
        };

        res.json(response);
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
};

export const getPages: RequestHandler = async (req, res) => {
    const { chapterID } = req.params;

    try {
        const result = await chapterHandlers.getChapterPages(chapterID);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar páginas:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
}; 