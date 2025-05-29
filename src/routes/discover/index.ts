import { Router } from "express";
import { getRecent, getMostViewed, getMostLiked, getFeed } from "@/controllers/discover";
import { requireAuth } from "@/middlewares/authMiddleware";

const discoverRouter = Router();

discoverRouter.get("/recents", requireAuth, getRecent);
discoverRouter.get("/views", requireAuth, getMostViewed);
discoverRouter.get("/likes", requireAuth, getMostLiked);
discoverRouter.get("/feed", requireAuth, getFeed);

export default discoverRouter;
