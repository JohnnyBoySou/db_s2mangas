import { Router } from "express";
import { getRecent, getMostViewed, getMostLiked, getFeed, getIA } from "@/controllers/discover";
import { requireAuth } from "@/middlewares/auth";
import { smartCacheMiddleware } from "@/middlewares/smartCache";

const discoverRouter = Router();

// Cache inteligente para recents
discoverRouter.get("/recents", requireAuth, smartCacheMiddleware('discover'), getRecent);

// Cache inteligente para mais vistos
discoverRouter.get("/views", requireAuth, smartCacheMiddleware('discover'), getMostViewed);

// Cache inteligente para mais curtidos
discoverRouter.get("/likes", requireAuth, smartCacheMiddleware('discover'), getMostLiked);

// Cache inteligente para feed personalizado (varia por usuário)
discoverRouter.get("/feed", requireAuth, smartCacheMiddleware('discover', { 
  varyBy: ['userId', 'page', 'take', 'lg'],
  ttl: 300 // 5 minutos para feed personalizado
}), getFeed);

// Cache para recomendações baseadas em IA (varia por usuário)
discoverRouter.get("/ia", requireAuth, smartCacheMiddleware('discover', {
  varyBy: ['userId'],
  ttl: 600 // 10 minutos para IA
}), getIA);

export default discoverRouter;
