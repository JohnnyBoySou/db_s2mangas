import { Request, Response } from "express";
import {
  addCollaboratorSchema,
  removeCollaboratorSchema,
  updateCollaboratorRoleSchema,
  listCollaboratorsSchema,
  collectionIdParamSchema,
  userIdParamSchema,
} from "../validators/CollaboratorValidator";
import { handleZodError } from "@/utils/zodError";
import {
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  listCollaborators,
  checkUserPermission,
} from "../handlers/CollaboratorHandler";
import { z } from "zod";

/**
 * @swagger
 * components:
 *   schemas:
 *     Collaborator:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do colaborador
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário colaborador
 *         collectionId:
 *           type: string
 *           format: uuid
 *           description: ID da coleção
 *         role:
 *           type: string
 *           enum: [EDITOR, ADMIN]
 *           description: Papel do colaborador
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de adição como colaborador
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             username:
 *               type: string
 *             avatar:
 *               type: string
 *               nullable: true
 *     AddCollaboratorRequest:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário a ser adicionado
 *         role:
 *           type: string
 *           enum: [EDITOR, ADMIN]
 *           default: "EDITOR"
 *           description: Papel do colaborador
 *     UpdateCollaboratorRoleRequest:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         role:
 *           type: string
 *           enum: [EDITOR, ADMIN]
 *           description: Novo papel do colaborador
 */

/**
 * @swagger
 * /collections/{id}/collaborators:
 *   post:
 *     summary: Adicionar colaborador à coleção
 *     description: Adiciona um usuário como colaborador de uma coleção
 *     tags: [Colaboradores]
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
 *             $ref: '#/components/schemas/AddCollaboratorRequest'
 *     responses:
 *       201:
 *         description: Colaborador adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collaborator'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão para adicionar colaboradores
 *       404:
 *         description: Coleção ou usuário não encontrado
 *   get:
 *     summary: Listar colaboradores da coleção
 *     description: Retorna a lista de colaboradores de uma coleção
 *     tags: [Colaboradores]
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
 *       200:
 *         description: Lista de colaboradores retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Collaborator'
 *       403:
 *         description: Sem permissão para visualizar colaboradores
 *       404:
 *         description: Coleção não encontrada
 */

/**
 * @swagger
 * /collections/{id}/collaborators/{userId}:
 *   put:
 *     summary: Atualizar papel do colaborador
 *     description: Atualiza o papel de um colaborador na coleção
 *     tags: [Colaboradores]
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
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário colaborador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCollaboratorRoleRequest'
 *     responses:
 *       200:
 *         description: Papel atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collaborator'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão para atualizar colaborador
 *       404:
 *         description: Coleção ou colaborador não encontrado
 *   delete:
 *     summary: Remover colaborador da coleção
 *     description: Remove um usuário como colaborador de uma coleção
 *     tags: [Colaboradores]
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
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário colaborador
 *     responses:
 *       200:
 *         description: Colaborador removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Colaborador removido com sucesso."
 *       403:
 *         description: Sem permissão para remover colaborador
 *       404:
 *         description: Coleção ou colaborador não encontrado
 */

export const addCollaboratorToCollection = async (req: Request, res: Response) => {
  const collectionIdParsed = collectionIdParamSchema.safeParse(req.params);
  if (!collectionIdParsed.success) {
    res.status(400).json(collectionIdParsed.error);
    return;
  }

  const bodyParsed = addCollaboratorSchema.safeParse({
    collectionId: collectionIdParsed.data.id,
    ...req.body,
  });
  if (!bodyParsed.success) {
    res.status(400).json(bodyParsed.error);
    return;
  }

  const currentUserId = (req as any).user?.id;
  if (!currentUserId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  try {
    // Verificar se o usuário atual tem permissão para adicionar colaboradores
    const permission = await checkUserPermission(collectionIdParsed.data.id, currentUserId);
    
    if (!permission.hasPermission || (!permission.isOwner && permission.role !== 'ADMIN')) {
      res.status(403).json({ error: "Você não tem permissão para adicionar colaboradores a esta coleção." });
      return;
    }

    const collaborator = await addCollaborator(bodyParsed.data);
    res.status(201).json(collaborator);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("não encontrada") || err.message.includes("não encontrado")) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message.includes("já é colaborador")) {
        res.status(400).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const listCollectionCollaborators = async (req: Request, res: Response) => {
  const parsed = collectionIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  const currentUserId = (req as any).user?.id;
  if (!currentUserId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  try {
    // Verificar se o usuário atual tem permissão para ver colaboradores
    const permission = await checkUserPermission(parsed.data.id, currentUserId);
    
    if (!permission.hasPermission) {
      res.status(403).json({ error: "Você não tem permissão para visualizar colaboradores desta coleção." });
      return;
    }

    const collaborators = await listCollaborators(parsed.data.id);
    res.status(200).json(collaborators);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("não encontrada")) {
        res.status(404).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const updateCollaboratorRoleInCollection = async (req: Request, res: Response) => {
  const paramsParsed = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
  }).safeParse(req.params);
  
  if (!paramsParsed.success) {
    res.status(400).json(paramsParsed.error);
    return;
  }

  const bodyParsed = updateCollaboratorRoleSchema.safeParse({
    collectionId: paramsParsed.data.id,
    userId: paramsParsed.data.userId,
    ...req.body,
  });
  if (!bodyParsed.success) {
    res.status(400).json(bodyParsed.error);
    return;
  }

  const currentUserId = (req as any).user?.id;
  if (!currentUserId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  try {
    // Verificar se o usuário atual tem permissão para atualizar colaboradores
    const permission = await checkUserPermission(paramsParsed.data.id, currentUserId);
    
    if (!permission.hasPermission || (!permission.isOwner && permission.role !== 'ADMIN')) {
      res.status(403).json({ error: "Você não tem permissão para atualizar colaboradores desta coleção." });
      return;
    }

    const collaborator = await updateCollaboratorRole(bodyParsed.data);
    res.status(200).json(collaborator);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("não encontrado")) {
        res.status(404).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const removeCollaboratorFromCollection = async (req: Request, res: Response) => {
  const paramsParsed = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
  }).safeParse(req.params);
  
  if (!paramsParsed.success) {
    res.status(400).json(paramsParsed.error);
    return;
  }

  const currentUserId = (req as any).user?.id;
  if (!currentUserId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  try {
    // Verificar se o usuário atual tem permissão para remover colaboradores
    const permission = await checkUserPermission(paramsParsed.data.id, currentUserId);
    
    if (!permission.hasPermission || (!permission.isOwner && permission.role !== 'ADMIN')) {
      res.status(403).json({ error: "Você não tem permissão para remover colaboradores desta coleção." });
      return;
    }

    const result = await removeCollaborator({
      collectionId: paramsParsed.data.id,
      userId: paramsParsed.data.userId,
    });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("não encontrado")) {
        res.status(404).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};
