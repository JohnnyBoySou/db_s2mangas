// middlewares/requireAuth.ts
import { RequestHandler, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token ausente" });
    return 
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    (req as any).user = { id: decoded.id };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
    return 
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!(req as any).user?.isAdmin) {
    res.status(403).json({ message: "Acesso negado" });
    return 
  }
  next();
};
