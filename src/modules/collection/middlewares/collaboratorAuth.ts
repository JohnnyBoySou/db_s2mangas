import { Request, Response, NextFunction } from "express";
import { checkUserPermission } from "../handlers/CollaboratorHandler";

export const requireCollectionOwner = async (req: Request, res: Response, next: NextFunction) => {
  const collectionId = req.params.id;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const permission = await checkUserPermission(collectionId, userId);
    
    if (!permission.isOwner) {
      return res.status(403).json({ error: "Apenas o dono da coleção pode realizar esta ação." });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "Coleção não encontrada." });
  }
};

export const requireCollectionAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const collectionId = req.params.id;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const permission = await checkUserPermission(collectionId, userId);
    
    if (!permission.hasPermission || (!permission.isOwner && permission.role !== 'ADMIN')) {
      return res.status(403).json({ error: "Você não tem permissão para realizar esta ação." });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "Coleção não encontrada." });
  }
};

export const requireCollectionEditor = async (req: Request, res: Response, next: NextFunction) => {
  const collectionId = req.params.id;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const permission = await checkUserPermission(collectionId, userId);
    
    if (!permission.hasPermission) {
      return res.status(403).json({ error: "Você não tem permissão para realizar esta ação." });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(404).json({ error: "Coleção não encontrada." });
  }
};
