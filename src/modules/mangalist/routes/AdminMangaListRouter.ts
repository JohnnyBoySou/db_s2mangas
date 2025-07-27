import { Router } from 'express';
import { MangaListController } from '../controllers/MangalistController';
import { requireAuth, requireAdmin } from "@/middlewares/auth";

const AdminMangaListRouter = Router();

AdminMangaListRouter.post('/', requireAuth, requireAdmin, MangaListController.create);
AdminMangaListRouter.put('/:id', requireAuth, requireAdmin, MangaListController.update);
AdminMangaListRouter.delete('/:id', requireAuth, requireAdmin, MangaListController.remove);
AdminMangaListRouter.post('/:id/items', requireAuth, requireAdmin, MangaListController.addManga);
AdminMangaListRouter.post('/:id/items/bulk', requireAuth, requireAdmin, MangaListController.bulkAddMangas);
AdminMangaListRouter.put('/:id/items/reorder', requireAuth, requireAdmin, MangaListController.reorderItems);
AdminMangaListRouter.put('/:listId/items/:itemId', requireAuth, requireAdmin, MangaListController.updateMangaItem);
AdminMangaListRouter.delete('/:listId/items/:itemId', requireAuth, requireAdmin, MangaListController.removeManga);

export { AdminMangaListRouter };