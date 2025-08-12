import { Router } from "express";
import { create, list, get, update, patch, remove, category, covers, importFromMangaDex, importFromFile, chapters, pages, clearMangaTable, similar } from "../controllers/MangaController";
import { requireAuth, requireAdmin } from "@/middlewares/auth";
import { smartCacheMiddleware, cacheInvalidationMiddleware, imageCacheMiddleware } from "@/middlewares/smartCache";

const MangaRouter = Router();
const AdminMangaRouter = Router();

MangaRouter.get("/:id/covers", requireAuth, imageCacheMiddleware(['thumbnail', 'small', 'medium']), covers);
MangaRouter.get('/category', requireAuth, smartCacheMiddleware('categories'), category);
MangaRouter.get("/:id", requireAuth, smartCacheMiddleware('manga'), get);
MangaRouter.get("/chapters/:chapterID/pages", requireAuth, smartCacheMiddleware('chapter'), pages);
MangaRouter.get("/:id/chapters", requireAuth, smartCacheMiddleware('manga', { varyBy: ['id', 'lg'] }), chapters);
MangaRouter.get("/:id/similar", requireAuth, smartCacheMiddleware('discover', { ttl: 1800 }), similar);

//ADMIN
AdminMangaRouter.get("/", requireAuth, requireAdmin, smartCacheMiddleware('manga'), list);
AdminMangaRouter.post("/", requireAuth, requireAdmin, cacheInvalidationMiddleware(['manga', 'discover']), create);
AdminMangaRouter.put("/:id", requireAuth, requireAdmin, cacheInvalidationMiddleware(['manga', 'discover']), update);
AdminMangaRouter.patch("/:id", requireAuth, requireAdmin, cacheInvalidationMiddleware(['manga', 'discover']), patch);
AdminMangaRouter.delete("/:id", requireAuth, requireAdmin, cacheInvalidationMiddleware(['manga', 'discover', 'images']), remove);
AdminMangaRouter.delete("/clear", requireAuth, requireAdmin, cacheInvalidationMiddleware(['manga', 'discover', 'images']), clearMangaTable);
AdminMangaRouter.post('/import', requireAuth, importFromMangaDex);
AdminMangaRouter.post('/import_json/file/:filename', requireAuth, importFromFile);

export { AdminMangaRouter, MangaRouter }
