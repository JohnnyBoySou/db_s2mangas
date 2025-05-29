import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleZodError } from '@/utils/zodError';
import { z } from 'zod';

const prisma = new PrismaClient();

const wallpaperImageSchema = z.object({
  imageUrl: z.string().url('URL da imagem inválida')
});

const createWallpaperSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  cover: z.string().url('URL da capa inválida'),
  price: z.number().int().min(0, 'Preço deve ser maior ou igual a 0'),
  images: z.array(wallpaperImageSchema).min(1, 'Pelo menos uma imagem é necessária')
});

const updateWallpaperSchema = createWallpaperSchema.partial();

export const getWallpapers = async (req: Request, res: Response) => {
  try {
    const wallpapers = await prisma.wallpaper.findMany({
      include: {
        images: true
      }
    });

    return res.json(wallpapers);
  } catch (error) {
    handleZodError(error, res);
  }
};

export const getWallpaperById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const wallpaper = await prisma.wallpaper.findUnique({
      where: { id },
      include: {
        images: true
      }
    });

    if (!wallpaper) {
      return res.status(404).json({ error: 'Wallpaper não encontrado' });
    }

    return res.json(wallpaper);
  } catch (error) {
    handleZodError(error, res);
  }
};

export const createWallpaper = async (req: Request, res: Response) => {
  try {
    const data = createWallpaperSchema.parse(req.body);

    const wallpaper = await prisma.wallpaper.create({
      data: {
        name: data.name,
        description: data.description,
        cover: data.cover,
        price: data.price,
        images: {
          create: data.images.map(image => ({
            imageUrl: image.imageUrl
          }))
        }
      },
      include: {
        images: true
      }
    });

    return res.status(201).json(wallpaper);
  } catch (error) {
    handleZodError(error, res);
  }
};

export const updateWallpaper = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = updateWallpaperSchema.parse(req.body);

    const wallpaper = await prisma.wallpaper.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        cover: data.cover,
        price: data.price,
        images: data.images ? {
          deleteMany: {},
          create: data.images.map(image => ({
            imageUrl: image.imageUrl
          }))
        } : undefined
      },
      include: {
        images: true
      }
    });

    return res.json(wallpaper);
  } catch (error) {
    handleZodError(error, res);
  }
};

export const deleteWallpaper = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.wallpaper.delete({
      where: { id }
    });

    return res.status(204).send();
  } catch (error) {
    handleZodError(error, res);
  }
};
