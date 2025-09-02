import type { RequestHandler } from "express";
import { getPaginationParams } from '@/utils/pagination';
import * as chapterHandlers from "../handlers/ChaptersHandler";

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
 *         name: lg
 *         schema:
 *           type: string
 *           default: "pt-br"
 *         description: Idioma dos capítulos
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         description: Ordem dos capítulos
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
 *         description: Lista de capítulos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChapterListResponse'
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

export const list: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const lg = req.query.lg as string || 'pt-br';
    const order = req.query.order as string || 'desc';
    const { skip, take, page } = getPaginationParams(req);

    try {
        const result = await chapterHandlers.getMangaChapters(id, lg, order, page, take);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === 'Mangá não encontrado ou UUID não disponível') {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Erro ao buscar capítulos:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
};

/**
 * @swagger
 * /chapters/pages/{chapterID}:
 *   get:
 *     summary: Buscar páginas de um capítulo
 *     description: Retorna as páginas de um capítulo específico com opções de qualidade
 *     tags: [Capítulos]
 *     parameters:
 *       - in: path
 *         name: chapterID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do capítulo
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [high, low]
 *           default: "high"
 *         description: Qualidade das imagens
 *     responses:
 *       200:
 *         description: Páginas do capítulo retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pages:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: URLs das páginas
 *                 total:
 *                   type: number
 *                   description: Total de páginas
 *                 chapter_id:
 *                   type: string
 *                   description: ID do capítulo
 *                 base_url:
 *                   type: string
 *                   description: URL base das imagens
 *                 quality:
 *                   type: string
 *                   description: Qualidade das imagens
 *                 hash:
 *                   type: string
 *                   description: Hash do capítulo
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const pages: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const quality = req.query.quality as string || 'high';

    try {
        const result = await chapterHandlers.getChapterPagesEnhanced(id, quality);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar páginas:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            details: error instanceof Error ? error.stack : undefined
        });
    }
}; 

export const ChapterController = {
    list,
    pages
};