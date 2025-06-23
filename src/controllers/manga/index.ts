import type { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from '@/utils/pagination';
import * as mangaHandler from "@/handlers/manga";
import path from 'path';
import { invalidateAdminCache } from "@/utils/invalidateAdminCache";

export const create: RequestHandler = async (req, res) => {
    try {
        const manga = await mangaHandler.createManga(req.body);
        res.status(201).json(manga);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    const language = req.query.lg as string || 'en';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    try {
        const mangas = await mangaHandler.listMangas(language, page, limit);
        res.json(mangas);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

export const get: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const language = req.query.lg as string || 'en';
    const userId = (req as any).user?.id;

    try {
        const manga = await mangaHandler.getMangaById(id, language, userId);
        res.json(manga);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "Mangá não encontrado") {
            res.status(404).json({ error: error.message });
            return;
        }
        handleZodError(error, res);
    }
};

export const update: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const updated = await mangaHandler.updateManga(id, req.body);
        await invalidateAdminCache((req as any).user?.id);
        res.json(updated);
    } catch (error) {
        if (error instanceof Error && error.message === "Mangá não encontrado") {
            res.status(404).json({ error: error.message });
            return;
        }
        handleZodError(error, res);
    }
};

export const remove: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await mangaHandler.deleteManga(id);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "Mangá não encontrado") {
            res.status(404).json({ error: error.message });
            return;
        }
        handleZodError(error, res);
    }
};

export const category: RequestHandler = async (req, res) => {
    const { category } = req.query;
    const { take, page } = getPaginationParams(req);
  
    if (!category || typeof category !== 'string') {
        res.status(400).json({ error: 'Parâmetro "category" é obrigatório.' });
        return;
    }
  
    try {
        const result = await mangaHandler.getMangaByCategory(category, page, take);
        res.json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const covers: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const covers = await mangaHandler.getMangaCovers(id);
        res.json(covers);
    } catch (error) {
        if (error instanceof Error && error.message === 'UUID do mangá não encontrado') {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Erro ao buscar capas:', error);
        res.status(500).json({ error: 'Erro ao buscar capas do mangá' });
    }
};

export const importFromMangaDex: RequestHandler = async (req, res) => {
    const { mangaId } = req.params;

    try {
        const manga = await mangaHandler.importMangaFromMangaDex(mangaId);
        res.status(201).json(manga);
    } catch (error) {
        console.error('Erro ao importar mangá:', error);
        res.status(500).json({ error: 'Erro ao importar mangá do MangaDex' });
    }
};

export const importFromJSON: RequestHandler = async (req, res) => {
    try {
        const manga = await mangaHandler.importMangaFromJSON(req.body);
        res.status(201).json(manga);
    } catch (error) {
        console.error('Erro ao importar mangá do JSON:', error);
        res.status(500).json({ 
            error: 'Erro ao importar mangá do JSON',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

export const importFromFile: RequestHandler = async (req, res) => {
    const { filename } = req.params;

    try {
        const results = await mangaHandler.importMangaFromFile(filename);
        res.json({
            message: `Importação concluída. ${results.success} de ${results.total} mangás importados com sucesso.`,
            results
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Arquivo não encontrado') {
            res.status(404).json({ 
                error: error.message,
                path: path.join(process.cwd(), 'src', 'import', filename)
            });
            return;
        }
        console.error('Erro ao importar mangás do arquivo:', error);
        res.status(500).json({ 
            error: 'Erro ao importar mangás do arquivo',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

export const chapters: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const lg = req.query.lg as string || 'pt-br';
    const order = req.query.order as string || 'desc';
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = parseInt(req.query.limit as string || '20');

    try {
        const result = await mangaHandler.getMangaChapters(id, lg, order, page, limit);
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

export const pages: RequestHandler = async (req, res) => {
    const { chapterID } = req.params;
    const quality = req.query.quality as string || 'high';

    try {
        const result = await mangaHandler.getChapterPages(chapterID, quality);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar páginas:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            details: error instanceof Error ? error.stack : undefined
        });
    }
};

export const clearMangaTable: RequestHandler = async (req, res) => {
    try {
        const result = await mangaHandler.clearMangaTable();
        res.json(result);
    } catch (error) {
        console.error('Erro ao limpar tabela de mangás:', error);
        res.status(500).json({ 
            error: 'Erro ao limpar tabela de mangás',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

export const similar: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    try {
        const similarMangas = await mangaHandler.getSimilarMangas(id, limit);
        res.json(similarMangas);
    } catch (error) {
        if (error instanceof Error && error.message === "Mangá não encontrado") {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Erro ao buscar mangás similares:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar mangás similares',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

