import { RequestHandler } from 'express';
import { getPaginationParams } from '@/utils/pagination';
import { handleZodError } from '@/utils/zodError';
import * as libraryHandlers from '@/handlers/library';
import { upsertSchema, updateFlagsSchema } from '@/schemas/librarySchemas';
import { z } from 'zod';

const toggleTypeSchema = z.enum(['progress', 'complete', 'favorite', 'following']);

export const upsertLibraryEntry: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  try {
    const body = upsertSchema.parse(req.body);
    const entry = await libraryHandlers.upsertLibraryEntry({
      userId,
      ...body
    });
    res.json(entry);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const updateLibraryEntry: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;

  try {
    const body = updateFlagsSchema.parse(req.body);
    const updated = await libraryHandlers.updateLibraryEntry({
      userId,
      ...body
    });
    res.json(updated);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const removeLibraryEntry: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const mangaId = req.params.mangaId;

  try {
    await libraryHandlers.removeLibraryEntry(userId, mangaId);
    res.status(204).send();
  } catch (err) {
    handleZodError(err, res);
  }
};

export const listLibrary: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const { take, page } = getPaginationParams(req);
  const type = req.params.type;

  try {
    const result = await libraryHandlers.listLibrary(userId, type, page, take);
    res.json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const toggleLibraryEntry: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;

    console.log("iniciou o toggle")
    const { mangaId, type } = req.params;

    try {
        // Valida o tipo
        const validatedType = toggleTypeSchema.parse(type);
        
        const result = await libraryHandlers.toggleLibraryEntry({
            userId,
            mangaId,
            type: validatedType
        });
        res.json(result);
    } catch (err) {
        handleZodError(err, res);
    }
};

export const checkMangaStatus: RequestHandler = async (req, res) => {
    const userId = (req as any).user?.id;
    const { mangaId } = req.params;

    try {
        const status = await libraryHandlers.checkMangaStatus(userId, mangaId);
        res.json(status);
    } catch (err) {
        handleZodError(err, res);
    }
};
