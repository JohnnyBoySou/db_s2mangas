import { RequestHandler } from 'express';
import { handleZodError } from '@/utils/zodError';
import * as searchHandlers from '../handlers/SearchHandler';
import { advancedSearchSchema } from '../validators/SearchValidator';
import { MANGA_TYPE } from '@/constants/search';
// Removidas as linhas:
// import countries from 'i18n-iso-countries';
// import ptJson from 'i18n-iso-countries/langs/pt.json' assert { type: 'json' };

// Removida a linha:
// countries.registerLocale(ptJson);

export const searchManga: RequestHandler = async (req, res) => {
    const {
        name,
        category,
        status,
        type,
        page = 1,
        limit = 10,
    } = req.body;

    const language = req.params.lg || 'pt-BR';

    try {
        const result = await searchHandlers.searchManga({
            name,
            category,
            status,
            type,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            language
        });

        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        handleZodError(err, res);
    }
};

export const listCategories: RequestHandler = async (_req, res) => {
    try {
        const categories = await searchHandlers.listCategories();
        res.status(200).json(categories);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const searchCategories: RequestHandler = async (req, res) => {
    const { name, page = 1, limit = 10 } = req.body;
    const language = req.params.lg || 'pt-BR';

    if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
        return;
    }

    try {
        const result = await searchHandlers.searchCategories(
            name,
            parseInt(page, 10),
            parseInt(limit, 10),
            language
        );
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const searchAdvanced: RequestHandler = async (req, res) => {
    try {
        const validatedData = advancedSearchSchema.parse(req.query);
        const result = await searchHandlers.searchManga({
            ...validatedData,
            language: req.params.lg || 'pt-BR'
        });
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const listTypes: RequestHandler = async (_req, res) => {
    try {
        const types = Object.values(MANGA_TYPE);
        res.status(200).json(types);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const listLanguages: RequestHandler = async (_req, res) => {
    try {
        const languages = await searchHandlers.listLanguages();
        res.status(200).json(languages);
    } catch (err) {
        handleZodError(err, res);
    }
};
