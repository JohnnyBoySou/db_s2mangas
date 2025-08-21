import { RequestHandler } from 'express';
import { handleZodError } from '@/utils/zodError';
import * as searchHandlers from '../handlers/SearchHandler';
import SmartSearchHandler from '../handlers/SmartSearchHandler';
import { advancedSearchSchema } from '../validators/SearchValidator';
import { MANGA_TYPE } from '@/constants/search';

// Initialize smart search handler
const smartSearchHandler = new SmartSearchHandler();

/**
 * @swagger
 * components:
 *   schemas:
 *     Manga:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome do mangá
 *           example: "One Piece"
 *         description:
 *           type: string
 *           description: Descrição do mangá
 *           example: "Uma aventura épica sobre piratas"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         status:
 *           type: string
 *           description: Status do mangá
 *           enum: ["Em andamento", "Completo", "Descontinuado", "Em hiato", "Anunciado"]
 *           example: "Em andamento"
 *         type:
 *           type: string
 *           description: Tipo do mangá
 *           enum: ["Manga", "Manhwa", "Manhua", "Webtoon"]
 *           example: "Manga"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da categoria
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *         name:
 *           type: string
 *           description: Nome da categoria
 *           example: "Ação"
 *         description:
 *           type: string
 *           description: Descrição da categoria
 *           example: "Mangás de ação e aventura"
 *     SearchRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do mangá para buscar
 *           example: "One Piece"
 *         category:
 *           type: string
 *           description: Categoria do mangá
 *           example: "Ação"
 *         status:
 *           type: string
 *           description: Status do mangá
 *           enum: ["Em andamento", "Completo", "Descontinuado", "Em hiato", "Anunciado"]
 *           example: "Em andamento"
 *         type:
 *           type: string
 *           description: Tipo do mangá
 *           enum: ["Manga", "Manhwa", "Manhua", "Webtoon"]
 *           example: "Manga"
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Número da página
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           description: Número de itens por página
 *           example: 10
 *     AdvancedSearchRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do mangá para buscar
 *           example: "One Piece"
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de categorias
 *           example: ["Ação", "Aventura"]
 *         status:
 *           type: string
 *           description: Status do mangá
 *           enum: ["Em andamento", "Completo", "Descontinuado", "Em hiato", "Anunciado"]
 *           example: "Em andamento"
 *         type:
 *           type: string
 *           description: Tipo do mangá
 *           enum: ["Manga", "Manhwa", "Manhua", "Webtoon"]
 *           example: "Manga"
 *         languages:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de idiomas
 *           example: ["pt-BR", "en"]
 *         orderBy:
 *           type: string
 *           enum: ["most_viewed", "most_liked", "most_recent"]
 *           default: "most_recent"
 *           description: Critério de ordenação
 *           example: "most_recent"
 *         page:
 *           type: string
 *           default: "1"
 *           description: Número da página
 *           example: "1"
 *         limit:
 *           type: string
 *           default: "10"
 *           description: Número de itens por página
 *           example: "10"
 *     SearchResponse:
 *       type: object
 *       properties:
 *         mangas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Manga'
 *         total:
 *           type: number
 *           description: Total de mangás encontrados
 *           example: 150
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 15
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *         limit:
 *           type: number
 *           description: Itens por página
 *           example: 10
 *     CategorySearchRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nome da categoria para buscar
 *           example: "Ação"
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Número da página
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           description: Número de itens por página
 *           example: 10
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Nome da categoria é obrigatório"
 *         message:
 *           type: string
 *           description: Mensagem de erro (alternativa)
 *           example: "Erro interno do servidor"
 */

