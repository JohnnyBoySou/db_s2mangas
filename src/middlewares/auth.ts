import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import prisma from "@/prisma/client";
import { getRedisClient } from "@/config/redis";

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_CACHE_TTL = 60 * 60;

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error)
    res.status(401).json({ error: "Token inválido" });
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    // const redis = getRedisClient();

    // // Tenta buscar do cache primeiro
    // const cacheKey = `admin:${userId}`;
    // const cachedIsAdmin = await redis?.get(cacheKey);

    // if (cachedIsAdmin !== null) {
    //   if (cachedIsAdmin === 'true') {
    //     next();
    //     return;
    //   } else {
    //     res.status(403).json({ message: "Acesso negado. Apenas administradores podem acessar este recurso." });
    //     return;
    //   }
    // }

    // Se não estiver em cache, busca do banco
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });

    // Salva no cache
    // await redis?.set(cacheKey, user?.isAdmin ? 'true' : 'false');
    // await redis?.expire(cacheKey, ADMIN_CACHE_TTL);

    if (!user?.isAdmin) {
      res.status(403).json({ message: "Acesso negado. Apenas administradores podem acessar este recurso." });
      return;
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar privilégios de admin:", error);
    res.status(500).json({ message: "Erro ao verificar privilégios de administrador" });
  }
};
