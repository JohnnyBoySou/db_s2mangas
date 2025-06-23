import { Router } from "express";
import { create, list, get, update, remove, listPublic, checkInCollections, toggleCollection } from "@/controllers/collection";
import { requireAuth } from "@/middlewares/auth";

const collectionRouter = Router();

collectionRouter.post('/', requireAuth, create);
collectionRouter.get('/', requireAuth, list);
collectionRouter.get('/public', requireAuth, listPublic);
collectionRouter.get('/:id', requireAuth, get);
collectionRouter.put('/:id', requireAuth, update);
collectionRouter.delete('/:id', requireAuth, remove);
collectionRouter.get('/check/:mangaId', requireAuth, checkInCollections)
collectionRouter.post('/:id/toggle/:mangaId', requireAuth, toggleCollection)

export default collectionRouter;