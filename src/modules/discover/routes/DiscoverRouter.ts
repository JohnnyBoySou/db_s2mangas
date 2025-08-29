import { Router } from "express";
import {
  getRecent,
  getMostViewed,
  getMostLiked,
  getFeed,
  getIA,
  getMangasByCategories,
  getStats,
  healthCheck,
} from "../controllers/DiscoverController";
import { requireAuth } from "@/middlewares/auth";
import { cacheMiddleware } from "@/middlewares/cache";

const DiscoverRouter = Router();
const AdminDiscoverRouter = Router();

// DiscoverRouter.use(requireAuth);

DiscoverRouter.get("/recents", cacheMiddleware('discover'), getRecent);

DiscoverRouter.get("/views", cacheMiddleware('discover'), getMostViewed);

DiscoverRouter.get("/likes", cacheMiddleware('discover'), getMostLiked);

DiscoverRouter.get("/feed", cacheMiddleware('discover'), getFeed);

DiscoverRouter.get("/ia", cacheMiddleware('discover'), getIA);

DiscoverRouter.get("/categories/:categoryIds", cacheMiddleware('discover'), getMangasByCategories);

DiscoverRouter.get("/health", healthCheck);

AdminDiscoverRouter.get("/stats", requireAuth, getStats);

export { DiscoverRouter, AdminDiscoverRouter };
