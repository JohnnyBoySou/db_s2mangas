import { Router } from 'express';
import { MangaListController } from "../controllers/MangalistController";
import { requireAuth } from "@/middlewares/auth";

const MangaListRouter = Router();

MangaListRouter.get('/', requireAuth, MangaListController.list);
MangaListRouter.get('/:id', requireAuth, MangaListController.get);

export { MangaListRouter };