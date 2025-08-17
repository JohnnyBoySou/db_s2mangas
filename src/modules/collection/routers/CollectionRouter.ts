import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import { create, list, get, update, remove, listPublic, checkInCollections, toggleCollection } from "../controllers/CollectionController";
import { 
  addCollaboratorToCollection, 
  listCollectionCollaborators, 
  updateCollaboratorRoleInCollection, 
  removeCollaboratorFromCollection 
} from "../controllers/CollaboratorController";

const CollectionRouter = Router();

CollectionRouter.post('/', requireAuth, create);
CollectionRouter.get('/', requireAuth, list);
CollectionRouter.get('/public', requireAuth, listPublic);
CollectionRouter.get('/:id', requireAuth, get);
CollectionRouter.put('/:id', requireAuth, update);
CollectionRouter.delete('/:id', requireAuth, remove);
CollectionRouter.get('/check/:mangaId', requireAuth, checkInCollections)
CollectionRouter.post('/:id/toggle/:mangaId', requireAuth, toggleCollection)

// Rotas de colaboração
CollectionRouter.post('/:id/collaborators', requireAuth, addCollaboratorToCollection);
CollectionRouter.get('/:id/collaborators', requireAuth, listCollectionCollaborators);
CollectionRouter.put('/:id/collaborators/:userId', requireAuth, updateCollaboratorRoleInCollection);
CollectionRouter.delete('/:id/collaborators/:userId', requireAuth, removeCollaboratorFromCollection);

export { CollectionRouter };