/**
 * @swagger
 * /search/manga:
 *   post:
 *     summary: Buscar mangás
 *     description: Realiza uma busca de mangás com filtros básicos
 *     tags: [Busca]
 *     parameters:
 *       - in: path
 *         name: lg
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Idioma da busca
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchRequest'
 *     responses:
 *       200:
 *         description: Busca realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *       400:
 *         description: Dados inválidos
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
 * /search/categories:
 *   get:
 *     summary: Listar categorias
 *     description: Retorna todas as categorias disponíveis
 *     tags: [Busca]
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /search/categories/search:
 *   post:
 *     summary: Buscar categorias
 *     description: Realiza uma busca de categorias por nome
 *     tags: [Busca]
 *     parameters:
 *       - in: path
 *         name: lg
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Idioma da busca
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategorySearchRequest'
 *     responses:
 *       200:
 *         description: Busca de categorias realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       400:
 *         description: Dados inválidos
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
 * /search/advanced:
 *   get:
 *     summary: Busca avançada
 *     description: Realiza uma busca avançada de mangás com múltiplos filtros
 *     tags: [Busca]
 *     parameters:
 *       - in: path
 *         name: lg
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Idioma da busca
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Nome do mangá
 *       - in: query
 *         name: categories
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Lista de categorias
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["Em andamento", "Completo", "Descontinuado", "Em hiato", "Anunciado"]
 *         description: Status do mangá
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ["Manga", "Manhwa", "Manhua", "Webtoon"]
 *         description: Tipo do mangá
 *       - in: query
 *         name: languages
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Lista de idiomas
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: ["most_viewed", "most_liked", "most_recent"]
 *           default: "most_recent"
 *         description: Critério de ordenação
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Busca avançada realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *       400:
 *         description: Dados inválidos
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
 * /search/types:
 *   get:
 *     summary: Listar tipos de mangá
 *     description: Retorna todos os tipos de mangá disponíveis
 *     tags: [Busca]
 *     responses:
 *       200:
 *         description: Lista de tipos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: ["Manga", "Manhwa", "Manhua", "Webtoon"]
 *             example: ["Manga", "Manhwa", "Manhua", "Webtoon"]
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /search/languages:
 *   get:
 *     summary: Listar idiomas disponíveis
 *     description: Retorna todos os idiomas disponíveis para busca
 *     tags: [Busca]
 *     responses:
 *       200:
 *         description: Lista de idiomas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *             example: ["pt-BR", "en", "es", "fr"]
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /search/smart:
 *   get:
 *     summary: Busca inteligente
 *     description: Realiza busca usando Elasticsearch quando disponível, com fallback para SQL
 *     tags: [Busca]
 *     parameters:
 *       - in: path
 *         name: lg
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Idioma da busca
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Nome do mangá
 *       - in: query
 *         name: categories
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Lista de categorias
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status do mangá
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Tipo do mangá
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Busca inteligente realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Manga'
 *                 total:
 *                   type: number
 *                 took:
 *                   type: number
 *                   description: Tempo de resposta em ms
 *                 searchType:
 *                   type: string
 *                   enum: ["elasticsearch", "sql"]
 *                   description: Tipo de busca utilizada
 *                 pagination:
 *                   type: object
 *                 performance:
 *                   type: object
 *                   properties:
 *                     elasticsearchAvailable:
 *                       type: boolean
 *                     responseTime:
 *                       type: number
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
export const smartSearch: RequestHandler = async (req, res) => {
    try {
        const validatedData = advancedSearchSchema.parse(req.query);
        const result = await smartSearchHandler.intelligentSearch({
            ...validatedData,
            language: req.params.lg || 'pt-BR'
        });
        res.status(200).json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

/**
 * @swagger
 * /search/autocomplete:
 *   get:
 *     summary: Autocomplete de busca
 *     description: Retorna sugestões em tempo real para autocomplete
 *     tags: [Busca]
 *     parameters:
 *       - in: path
 *         name: lg
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Idioma da busca
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Texto para buscar sugestões
 *         example: "one p"
 *     responses:
 *       200:
 *         description: Sugestões retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       text:
 *                         type: string
 *                         description: Texto da sugestão
 *                         example: "One Piece"
 *                       score:
 *                         type: number
 *                         description: Score de relevância
 *                         example: 0.95
 *                       type:
 *                         type: string
 *                         enum: ["title", "category"]
 *                         description: Tipo da sugestão
 *                         example: "title"
 *                 total:
 *                   type: number
 *                   description: Total de sugestões
 *                   example: 5
 *       400:
 *         description: Query parameter 'q' é obrigatório
 *       500:
 *         description: Erro interno do servidor
 */
export const autocomplete: RequestHandler = async (req, res) => {
    const query = req.query.q as string;
    const language = req.params.lg || 'pt-BR';
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({ error: 'Query parameter \'q\' é obrigatório' });
        return;
    }
    
    try {
        const suggestions = await smartSearchHandler.getAutocompleteSuggestions(query.trim(), language);
        res.status(200).json({
            suggestions,
            total: suggestions.length
        });
    } catch (err) {
        handleZodError(err, res);
    }
};

/**
 * @swagger
 * /search/health:
 *   get:
 *     summary: Status da busca
 *     description: Retorna informações sobre a saúde do sistema de busca
 *     tags: [Busca]
 *     responses:
 *       200:
 *         description: Status retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 elasticsearch:
 *                   type: boolean
 *                   description: Se Elasticsearch está disponível
 *                 sql:
 *                   type: boolean
 *                   description: Se busca SQL está disponível
 *                 recommendedSearchType:
 *                   type: string
 *                   enum: ["elasticsearch", "sql"]
 *                   description: Tipo de busca recomendado
 *       500:
 *         description: Erro interno do servidor
 */
export const searchHealth: RequestHandler = async (_req, res) => {
    try {
        const health = await smartSearchHandler.getSearchHealth();
        res.status(200).json(health);
    } catch (err) {
        handleZodError(err, res);
    }
};
