import { RequestHandler } from 'express';
import prisma from '@/prisma/client';

export const requireAdmin: RequestHandler = async (req, res, next) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Não autorizado" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true }
        });

        if (!user?.isAdmin) {
            res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar este recurso." });
            return;
        }

        next();
    } catch (error) {
        console.error('Erro ao verificar privilégios de admin:', error);
        res.status(500).json({ error: "Erro interno ao verificar privilégios" });
    }
}; 