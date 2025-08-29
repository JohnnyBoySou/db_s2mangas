import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import {
  create,
  list,
  get,
  update,
  remove,
  listPublic,
  checkInCollections,
  toggleCollection,
  togglePinned,
  searchByName,
} from "../controllers/CollectionController";
import {
  addCollaboratorToCollection,
  listCollectionCollaborators,
  updateCollaboratorRoleInCollection,
  removeCollaboratorFromCollection,
} from "../controllers/CollaboratorController";

const CollectionRouter = Router();

CollectionRouter.use(requireAuth);

CollectionRouter.post("/", create);
CollectionRouter.get("/", list);
CollectionRouter.get("/search", searchByName);
CollectionRouter.get("/public", listPublic);
CollectionRouter.get("/:id", get);
CollectionRouter.put("/:id", update);
CollectionRouter.put("/:id/toggle-pinned", togglePinned);
CollectionRouter.delete("/:id", remove);
CollectionRouter.get("/check/:mangaId", checkInCollections);
CollectionRouter.post("/:id/toggle/:mangaId", toggleCollection);

// Rotas de colaboração
CollectionRouter.post("/:id/collaborators", addCollaboratorToCollection);
CollectionRouter.get("/:id/collaborators", listCollectionCollaborators);
CollectionRouter.put(
  "/:id/collaborators/:userId",
  updateCollaboratorRoleInCollection
);
CollectionRouter.delete(
  "/:id/collaborators/:userId",
  removeCollaboratorFromCollection
);

export { CollectionRouter };
