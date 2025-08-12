import prisma from '@/prisma/client';
import { RequestHandler, Request, Response } from 'express';
import { handleZodError } from '@/utils/zodError';
import * as analyticsHandlers from '@/handlers/analytics';

export async function ping(req: Request, res: Response) {
  try {
    await prisma.$connect();
    res.status(200).json({ message: 'pong', dbStatus: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  } finally {
    await prisma.$disconnect();
  }
}

export const getGeneralStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getGeneralStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getViewsByPeriod: RequestHandler = async (req, res): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
            return;
        }

        const stats = await analyticsHandlers.getViewsByPeriod({
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string)
        });

        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostViewedMangas: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const mangas = await analyticsHandlers.getMostViewedMangas(limit);
        res.status(200).json(mangas);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostLikedMangas: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const mangas = await analyticsHandlers.getMostLikedMangas(limit);
        res.status(200).json(mangas);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostCommentedMangas: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const mangas = await analyticsHandlers.getMostCommentedMangas(limit);
        res.status(200).json(mangas);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getUsersByPeriod: RequestHandler = async (req, res): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
            return;
        }

        const stats = await analyticsHandlers.getUsersByPeriod({
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string)
        });

        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMostActiveUsers: RequestHandler = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const users = await analyticsHandlers.getMostActiveUsers(limit);
        res.status(200).json(users);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getCategoryStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getCategoryStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getLanguageStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getLanguageStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMangaTypeStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getMangaTypeStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const getMangaStatusStats: RequestHandler = async (_req, res) => {
    try {
        const stats = await analyticsHandlers.getMangaStatusStats();
        res.status(200).json(stats);
    } catch (err) {
        handleZodError(err, res);
    }
};