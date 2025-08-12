import { Request, Response } from "express";
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionIdSchema,
} from "../validators/CollectionValidator";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from "@/utils/pagination";
import {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  listPublicCollections,
  checkMangaInCollections,
  toggleMangaInCollection,
} from "../handlers/CollectionHandler";

/**
 * @swagger
 * components:
 *   schemas:
 *     Collection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da coleção
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário criador
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome da coleção
 *           example: "Meus Mangás Favoritos"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Descrição da coleção
 *           example: "Uma coleção dos meus mangás favoritos"
 *         status:
 *           type: string
 *           enum: [PRIVATE, PUBLIC]
 *           description: Status de visibilidade da coleção
 *           example: "PUBLIC"
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
 *         mangas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Manga'
 *           description: Lista de mangás na coleção
 *         _count:
 *           type: object
 *           properties:
 *             likes:
 *               type: number
 *               description: Número de curtidas
 *               example: 15
 *             mangas:
 *               type: number
 *               description: Número de mangás
 *               example: 25
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: ID do usuário
 *             name:
 *               type: string
 *               description: Nome do usuário
 *             avatar:
 *               type: string
 *               nullable: true
 *               description: URL do avatar
 *             username:
 *               type: string
 *               description: Nome de usuário
 *         likes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CollectionLike'
 *           description: Lista de curtidas
 *     CollectionCreate:
 *       type: object
 *       required:
 *         - name
 *         - cover
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome da coleção
 *           example: "Meus Mangás Favoritos"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         description:
 *           type: string
 *           description: Descrição da coleção
 *           example: "Uma coleção dos meus mangás favoritos"
 *         status:
 *           type: string
 *           enum: [PRIVATE, PUBLIC]
 *           default: "PRIVATE"
 *           description: Status de visibilidade
 *           example: "PUBLIC"
 *         mangaIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: IDs dos mangás para adicionar
 *           example: ["123e4567-e89b-12d3-a456-426614174000"]
 *     CollectionUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome da coleção
 *           example: "Meus Mangás Favoritos"
 *         cover:
 *           type: string
 *           format: uri
 *           description: URL da imagem de capa
 *           example: "https://example.com/cover.jpg"
 *         description:
 *           type: string
 *           description: Descrição da coleção
 *           example: "Uma coleção dos meus mangás favoritos"
 *         status:
 *           type: string
 *           enum: [PRIVATE, PUBLIC]
 *           description: Status de visibilidade
 *           example: "PUBLIC"
 *     CollectionListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Collection'
 *           description: Lista de coleções
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: Total de coleções
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
 *     CollectionLike:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID da curtida
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário que curtiu
 *         collectionId:
 *           type: string
 *           format: uuid
 *           description: ID da coleção curtida
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data da curtida
 *     ToggleResponse:
 *       type: object
 *       properties:
 *         added:
 *           type: boolean
 *           description: Se o mangá foi adicionado ou removido
 *           example: true
 *         message:
 *           type: string
 *           description: Mensagem de confirmação
 *           example: "Mangá adicionado à coleção"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Coleção não encontrada"
 */

/**
 * @swagger
 * /collections:
 *   post:
 *     summary: Criar nova coleção
 *     description: Cria uma nova coleção para o usuário autenticado
 *     tags: [Coleções]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionCreate'
 *     responses:
 *       201:
 *         description: Coleção criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
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
 *   get:
 *     summary: Listar coleções do usuário
 *     description: Retorna as coleções do usuário autenticado
 *     tags: [Coleções]
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
 *         description: Limite por página
 *     responses:
 *       200:
 *         description: Lista de coleções retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollectionListResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /collections/public:
 *   get:
 *     summary: Listar coleções públicas
 *     description: Retorna uma lista de coleções públicas de todos os usuários
 *     tags: [Coleções]
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
 *         description: Limite por página
 *     responses:
 *       200:
 *         description: Lista de coleções públicas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollectionListResponse'
 */

