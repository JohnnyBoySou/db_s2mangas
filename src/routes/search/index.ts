import { Router } from "express";
import { searchManga, listCategories, searchCategories, searchAdvanced, listTypes, listLanguages } from "@/controllers/search";
import { requireAuth } from "@/middlewares/auth";
import { cacheMiddleware } from "@/middlewares/cache";
import { cacheTTL } from "@/config/redis";

const searchRouter = Router();

searchRouter.post("/", requireAuth, searchManga);
searchRouter.post("/advenced", requireAuth, searchAdvanced)
searchRouter.get('/types', listTypes)
searchRouter.post('/categories',  searchCategories);

searchRouter.get('/categories', cacheMiddleware(cacheTTL.categories), listCategories);
searchRouter.get('/languages', cacheMiddleware(cacheTTL.languages), listLanguages)

export default searchRouter;
