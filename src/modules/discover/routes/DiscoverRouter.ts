import { Router } from "express";
import { 
  getRecent, 
  getMostViewed, 
  getMostLiked, 
  getFeed, 
  getIA, 
  getMangasByCategories,
  getStats,
  healthCheck
} from "../controllers/DiscoverController";
import { requireAuth } from "@/middlewares/auth";
import { smartCacheMiddleware } from "@/middlewares/smartCache";

const DiscoverRouter = Router();
const AdminDiscoverRouter = Router();

// Cache inteligente para recents
DiscoverRouter.get("/recents", requireAuth, getRecent);

// Cache inteligente para mais vistos
DiscoverRouter.get("/views", requireAuth, getMostViewed);

// Cache inteligente para mais curtidos
DiscoverRouter.get("/likes", requireAuth, getMostLiked);

// Cache inteligente para feed personalizado (varia por usuário)
DiscoverRouter.get("/feed", requireAuth,  getFeed);

// Cache para recomendações baseadas em IA (varia por usuário)
DiscoverRouter.get("/ia", requireAuth, getIA);

// Cache para mangás por categorias
DiscoverRouter.get("/categories/:categoryIds", requireAuth, getMangasByCategories);

// Health check (sem cache)
DiscoverRouter.get("/health", healthCheck);

// Rotas admin
AdminDiscoverRouter.get("/stats", requireAuth, getStats);

export { DiscoverRouter, AdminDiscoverRouter };
