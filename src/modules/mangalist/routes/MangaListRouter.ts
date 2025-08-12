import { Router } from 'express';
import { 
  list, 
  listPublic, 
  get, 
  getStats, 
  getByMood 
} from "../controllers/MangalistController";
import { requireAuth } from "@/middlewares/auth";

const MangaListRouter = Router();

MangaListRouter.get('/', requireAuth, list);
MangaListRouter.get('/public', requireAuth, listPublic);
MangaListRouter.get('/:id', requireAuth, get);
MangaListRouter.get('/:id/stats', requireAuth, getStats);
MangaListRouter.get('/mood/:mood', requireAuth, getByMood);

export { MangaListRouter };