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
DiscoverRouter.get("/recents", requireAuth, smartCacheMiddleware('discover'), getRecent);

// Cache inteligente para mais vistos
DiscoverRouter.get("/views", requireAuth, smartCacheMiddleware('discover'), getMostViewed);

// Cache inteligente para mais curtidos
DiscoverRouter.get("/likes", requireAuth, smartCacheMiddleware('discover'), getMostLiked);

// Cache inteligente para feed personalizado (varia por usuário)
DiscoverRouter.get("/feed", requireAuth, smartCacheMiddleware('discover', { 
  varyBy: ['userId', 'page', 'take', 'lg'],
  ttl: 300 // 5 minutos para feed personalizado
}), getFeed);

// Cache para recomendações baseadas em IA (varia por usuário)
DiscoverRouter.get("/ia", requireAuth, smartCacheMiddleware('discover', {
  varyBy: ['userId'],
  ttl: 600 // 10 minutos para IA
}), getIA);

// Cache para mangás por categorias
DiscoverRouter.get("/categories/:categoryIds", requireAuth, smartCacheMiddleware('discover'), getMangasByCategories);

// Health check (sem cache)
DiscoverRouter.get("/health", healthCheck);

// Rotas admin
AdminDiscoverRouter.get("/stats", requireAuth, getStats);

export { DiscoverRouter, AdminDiscoverRouter };
