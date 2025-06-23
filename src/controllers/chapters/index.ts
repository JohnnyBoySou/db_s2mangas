import type { RequestHandler } from "express";
import * as chapterHandlers from "@/handlers/chapters";

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