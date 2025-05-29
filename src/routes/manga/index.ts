import { Router } from "express";
import { create, list, get, update, remove, category, covers, importFromFile, chapters, pages} from "@/controllers/manga";
import { importFromExternalApi } from "@/controllers/manga/import";
import { requireAuth } from "@/middlewares/authMiddleware";

const mangaRouter = Router();
mangaRouter.get("/", list);
mangaRouter.get('/category', requireAuth, category)
mangaRouter.get("/:id", get);
mangaRouter.post("/", requireAuth, create);
mangaRouter.put("/:id", requireAuth, update);
mangaRouter.delete("/:id", requireAuth, remove);
mangaRouter.post('/import', requireAuth, importFromExternalApi);
mangaRouter.get("/:mangaid", requireAuth, covers)
mangaRouter.post('/import_json/file/:filename', requireAuth, importFromFile);
mangaRouter.get("/:id/chapters", chapters);
mangaRouter.get("/chapters/:chapterID/pages", pages);

export default mangaRouter;
