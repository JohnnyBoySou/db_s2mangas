import { Router } from 'express';
import { list, get, create, update, remove, addManga, removeManga, updateMangaItem, reorderItems, bulkAddMangas } from '@/controllers/mangaList';
import { requireAuth, requireAdmin } from "@/middlewares/auth";

const MangaListRouter = Router();
const AdminMangaListRouter = Router();

MangaListRouter.get('/', list);
MangaListRouter.get('/:id', get);

AdminMangaListRouter.post('/', requireAuth, requireAdmin, create);
AdminMangaListRouter.put('/:id', requireAuth, requireAdmin, update);
AdminMangaListRouter.delete('/:id', requireAuth, requireAdmin, remove);
AdminMangaListRouter.post('/:id/items', requireAuth, requireAdmin, addManga);
AdminMangaListRouter.post('/:id/items/bulk', requireAuth, requireAdmin, bulkAddMangas);
AdminMangaListRouter.put('/:id/items/reorder', requireAuth, requireAdmin, reorderItems);
AdminMangaListRouter.put('/:listId/items/:itemId', requireAuth, requireAdmin, updateMangaItem);
AdminMangaListRouter.delete('/:listId/items/:itemId', requireAuth, requireAdmin, removeManga);

export { MangaListRouter, AdminMangaListRouter };