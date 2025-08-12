import { Router } from "express";
import { searchManga, listCategories, searchCategories, searchAdvanced, listTypes, listLanguages } from "../controllers/SearchController";
import { requireAuth } from "@/middlewares/auth";
import { cacheMiddleware } from "@/middlewares/cache";
import { cacheTTL } from "@/config/redis";

const SearchRouter = Router();

SearchRouter.post("/", requireAuth, searchManga);
SearchRouter.post("/advenced", requireAuth, searchAdvanced)
SearchRouter.get('/types', listTypes)
SearchRouter.post('/categories',  searchCategories);

SearchRouter.get('/categories', cacheMiddleware(cacheTTL.categories), listCategories);
SearchRouter.get('/languages', cacheMiddleware(cacheTTL.languages), listLanguages)

export { SearchRouter };
