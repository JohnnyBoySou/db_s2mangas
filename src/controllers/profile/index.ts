import { RequestHandler } from 'express';
import * as profileHandler from '@/handlers/profile';

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