/**
 * @swagger
 * /collections/{id}:
 *   get:
 *     summary: Obter coleção por ID
 *     description: Retorna uma coleção específica (se o usuário tem permissão)
 *     tags: [Coleções]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da coleção
 *       - in: query
 *         name: lg
 *         schema:
 *           type: string
 *           default: "pt-BR"
 *         description: Idioma para traduções
 *     responses:
 *       200:
 *         description: Coleção encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       403:
 *         description: Sem permissão para visualizar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Coleção não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Atualizar coleção
 *     description: Atualiza uma coleção existente (se o usuário tem permissão)
 *     tags: [Coleções]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da coleção
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionUpdate'
 *     responses:
 *       200:
 *         description: Coleção atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       403:
 *         description: Sem permissão para editar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Coleção não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Deletar coleção
 *     description: Remove uma coleção (se o usuário tem permissão)
 *     tags: [Coleções]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da coleção
 *     responses:
 *       204:
 *         description: Coleção deletada com sucesso
 *       403:
 *         description: Sem permissão para deletar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Coleção não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /collections/check/{mangaId}:
 *   get:
 *     summary: Verificar mangá em coleções
 *     description: Verifica em quais coleções do usuário um mangá específico está
 *     tags: [Coleções]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do mangá
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
 *         description: Limite por página
 *     responses:
 *       200:
 *         description: Verificação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollectionListResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /collections/{id}/toggle/{mangaId}:
 *   post:
 *     summary: Alternar mangá na coleção
 *     description: Adiciona ou remove um mangá de uma coleção específica
 *     tags: [Coleções]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da coleção
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do mangá
 *     responses:
 *       200:
 *         description: Operação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToggleResponse'
 *       403:
 *         description: Sem permissão para modificar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Coleção não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const create = async (req: Request, res: Response) => {
  const parsed = createCollectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const collection = await createCollection({
      userId,
      ...parsed.data,
      status: parsed.data.status ?? "PRIVATE",
    });
    res.status(201).json(collection);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const list = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { page, take } = getPaginationParams(req);

  try {
    const result = await listCollections(userId, page, take);
    res.status(200).json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const get = async (req: Request, res: Response) => {
  const parsed = collectionIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const language = (req.query.lg as string) || "pt-BR";
    const collection = await getCollection(parsed.data.id, userId, language);
    if (!collection) {
      res.status(404).json({ error: "Coleção não encontrada." });
      return;
    }
    res.json(collection);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Coleção não encontrada.") {
        res.status(404).json({ error: err.message });
        return;
      }
      if (
        err.message === "Você não tem permissão para visualizar esta coleção."
      ) {
        res.status(403).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const update = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = updateCollectionSchema.safeParse({
    ...req.body,
    ...req.params,
  });
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  const { id, ...data } = parsed.data;

  try {
    const collection = await updateCollection(id, userId, data);
    if (!collection) {
      res.status(404).json({ error: "Coleção não encontrada." });
      return;
    }
    res.json(collection);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Coleção não encontrada.") {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message === "Você não tem permissão para editar esta coleção.") {
        res.status(403).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const remove = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = collectionIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  try {
    await deleteCollection(parsed.data.id, userId);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Coleção não encontrada.") {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message === "Você não tem permissão para deletar esta coleção.") {
        res.status(403).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const listPublic = async (req: Request, res: Response) => {
  const { page, take } = getPaginationParams(req);

  try {
    const result = await listPublicCollections(page, take);
    res.json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const checkInCollections = async (req: Request, res: Response) => {
  const { mangaId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { page, take } = getPaginationParams(req);

  try {
    const result = await checkMangaInCollections(mangaId, userId, page, take);
    res.status(200).json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const toggleCollection = async (req: Request, res: Response) => {
  const { id, mangaId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await toggleMangaInCollection(id, mangaId, userId);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Coleção não encontrada") {
        res.status(404).json({ error: err.message });
        return;
      }
      if (
        err.message === "Você não tem permissão para modificar esta coleção"
      ) {
        res.status(403).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};
