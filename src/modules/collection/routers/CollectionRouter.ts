import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import { create, list, get, update, remove, listPublic, checkInCollections, toggleCollection } from "../controllers/CollectionController";

const CollectionRouter = Router();

CollectionRouter.post('/', requireAuth, create);
CollectionRouter.get('/', requireAuth, list);
CollectionRouter.get('/public', requireAuth, listPublic);
CollectionRouter.get('/:id', requireAuth, get);
CollectionRouter.put('/:id', requireAuth, update);
CollectionRouter.delete('/:id', requireAuth, remove);
CollectionRouter.get('/check/:mangaId', requireAuth, checkInCollections)
CollectionRouter.post('/:id/toggle/:mangaId', requireAuth, toggleCollection)

export { CollectionRouter };