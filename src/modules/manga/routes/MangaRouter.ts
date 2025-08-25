import { Router } from "express";
import { create, list, get, update, patch, remove, category, covers, importFromMangaDex, importFromFile, chapters, pages, clearMangaTable, similar } from "../controllers/MangaController";
import { requireAuth, requireAdmin } from "@/middlewares/auth";
import { smartCacheMiddleware, cacheInvalidationMiddleware, imageCacheMiddleware } from "@/middlewares/smartCache";

const MangaRouter = Router();
const AdminMangaRouter = Router();

MangaRouter.use();
AdminMangaRouter.use(requireAuth, requireAdmin);

MangaRouter.get("/", list);
MangaRouter.get("/:id/covers", imageCacheMiddleware(['thumbnail', 'small', 'medium']), covers);
MangaRouter.get('/category', smartCacheMiddleware('categories'), category);
MangaRouter.get("/:id", smartCacheMiddleware('manga'), get);
MangaRouter.get("/chapters/:chapterID/pages", smartCacheMiddleware('chapter'), pages);
MangaRouter.get("/:id/chapters", smartCacheMiddleware('manga', { varyBy: ['id', 'lg'] }), chapters);
MangaRouter.get("/:id/similar", smartCacheMiddleware('discover', { ttl: 1800 }), similar);


//ADMIN
AdminMangaRouter.get("/", list);
AdminMangaRouter.post("/", cacheInvalidationMiddleware(['manga', 'discover']), create);
AdminMangaRouter.put("/:id", cacheInvalidationMiddleware(['manga', 'discover']), update);
AdminMangaRouter.patch("/:id", cacheInvalidationMiddleware(['manga', 'discover']), patch);
AdminMangaRouter.delete("/clear", cacheInvalidationMiddleware(['manga', 'discover', 'images']), clearMangaTable);
AdminMangaRouter.delete("/:id", cacheInvalidationMiddleware(['manga', 'discover', 'images']), remove);
AdminMangaRouter.post('/import', importFromMangaDex);
AdminMangaRouter.post('/import_json/file/:filename', importFromFile);

export { AdminMangaRouter, MangaRouter }
