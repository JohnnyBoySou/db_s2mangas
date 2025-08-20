import type { RequestHandler } from "express";
import { handleZodError } from '@/utils/zodError';
import * as wallpaperHandlers from '../handlers/WallpaperHandler';

/**
 * @swagger
 * components:
 *   schemas:
 *     Wallpaper:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do wallpaper
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome do wallpaper
 *           example: "Wallpaper Anime Ação"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa do wallpaper
 *           example: "https://example.com/cover.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do wallpaper
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *         totalImages:
 *           type: number
 *           description: Número total de imagens do wallpaper
 *           example: 5
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WallpaperImage'
 *           description: Lista de imagens do wallpaper
 *     WallpaperImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da imagem
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *         wallpaperId:
 *           type: string
 *           format: uuid
 *           description: ID do wallpaper ao qual pertence
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         url:
 *           type: string
 *           format: uri
 *           description: URL da imagem
 *           example: "https://example.com/image1.jpg"
 *     WallpaperCreate:
 *       type: object
 *       required:
 *         - name
 *         - cover
 *         - images
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome do wallpaper
 *           example: "Wallpaper Anime Ação"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         images:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL da imagem
 *                 example: "https://example.com/image1.jpg"
 *           description: Lista de URLs das imagens do wallpaper
 *     WallpaperUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome do wallpaper
 *           example: "Wallpaper Anime Ação"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         images:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL da imagem
 *                 example: "https://example.com/image1.jpg"
 *           description: Lista de URLs das imagens do wallpaper
 *     WallpaperListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Wallpaper'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de wallpapers
 *               example: 50
 *             page:
 *               type: number
 *               description: Página atual
 *               example: 1
 *             limit:
 *               type: number
 *               description: Limite de itens por página
 *               example: 10
 *             totalPages:
 *               type: number
 *               description: Total de páginas
 *               example: 5
 *             next:
 *               type: boolean
 *               description: Se existe próxima página
 *               example: true
 *             prev:
 *               type: boolean
 *               description: Se existe página anterior
 *               example: false
 *     WallpaperDetailResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/Wallpaper'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de imagens
 *               example: 5
 *             page:
 *               type: number
 *               description: Página atual
 *               example: 1
 *             limit:
 *               type: number
 *               description: Limite de itens por página
 *               example: 10
 *             totalPages:
 *               type: number
 *               description: Total de páginas
 *               example: 1
 *             next:
 *               type: boolean
 *               description: Se existe próxima página
 *               example: false
 *             prev:
 *               type: boolean
 *               description: Se existe página anterior
 *               example: false
 *     ToggleImageRequest:
 *       type: object
 *       required:
 *         - image
 *       properties:
 *         image:
 *           type: string
 *           format: uri
 *           description: URL da imagem a ser adicionada/removida
 *           example: "https://example.com/image.jpg"
 *     ImportPinterestRequest:
 *       type: object
 *       required:
 *         - pinterestUrl
 *       properties:
 *         pinterestUrl:
 *           type: string
 *           format: uri
 *           description: URL do Pinterest para importar
 *           example: "https://pinterest.com/pin/123456789/"
 *     ImportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Se a importação foi bem-sucedida
 *           example: true
 *         message:
 *           type: string
 *           description: Mensagem de resultado
 *           example: "Wallpapers importados com sucesso"
 *         count:
 *           type: number
 *           description: Número de wallpapers importados
 *           example: 10
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Wallpaper não encontrado"
 */

