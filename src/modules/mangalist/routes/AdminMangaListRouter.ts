import { Router } from 'express';
import { 
  create, 
  update, 
  remove, 
  addManga, 
  bulkAddMangas, 
  reorderItems, 
  updateMangaItem, 
  removeManga 
} from '../controllers/MangalistController';
import { requireAuth, requireAdmin } from "@/middlewares/auth";

const AdminMangaListRouter = Router();

AdminMangaListRouter.post('/', requireAuth, requireAdmin, create);
AdminMangaListRouter.put('/:id', requireAuth, requireAdmin, update);
AdminMangaListRouter.delete('/:id', requireAuth, requireAdmin, remove);
AdminMangaListRouter.post('/:id/items', requireAuth, requireAdmin, addManga);
AdminMangaListRouter.post('/:id/items/bulk', requireAuth, requireAdmin, bulkAddMangas);
AdminMangaListRouter.put('/:id/items/reorder', requireAuth, requireAdmin, reorderItems);
AdminMangaListRouter.put('/:listId/items/:itemId', requireAuth, requireAdmin, updateMangaItem);
AdminMangaListRouter.delete('/:listId/items/:itemId', requireAuth, requireAdmin, removeManga);

export { AdminMangaListRouter };