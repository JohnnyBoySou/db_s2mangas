import { RequestHandler } from 'express';
import { handleZodError } from '@/utils/zodError';
import * as mangaListHandlers from '../handlers/MangaListHandler';
import { 
  createMangaListSchema,
  updateMangaListSchema,
  addMangaToListSchema,
  updateMangaListItemSchema,
  reorderMangaListItemsSchema,
  bulkAddToMangaListSchema,
  mangaListParamsSchema,
  mangaListItemParamsSchema
} from '../validators/MangalistValidators';

/**
 * @swagger
 * components:
 *   schemas:
 *     MangaList:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da lista de mangás
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome da lista
 *           example: "Meus Mangás Favoritos"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da capa da lista
 *           example: "https://example.com/cover.jpg"
 *         mood:
 *           type: string
 *           description: Mood da lista
 *           example: "Ação"
 *         description:
 *           type: string
 *           description: Descrição da lista
 *           example: "Lista dos meus mangás preferidos"
 *         status:
 *           type: string
 *           enum: [PRIVATE, PUBLIC, UNLISTED]
 *           description: Status da lista
 *           example: "PUBLIC"
 *         isDefault:
 *           type: boolean
 *           description: Se é a lista padrão
 *           example: false
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
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MangaListItem'
 *           description: Itens da lista
 *         _count:
 *           type: object
 *           properties:
 *             items:
 *               type: number
 *               description: Número de itens na lista
 *               example: 10
 *             likes:
 *               type: number
 *               description: Número de curtidas
 *               example: 25
 *     MangaListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do item
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *         mangaListId:
 *           type: string
 *           format: uuid
 *           description: ID da lista
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         mangaId:
 *           type: string
 *           format: uuid
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174002"
 *         order:
 *           type: number
 *           description: Ordem do item na lista
 *           example: 1
 *         note:
 *           type: string
 *           description: Nota sobre o mangá
 *           example: "Muito bom!"
 *         manga:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             title:
 *               type: string
 *             cover:
 *               type: string
 *               format: uri
 *             status:
 *               type: string
 *     MangaListCreate:
 *       type: object
 *       required:
 *         - name
 *         - cover
 *         - mood
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Nome da lista
 *           example: "Meus Mangás Favoritos"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da capa da lista
 *           example: "https://example.com/cover.jpg"
 *         mood:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Mood da lista
 *           example: "Ação"
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Descrição da lista
 *           example: "Lista dos meus mangás preferidos"
 *         status:
 *           type: string
 *           enum: [PRIVATE, PUBLIC, UNLISTED]
 *           default: PRIVATE
 *           description: Status da lista
 *           example: "PUBLIC"
 *         isDefault:
 *           type: boolean
 *           default: false
 *           description: Se é a lista padrão
 *           example: false
 *         mangaIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: IDs dos mangás para adicionar
 *           example: ["123e4567-e89b-12d3-a456-426614174002"]
 *     MangaListUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Nome da lista
 *           example: "Meus Mangás Favoritos"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da capa da lista
 *           example: "https://example.com/cover.jpg"
 *         mood:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Mood da lista
 *           example: "Ação"
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Descrição da lista
 *           example: "Lista dos meus mangás preferidos"
 *         status:
 *           type: string
 *           enum: [PRIVATE, PUBLIC, UNLISTED]
 *           description: Status da lista
 *           example: "PUBLIC"
 *         isDefault:
 *           type: boolean
 *           description: Se é a lista padrão
 *           example: false
 *     AddMangaToList:
 *       type: object
 *       required:
 *         - mangaId
 *       properties:
 *         mangaId:
 *           type: string
 *           format: uuid
 *           description: ID do mangá
 *           example: "123e4567-e89b-12d3-a456-426614174002"
 *         order:
 *           type: number
 *           minimum: 0
 *           description: Ordem do item na lista
 *           example: 1
 *         note:
 *           type: string
 *           maxLength: 200
 *           description: Nota sobre o mangá
 *           example: "Muito bom!"
 *     UpdateMangaListItem:
 *       type: object
 *       properties:
 *         order:
 *           type: number
 *           minimum: 0
 *           description: Ordem do item na lista
 *           example: 1
 *         note:
 *           type: string
 *           maxLength: 200
 *           description: Nota sobre o mangá
 *           example: "Muito bom!"
 *     ReorderItems:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - order
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID do item
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               order:
 *                 type: number
 *                 minimum: 0
 *                 description: Nova ordem
 *                 example: 1
 *     BulkAddMangas:
 *       type: object
 *       required:
 *         - mangaIds
 *       properties:
 *         mangaIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             format: uuid
 *           description: IDs dos mangás para adicionar
 *           example: ["123e4567-e89b-12d3-a456-426614174002"]
 *         notes:
 *           type: object
 *           additionalProperties:
 *             type: string
 *             maxLength: 200
 *           description: Notas por mangá (mangaId -> nota)
 *           example: {"123e4567-e89b-12d3-a456-426614174002": "Muito bom!"}
 *     MangaListListResponse:
 *       type: object
 *       properties:
 *         lists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MangaList'
 *         total:
 *           type: number
 *           description: Total de listas
 *           example: 50
 *         totalPages:
 *           type: number
 *           description: Total de páginas
 *           example: 5
 *         currentPage:
 *           type: number
 *           description: Página atual
 *           example: 1
 *     MangaListStats:
 *       type: object
 *       properties:
 *         totalItems:
 *           type: number
 *           description: Total de itens na lista
 *           example: 10
 *         totalLikes:
 *           type: number
 *           description: Total de curtidas
 *           example: 25
 *         uniqueMangas:
 *           type: number
 *           description: Número de mangás únicos
 *           example: 10
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
 *     BulkAddResult:
 *       type: object
 *       properties:
 *         added:
 *           type: number
 *           description: Número de mangás adicionados
 *           example: 5
 *         skipped:
 *           type: number
 *           description: Número de mangás ignorados
 *           example: 2
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de sucesso
 *           example: "Lista criada com sucesso"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Lista não encontrada"
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           description: Detalhes dos erros de validação
 *           example: ["Nome é obrigatório"]
 */

