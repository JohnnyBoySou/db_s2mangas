import { Router } from 'express';
import { MangaListController } from '../controllers/MangalistController';
import { requireAdmin, requireAuth } from '@/middlewares/auth';
const AdminMangaListRouter = Router();

AdminMangaListRouter.use(requireAuth, requireAdmin);

// Rotas administrativas para listas
AdminMangaListRouter.get('/all', MangaListController.list);
AdminMangaListRouter.get('/stats', MangaListController.getStats);
AdminMangaListRouter.get('/healthcheck', MangaListController.healthCheck);

// Rotas de gerenciamento de listas
AdminMangaListRouter.post('/', MangaListController.create);
AdminMangaListRouter.put('/:id', MangaListController.update);
AdminMangaListRouter.delete('/:id', MangaListController.remove);

// Rotas de gerenciamento de itens
AdminMangaListRouter.post('/:id/manga', MangaListController.addManga);
AdminMangaListRouter.post('/:id/bulk-add', MangaListController.bulkAddMangas);
AdminMangaListRouter.post('/:id/reorder', MangaListController.reorderItems);

// Rotas de itens específicos
AdminMangaListRouter.put('/:listId/manga/:itemId', MangaListController.updateMangaItem);
AdminMangaListRouter.delete('/:listId/manga/:itemId', MangaListController.removeManga);

export { AdminMangaListRouter }; 