/**
 * @swagger
 * /wallpapers:
 *   get:
 *     summary: Listar wallpapers
 *     description: Retorna uma lista paginada de todos os wallpapers
 *     tags: [Wallpapers]
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
 *           maximum: 100
 *           default: 10
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de wallpapers retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WallpaperListResponse'
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
 * /wallpapers/{id}:
 *   get:
 *     summary: Obter wallpaper por ID
 *     description: Retorna um wallpaper específico com suas imagens
 *     tags: [Wallpapers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do wallpaper
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página para as imagens
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de imagens por página
 *     responses:
 *       200:
 *         description: Wallpaper encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WallpaperDetailResponse'
 *       404:
 *         description: Wallpaper não encontrado
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
 * /admin/wallpapers:
 *   post:
 *     summary: Criar novo wallpaper
 *     description: Cria um novo wallpaper no sistema (apenas administradores)
 *     tags: [Wallpapers - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WallpaperCreate'
 *     responses:
 *       201:
 *         description: Wallpaper criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wallpaper'
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
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/wallpapers/{id}:
 *   put:
 *     summary: Atualizar wallpaper
 *     description: Atualiza um wallpaper existente (apenas administradores)
 *     tags: [Wallpapers - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do wallpaper
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WallpaperUpdate'
 *     responses:
 *       200:
 *         description: Wallpaper atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wallpaper'
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
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Wallpaper não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/wallpapers/{id}:
 *   delete:
 *     summary: Deletar wallpaper
 *     description: Remove um wallpaper do sistema (apenas administradores)
 *     tags: [Wallpapers - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do wallpaper
 *     responses:
 *       204:
 *         description: Wallpaper deletado com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Wallpaper não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/wallpapers/{id}/toggle:
 *   post:
 *     summary: Adicionar/remover imagem do wallpaper
 *     description: Adiciona ou remove uma imagem de um wallpaper (apenas administradores)
 *     tags: [Wallpapers - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do wallpaper
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ToggleImageRequest'
 *     responses:
 *       200:
 *         description: Imagem adicionada/removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wallpaper'
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
 *       403:
 *         description: Acesso negado - requer privilégios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Wallpaper não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/wallpapers/import:
 *   post:
 *     summary: Importar wallpapers do JSON
 *     description: Importa wallpapers de um arquivo JSON (apenas administradores)
 *     tags: [Wallpapers - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallpapers importados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportResponse'
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
 * /admin/wallpapers/import-pinterest:
 *   post:
 *     summary: Importar wallpaper do Pinterest
 *     description: Importa um wallpaper a partir de uma URL do Pinterest (apenas administradores)
 *     tags: [Wallpapers - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImportPinterestRequest'
 *     responses:
 *       200:
 *         description: Wallpaper importado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportResponse'
 *       400:
 *         description: URL inválida ou obrigatória
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

export const getWallpapers: RequestHandler = async (req, res) => {
  try {
    const result = await wallpaperHandlers.getWallpapers(req);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar wallpapers no controller:", error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro interno ao buscar wallpapers' });
  }
};

export const getWallpaperById: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const wallpaper = await wallpaperHandlers.getWallpaperById(id, req);
    res.json(wallpaper);
  } catch (error) {
    if (error instanceof Error && error.message === 'Wallpaper não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    handleZodError(error, res);
  }
};

export const createWallpaper: RequestHandler = async (req, res) => {
  try {
    const wallpaper = await wallpaperHandlers.createWallpaper(req.body);
    res.status(201).json(wallpaper);
  } catch (error) {
    console.log(error)
    handleZodError(error, res);
  }
};

export const updateWallpaper: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const wallpaper = await wallpaperHandlers.updateWallpaper(id, req.body);
    res.json(wallpaper);
  } catch (error) {
    handleZodError(error, res);
  }
};

export const deleteWallpaper: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    await wallpaperHandlers.deleteWallpaper(id);
    res.status(204).send();
  } catch (error) {
    console.log(error)
    handleZodError(error, res);
  }
};

export const importWallpapers: RequestHandler = async (req, res) => {
  try {
    const result = await wallpaperHandlers.importFromJson();
    res.json(result);
  } catch (error) {
    console.error('Erro ao importar wallpapers:', error);
    res.status(500).json({ error: 'Erro ao importar wallpapers' });
  }
};

export const toggleWallpaperImage: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'URL da imagem é obrigatória' });
  }

  try {
    const result = await wallpaperHandlers.toggleWallpaperImage(id, image);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Wallpaper não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    handleZodError(error, res);
  }
};

export const importPinterestWallpaper: RequestHandler = async (req, res) => {
  try {
    const { pinterestUrl } = req.body;

    if (!pinterestUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL do Pinterest é obrigatória'
      });
    }

    const result = await wallpaperHandlers.importFromPinterest(pinterestUrl);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro no controller importPinterestWallpaper:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao importar wallpaper do Pinterest'
    });
  }
};
