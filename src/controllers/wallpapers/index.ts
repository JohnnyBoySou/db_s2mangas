import type { RequestHandler } from "express";
import { handleZodError } from '@/utils/zodError';
import * as wallpaperHandlers from '@/handlers/wallpapers';

export const getWallpapers: RequestHandler = async (req, res) => {
  try {
    const result = await wallpaperHandlers.getWallpapers(req);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar wallpapers no controller:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro interno ao buscar wallpapers' });
  }
};

export const getWallpaperById: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const wallpaper = await wallpaperHandlers.getWallpaperById(id, req);
    res.json(wallpaper);
  } catch (error) {
    if (error instanceof Error && error.message === 'Wallpaper não encontrado') {
      res.status(404).json({ error: error.message });
    }
    handleZodError(error, res);
  }
};

export const createWallpaper: RequestHandler = async (req, res) => {
  try {
    const wallpaper = await wallpaperHandlers.createWallpaper(req.body);
    res.status(201).json(wallpaper);
  } catch (error) {
    console.log(error)
    handleZodError(error, res);
  }
};

export const updateWallpaper: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const wallpaper = await wallpaperHandlers.updateWallpaper(id, req.body);
    res.json(wallpaper);
  } catch (error) {
    handleZodError(error, res);
  }
};

export const deleteWallpaper: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    await wallpaperHandlers.deleteWallpaper(id);
    res.status(204).send();
  } catch (error) {
    console.log(error)
    handleZodError(error, res);
  }
};

export const importWallpapers: RequestHandler = async (req, res) => {
  try {
    const result = await wallpaperHandlers.importFromJson();
    res.json(result);
  } catch (error) {
    console.error('Erro ao importar wallpapers:', error);
    res.status(500).json({ error: 'Erro ao importar wallpapers' });
  }
};

export const toggleWallpaperImage: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;

  if (!image) {
    res.status(400).json({ error: 'URL da imagem é obrigatória' });
  }

  try {
    const result = await wallpaperHandlers.toggleWallpaperImage(id, image);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Wallpaper não encontrado') {
      res.status(404).json({ error: error.message });
    }
    handleZodError(error, res);
  }
};

export const importPinterestWallpaper: RequestHandler = async (req, res) => {
  try {
    const { pinterestUrl } = req.body;

    if (!pinterestUrl) {
      res.status(400).json({
        success: false,
        message: 'URL do Pinterest é obrigatória'
      });
    }

    const result = await wallpaperHandlers.importFromPinterest(pinterestUrl);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro no controller importPinterestWallpaper:', error);
    res.status(500).json({
      success: false,
      message: error.message ?? 'Erro ao importar wallpaper do Pinterest'
    });
  }
};
