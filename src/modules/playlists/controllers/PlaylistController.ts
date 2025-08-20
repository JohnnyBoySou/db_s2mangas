import type { RequestHandler } from "express";
import * as playlistHandler from "../handlers/PlaylistHandler";

/**
 * @swagger
 * components:
 *   schemas:
 *     Playlist:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da playlist
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome da playlist
 *           example: "Melhores Mangás de Ação"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         link:
 *           type: string
 *           format: uri
 *           description: Link da playlist
 *           example: "https://example.com/playlist"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Descrição da playlist
 *           example: "Uma coleção dos melhores mangás de ação"
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
 *         tags:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID da associação playlist-tag
 *               playlistId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da playlist
 *               tagId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da tag
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: Data da associação
 *               tag:
 *                 $ref: '#/components/schemas/Tag'
 *           description: Tags associadas à playlist
 *     PlaylistCreate:
 *       type: object
 *       required:
 *         - name
 *         - cover
 *         - link
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome da playlist
 *           example: "Melhores Mangás de Ação"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         link:
 *           type: string
 *           format: uri
 *           description: Link da playlist
 *           example: "https://example.com/playlist"
 *         description:
 *           type: string
 *           description: Descrição da playlist
 *           example: "Uma coleção dos melhores mangás de ação"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: IDs das tags para associar
 *           example: ["tag-1", "tag-2"]
 *     PlaylistUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome da playlist
 *           example: "Melhores Mangás de Ação"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         link:
 *           type: string
 *           format: uri
 *           description: Link da playlist
 *           example: "https://example.com/playlist"
 *         description:
 *           type: string
 *           description: Descrição da playlist
 *           example: "Uma coleção dos melhores mangás de ação"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: IDs das tags para associar
 *           example: ["tag-1", "tag-2"]
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da tag
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome da tag
 *           example: "Ação"
 *         color:
 *           type: string
 *           nullable: true
 *           description: Cor hexadecimal da tag
 *           example: "#FF5733"
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
 *     TagCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Nome da tag
 *           example: "Ação"
 *         color:
 *           type: string
 *           pattern: "^#[0-9A-F]{6}$"
 *           description: Cor hexadecimal da tag
 *           example: "#FF5733"
 *     TagUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Nome da tag
 *           example: "Ação"
 *         color:
 *           type: string
 *           pattern: "^#[0-9A-F]{6}$"
 *           description: Cor hexadecimal da tag
 *           example: "#FF5733"
 *     PlaylistListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Playlist'
 *           description: Lista de playlists
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de playlists
 *               example: 50
 *             page:
 *               type: number
 *               description: Página atual
 *               example: 1
 *             limit:
 *               type: number
 *               description: Limite por página
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
 *     TagsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *           description: Lista de tags
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Playlist não encontrada"
 */

/**
 * @swagger
 * /playlists:
 *   get:
 *     summary: Listar playlists
 *     description: Retorna uma lista paginada de playlists
 *     tags: [Playlists]
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
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *       - in: query
 *         name: tagId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por tag específica
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Lista de playlists retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaylistListResponse'
 *       500:
 *         description: Erro interno do servidor
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
 *   post:
 *     summary: Criar nova playlist
 *     description: Cria uma nova playlist (apenas administradores)
 *     tags: [Playlists - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaylistCreate'
 *     responses:
 *       201:
 *         description: Playlist criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Playlist'
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
 *         description: Acesso negado - apenas administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     summary: Obter playlist por ID
 *     description: Retorna uma playlist específica
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da playlist
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Playlist encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Playlist'
 *       404:
 *         description: Playlist não encontrada
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
 *   put:
 *     summary: Atualizar playlist
 *     description: Atualiza uma playlist existente (apenas administradores)
 *     tags: [Playlists - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da playlist
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaylistUpdate'
 *     responses:
 *       200:
 *         description: Playlist atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Playlist'
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
 *         description: Acesso negado - apenas administradores
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
 *   delete:
 *     summary: Deletar playlist
 *     description: Remove uma playlist (apenas administradores)
 *     tags: [Playlists - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da playlist
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: Playlist deletada com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - apenas administradores
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
 * /playlists/by-tags:
 *   get:
 *     summary: Listar playlists por tags
 *     description: Retorna playlists filtradas por múltiplas tags
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tagIds
 *         required: true
 *         schema:
 *           type: string
 *         description: IDs das tags separados por vírgula
 *         example: "tag-1,tag-2,tag-3"
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
 *           default: 10
 *         description: Limite por página
 *         example: 10
 *     responses:
 *       200:
 *         description: Lista de playlists por tags retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaylistListResponse'
 *       400:
 *         description: IDs das tags são obrigatórios
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
 * /playlists/tags/all:
 *   get:
 *     summary: Listar todas as tags
 *     description: Retorna todas as tags disponíveis
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tags retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TagsResponse'
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
 * /admin/playlists/tags:
 *   post:
 *     summary: Criar nova tag
 *     description: Cria uma nova tag (apenas administradores)
 *     tags: [Playlists - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagCreate'
 *     responses:
 *       201:
 *         description: Tag criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
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
 *         description: Acesso negado - apenas administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/playlists/tags/{id}:
 *   put:
 *     summary: Atualizar tag
 *     description: Atualiza uma tag existente (apenas administradores)
 *     tags: [Playlists - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tag
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagUpdate'
 *     responses:
 *       200:
 *         description: Tag atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
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
 *         description: Acesso negado - apenas administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Deletar tag
 *     description: Remove uma tag (apenas administradores)
 *     tags: [Playlists - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tag
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       204:
 *         description: Tag deletada com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - apenas administradores
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

export const createPlaylist: RequestHandler = async (req, res) => {
  try {
    const playlist = await playlistHandler.createPlaylist(req.body);
    res.status(201).json(playlist);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPlaylists: RequestHandler = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const take = Number(req.query.limit) || 10;
    const tagId = req.query.tagId as string;

    const result = await playlistHandler.getPlaylists(page, take, tagId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlaylistById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await playlistHandler.getPlaylistById(id);

    if (!playlist) {
      res.status(404).json({ error: "Playlist não encontrada" });
      return;
    }

    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePlaylist: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await playlistHandler.updatePlaylist(id, req.body);
    res.json(playlist);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePlaylist: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await playlistHandler.deletePlaylist(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Controllers para tags
export const getAllTags: RequestHandler = async (req, res) => {
  try {
    const tags = await playlistHandler.getAllTags();
    res.status(200).json({ data: tags });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTag: RequestHandler = async (req, res) => {
  try {
    const tag = await playlistHandler.createTag(req.body);
    res.status(201).json(tag);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTag: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await playlistHandler.updateTag(id, req.body);
    res.json(tag);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTag: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await playlistHandler.deleteTag(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlaylistsByTags: RequestHandler = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const take = Number(req.query.limit) || 10;
    const tagIds = req.query.tagIds as string;

    if (!tagIds) {
      res.status(400).json({ error: "IDs das tags são obrigatórios" });
      return;
    }

    const tagIdsArray = tagIds.split(",").map((id) => id.trim());
    const result = await playlistHandler.getPlaylistsByTags(
      tagIdsArray,
      page,
      take
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
