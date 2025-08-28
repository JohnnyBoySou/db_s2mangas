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
import { smartCacheMiddleware } from "@/middlewares/smartCache";

const DiscoverRouter = Router();
const AdminDiscoverRouter = Router();

// DiscoverRouter.use(requireAuth);

DiscoverRouter.get("/recents", getRecent);

DiscoverRouter.get("/views", getMostViewed);

DiscoverRouter.get("/likes", getMostLiked);

DiscoverRouter.get("/feed", getFeed);

DiscoverRouter.get("/ia", getIA);

DiscoverRouter.get("/categories/:categoryIds", getMangasByCategories);

DiscoverRouter.get("/health", healthCheck);

AdminDiscoverRouter.get("/stats", requireAuth, getStats);

export { DiscoverRouter, AdminDiscoverRouter };