/**
 * @swagger
 * /mangalist:
 *   get:
 *     summary: Listar listas de mangás
 *     description: Retorna uma lista paginada de listas de mangás
 *     tags: [Listas de Mangás]
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
 *           default: 20
 *         description: Número de itens por página
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por usuário
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRIVATE, PUBLIC, UNLISTED]
 *         description: Filtrar por status
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *         description: Filtrar por mood
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, likesCount]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da ordenação
 *     responses:
 *       200:
 *         description: Lista de listas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaListListResponse'
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
 * /mangalist/public:
 *   get:
 *     summary: Listar listas públicas
 *     description: Retorna uma lista paginada de listas públicas de mangás
 *     tags: [Listas de Mangás]
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
 *           default: 20
 *         description: Número de itens por página
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *         description: Filtrar por mood
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, likesCount]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da ordenação
 *     responses:
 *       200:
 *         description: Lista de listas públicas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaListListResponse'
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
 * /mangalist/{id}:
 *   get:
 *     summary: Obter lista por ID
 *     description: Retorna uma lista específica com seus itens
 *     tags: [Listas de Mangás]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     responses:
 *       200:
 *         description: Lista encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaList'
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
 *       404:
 *         description: Lista não encontrada
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
 * /admin/mangalist:
 *   post:
 *     summary: Criar nova lista
 *     description: Cria uma nova lista de mangás (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MangaListCreate'
 *     responses:
 *       201:
 *         description: Lista criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaList'
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
 * /admin/mangalist/{id}:
 *   put:
 *     summary: Atualizar lista
 *     description: Atualiza uma lista existente (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MangaListUpdate'
 *     responses:
 *       200:
 *         description: Lista atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaList'
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
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/mangalist/{id}:
 *   delete:
 *     summary: Deletar lista
 *     description: Remove uma lista de mangás (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     responses:
 *       204:
 *         description: Lista deletada com sucesso
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
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/mangalist/{id}/items:
 *   post:
 *     summary: Adicionar mangá à lista
 *     description: Adiciona um mangá à lista (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMangaToList'
 *     responses:
 *       201:
 *         description: Mangá adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaListItem'
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
 *         description: Lista ou mangá não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Mangá já está na lista
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/mangalist/{listId}/items/{itemId}:
 *   put:
 *     summary: Atualizar item da lista
 *     description: Atualiza um item da lista (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMangaListItem'
 *     responses:
 *       200:
 *         description: Item atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaListItem'
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
 *         description: Lista ou item não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/mangalist/{listId}/items/{itemId}:
 *   delete:
 *     summary: Remover mangá da lista
 *     description: Remove um mangá da lista (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do item
 *     responses:
 *       204:
 *         description: Mangá removido com sucesso
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
 *         description: Lista ou item não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/mangalist/{id}/items/reorder:
 *   put:
 *     summary: Reordenar itens
 *     description: Reordena os itens da lista (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReorderItems'
 *     responses:
 *       200:
 *         description: Itens reordenados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
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
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/mangalist/{id}/items/bulk:
 *   post:
 *     summary: Adicionar múltiplos mangás
 *     description: Adiciona múltiplos mangás à lista (apenas administradores)
 *     tags: [Listas de Mangás - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkAddMangas'
 *     responses:
 *       200:
 *         description: Mangás adicionados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkAddResult'
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
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /mangalist/{id}/stats:
 *   get:
 *     summary: Obter estatísticas da lista
 *     description: Retorna estatísticas da lista de mangás
 *     tags: [Listas de Mangás]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaListStats'
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
 *       404:
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /mangalist/mood/{mood}:
 *   get:
 *     summary: Listar por mood
 *     description: Retorna listas de mangás filtradas por mood
 *     tags: [Listas de Mangás]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mood
 *         required: true
 *         schema:
 *           type: string
 *         description: Mood para filtrar
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
 *           default: 20
 *         description: Número de itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, likesCount]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da ordenação
 *     responses:
 *       200:
 *         description: Listas filtradas por mood retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MangaListListResponse'
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

// Criar lista de mangás
export const create: RequestHandler = async (req, res) => {
  try {
    const validatedData = createMangaListSchema.parse(req.body);
    const mangaList = await mangaListHandlers.createMangaList(validatedData);
    res.status(201).json(mangaList);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Listar listas de mangás
export const list: RequestHandler = async (req, res) => {
  try {
    const { page, limit, filters } = mangaListHandlers.processPaginationFromQuery(req.query);
    const result = await mangaListHandlers.getMangaLists(filters);
    res.status(200).json(result);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Listar listas públicas
export const listPublic: RequestHandler = async (req, res) => {
  try {
    const { page, limit, filters } = mangaListHandlers.processPaginationFromQuery(req.query);
    const result = await mangaListHandlers.getPublicMangaLists(filters);
    res.status(200).json(result);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Obter lista por ID
export const get: RequestHandler = async (req, res) => {
  try {
    const validatedParams = mangaListParamsSchema.parse(req.params);
    const mangaList = await mangaListHandlers.getMangaListById(validatedParams.id);
    res.status(200).json(mangaList);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Atualizar lista
export const update: RequestHandler = async (req, res) => {
  try {
    const paramsValidation = mangaListParamsSchema.parse(req.params);
    const bodyValidation = updateMangaListSchema.parse(req.body);
    
    const mangaList = await mangaListHandlers.updateMangaList(
      paramsValidation.id, 
      bodyValidation
    );
    
    res.status(200).json(mangaList);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Deletar lista
export const remove: RequestHandler = async (req, res) => {
  try {
    const validatedParams = mangaListParamsSchema.parse(req.params);
    await mangaListHandlers.deleteMangaList(validatedParams.id);
    res.status(204).send();
  } catch (error) {
    handleZodError(error, res);
  }
};

// Adicionar mangá à lista
export const addManga: RequestHandler = async (req, res) => {
  try {
    const paramsValidation = mangaListParamsSchema.parse(req.params);
    const bodyValidation = addMangaToListSchema.parse(req.body);
    
    const addedItem = await mangaListHandlers.addMangaToList(
      paramsValidation.id, 
      bodyValidation
    );
    
    res.status(201).json(addedItem);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Remover mangá da lista
export const removeManga: RequestHandler = async (req, res) => {
  try {
    const validatedParams = mangaListItemParamsSchema.parse(req.params);
    await mangaListHandlers.removeMangaFromList(
      validatedParams.listId, 
      validatedParams.itemId
    );
    
    res.status(204).send();
  } catch (error) {
    handleZodError(error, res);
  }
};

// Atualizar item da lista
export const updateMangaItem: RequestHandler = async (req, res) => {
  try {
    const paramsValidation = mangaListItemParamsSchema.parse(req.params);
    const bodyValidation = updateMangaListItemSchema.parse(req.body);
    
    const updatedItem = await mangaListHandlers.updateMangaListItem(
      paramsValidation.listId, 
      paramsValidation.itemId, 
      bodyValidation
    );
    
    res.status(200).json(updatedItem);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Reordenar itens
export const reorderItems: RequestHandler = async (req, res) => {
  try {
    const paramsValidation = mangaListParamsSchema.parse(req.params);
    const bodyValidation = reorderMangaListItemsSchema.parse(req.body);
    
    await mangaListHandlers.reorderMangaListItems(
      paramsValidation.id, 
      bodyValidation
    );
    
    res.status(200).json({ message: 'Itens reordenados com sucesso' });
  } catch (error) {
    handleZodError(error, res);
  }
};

// Adicionar múltiplos mangás
export const bulkAddMangas: RequestHandler = async (req, res) => {
  try {
    const paramsValidation = mangaListParamsSchema.parse(req.params);
    const bodyValidation = bulkAddToMangaListSchema.parse(req.body);
    
    const result = await mangaListHandlers.bulkAddMangasToList(
      paramsValidation.id, 
      bodyValidation
    );
    
    res.status(200).json(result);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Obter estatísticas
export const getStats: RequestHandler = async (req, res) => {
  try {
    const validatedParams = mangaListParamsSchema.parse(req.params);
    const stats = await mangaListHandlers.getMangaListStats(validatedParams.id);
    res.status(200).json(stats);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Obter por mood
export const getByMood: RequestHandler = async (req, res) => {
  try {
    const { mood } = req.params;
    const { page, limit, filters } = mangaListHandlers.processPaginationFromQuery(req.query);
    
    const result = await mangaListHandlers.getMangaListsByMood(mood, filters);
    
    res.status(200).json(result);
  } catch (error) {
    handleZodError(error, res);
  }
};

// Health check
export const healthCheck: RequestHandler = async (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Serviço MangaList funcionando', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(500).json({ error: message });
  }
};

