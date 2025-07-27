import { Router } from 'express';
import { MangaListController } from '../controllers/MangalistController';
import { requireAuth } from '@/middlewares/auth';

const MangaListRouter = Router();

// Rotas básicas de CRUD
MangaListRouter.post('/', requireAuth, MangaListController.create);
MangaListRouter.get('/', requireAuth, MangaListController.list);
MangaListRouter.get('/public', MangaListController.listPublic);
MangaListRouter.get('/healthcheck', MangaListController.healthCheck);

// Rotas por parâmetros específicos
MangaListRouter.get('/mood/:mood', MangaListController.getByMood);
MangaListRouter.get('/:id', requireAuth, MangaListController.get);
MangaListRouter.get('/:id/stats', requireAuth, MangaListController.getStats);

// Rotas de atualização
MangaListRouter.put('/:id', requireAuth, MangaListController.update);
MangaListRouter.delete('/:id', requireAuth, MangaListController.remove);

// Rotas de itens da lista
MangaListRouter.post('/:id/manga', requireAuth, MangaListController.addManga);
MangaListRouter.post('/:id/bulk-add', requireAuth, MangaListController.bulkAddMangas);
MangaListRouter.post('/:id/reorder', requireAuth, MangaListController.reorderItems);

// Rotas de itens específicos
MangaListRouter.put('/:listId/manga/:itemId', requireAuth, MangaListController.updateMangaItem);
MangaListRouter.delete('/:listId/manga/:itemId', requireAuth, MangaListController.removeManga);

export { MangaListRouter }; 