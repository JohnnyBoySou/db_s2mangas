import { Request, Response, NextFunction } from "express";
import {
  createMangaListSchema,
  updateMangaListSchema,
  addMangaToListSchema,
  updateMangaListItemSchema,
  reorderMangaListItemsSchema,
  bulkAddToMangaListSchema,
  mangaListFiltersSchema,
  mangaListParamsSchema,
  mangaListItemParamsSchema,
} from "@/schemas/mangaListSchemas";
import { handleZodError } from "@/utils/zodError";
import {
  createMangaList,
  getMangaLists,
  getMangaListById,
  updateMangaList,
  deleteMangaList,
  addMangaToList,
  removeMangaFromList,
  updateMangaListItem,
  reorderMangaListItems,
  bulkAddToMangaList,
} from "@/handlers/mangaList";

type RequestHandler = (
  req: Request,
  res: Response,
  _next?: NextFunction
) => Promise<void>;

export const create: RequestHandler = async (req, res) => {
  const parsed = createMangaListSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  try {
    const mangaList = await createMangaList(parsed.data);
    res.status(201).json(mangaList);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const list: RequestHandler = async (req, res) => {
  const parsed = mangaListFiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  try {
    const result = await getMangaLists(parsed.data);
    res.status(200).json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const get: RequestHandler = async (req, res) => {
  const parsed = mangaListParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  try {
    const mangaList = await getMangaListById(parsed.data.id);
    if (!mangaList) {
      res.status(404).json({ error: "Lista não encontrada." });
      return;
    }
    res.json(mangaList);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const update: RequestHandler = async (req, res) => {
  const parsed = updateMangaListSchema.safeParse({
    ...req.body,
    ...req.params,
  });
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

const { id } = req.params;
const data = parsed.data;

  try {
    const mangaList = await updateMangaList(id, data);
    if (!mangaList) {
      res.status(404).json({ error: "Lista não encontrada." });
      return;
    }
    res.json(mangaList);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Lista não encontrada.") {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message === "Você não tem permissão para editar esta lista.") {
        res.status(403).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const remove: RequestHandler = async (req, res) => {
  const parsed = mangaListParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  try {
    await deleteMangaList(parsed.data.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Lista não encontrada.") {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message === "Você não tem permissão para deletar esta lista.") {
        res.status(403).json({ error: err.message });
        return;
      }
    }
    handleZodError(err, res);
  }
};

export const addManga: RequestHandler = async (req, res) => {
  const paramsValidation = mangaListParamsSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    res.status(400).json(paramsValidation.error);
    return;
  }

  const bodyValidation = addMangaToListSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    res.status(400).json(bodyValidation.error);
    return;
  }

  try {
    const added = await addMangaToList(
      paramsValidation.data.id,
      bodyValidation.data
    );

    if (!added) {
      res.status(400).json({ error: "Não foi possível adicionar o manga à lista." });
      return;
    }

    res.status(201).json(added);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const removeManga: RequestHandler = async (req, res) => {
  const parsed = mangaListItemParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json(parsed.error);
    return;
  }

  try {
    const removed = await removeMangaFromList(
      parsed.data.listId,
      parsed.data.itemId
    );

    if (!removed) {
      res.status(404).json({ error: "Item não encontrado." });
      return;
    }

    res.status(204).send();
  } catch (err) {
    handleZodError(err, res);
  }
};

export const updateMangaItem: RequestHandler = async (req, res) => {
  const paramsValidation = mangaListItemParamsSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    res.status(400).json(paramsValidation.error);
    return;
  }

  const bodyValidation = updateMangaListItemSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    res.status(400).json(bodyValidation.error);
    return;
  }

  try {
    const updated = await updateMangaListItem(
      paramsValidation.data.listId,
      paramsValidation.data.itemId,
      bodyValidation.data
    );

    if (!updated) {
      res.status(404).json({ error: "Item não encontrado." });
      return;
    }

    res.json(updated);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const reorderItems: RequestHandler = async (req, res) => {
  const paramsValidation = mangaListParamsSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    res.status(400).json(paramsValidation.error);
    return;
  }

  const bodyValidation = reorderMangaListItemsSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    res.status(400).json(bodyValidation.error);
    return;
  }

  try {
    const reordered = await reorderMangaListItems(
      paramsValidation.data.id,
      bodyValidation.data
    );

    if (!reordered) {
      res.status(404).json({ error: "Lista não encontrada." });
      return;
    }

    res.json(reordered);
  } catch (err) {
    handleZodError(err, res);
  }
};

export const bulkAddMangas: RequestHandler = async (req, res) => {
  const paramsValidation = mangaListParamsSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    res.status(400).json(paramsValidation.error);
    return;
  }

  const bodyValidation = bulkAddToMangaListSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    res.status(400).json(bodyValidation.error);
    return;
  }

  try {
    const result = await bulkAddToMangaList(
      paramsValidation.data.id,
      bodyValidation.data
    );

    res.json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

