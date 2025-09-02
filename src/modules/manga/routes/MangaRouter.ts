import { Router } from "express";
import { create, list, get, update, patch, remove, category, covers, importFromMangaDex, importFromFile, chapters, pages, clearMangaTable, similar } from "../controllers/MangaController";
import { requireAuth, requireAdmin } from "@/middlewares/auth";
import { cacheMiddleware, cacheInvalidationMiddleware } from "@/middlewares/cache";

const MangaRouter = Router();
const AdminMangaRouter = Router();

AdminMangaRouter.use(requireAuth, requireAdmin);

MangaRouter.get("/", list);
MangaRouter.get("/:id/covers", covers);
MangaRouter.get('/category', category);
MangaRouter.get("/:id", get);
MangaRouter.get("/:id/similar", similar);

//ADMIN
AdminMangaRouter.get("/", list);
AdminMangaRouter.post("/", cacheInvalidationMiddleware(['manga', 'discover']), create);
AdminMangaRouter.put("/:id", cacheInvalidationMiddleware(['manga', 'discover']), update);
AdminMangaRouter.patch("/:id", cacheInvalidationMiddleware(['manga', 'discover']), patch);
AdminMangaRouter.delete("/clear", cacheInvalidationMiddleware(['manga', 'discover']), clearMangaTable);
AdminMangaRouter.delete("/:id", cacheInvalidationMiddleware(['manga', 'discover']), remove);
AdminMangaRouter.post('/import', cacheInvalidationMiddleware(['manga', 'discover']), importFromMangaDex);
AdminMangaRouter.post('/import_json/file/:filename', cacheInvalidationMiddleware(['manga', 'discover']), importFromFile);

export { AdminMangaRouter, MangaRouter }
