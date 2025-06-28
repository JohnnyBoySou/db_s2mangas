import { RequestHandler } from 'express';
import * as profileHandler from '@/handlers/profile';
import { z } from 'zod';

// Schemas de validação
const searchProfilesSchema = z.object({
  q: z.string().min(1, 'Query é obrigatória').max(100, 'Query muito longa'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 10, 50) : 10)
});

const similarProfilesSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido'),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 10, 20) : 10)
});

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!username) {
      res.status(400).json({ error: 'Username é obrigatório' });
      return;
    }

    const profile = await profileHandler.getProfileData(username, userId);
    res.json(profile);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const likeProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const like = await profileHandler.likeProfile(userId, username);
    res.status(201).json(like);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const searchProfiles: RequestHandler = async (req, res) => {
  try {
    const validatedQuery = searchProfilesSchema.parse(req.query);
    const userId = req.user?.id;

    const result = await profileHandler.searchProfiles({
      query: validatedQuery.q,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      authenticatedUserId: userId
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors.map(e => e.message)
      });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const getSimilarProfiles: RequestHandler = async (req, res) => {
  try {
    const validatedParams = similarProfilesSchema.parse({
      userId: req.params.userId,
      limit: req.query.limit as string
    });
    const authenticatedUserId = req.user?.id;

    const profiles = await profileHandler.getSimilarProfiles({
      userId: validatedParams.userId,
      authenticatedUserId,
      limit: validatedParams.limit
    });

    res.json({ profiles });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors.map(e => e.message)
      });
      return;
    }
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const unlikeProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;


    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    await profileHandler.unlikeProfile(userId, username);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const toggleFollowProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    const result = await profileHandler.toggleFollowProfile(userId, username);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const toggleLikeProfile: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!userId || !username) {
      throw new Error('Usuário não autenticado');
    }
    const result = await profileHandler.toggleLikeProfile(userId, username);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Perfil não encontrado') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const listProfiles: RequestHandler = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50); // Máximo 50 por página
    
    const result = await profileHandler.listProfiles(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};