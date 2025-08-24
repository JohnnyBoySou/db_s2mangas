import { Router } from "express";
import { searchManga, listCategories, searchCategories, searchAdvanced, listTypes, listLanguages, smartSearch, autocomplete, searchHealth } from "../controllers/SearchController";
import { requireAuth } from "@/middlewares/auth";
import { cacheMiddleware } from "@/middlewares/cache";
import { cacheTTL } from "@/config/redis";

const SearchRouter = Router();

// Original endpoints
SearchRouter.post("/", searchManga);
SearchRouter.post("/advenced", searchAdvanced)
SearchRouter.get('/types', listTypes)
SearchRouter.post('/categories',  searchCategories);

// Cached endpoints
SearchRouter.get('/categories', cacheMiddleware(cacheTTL.categories), listCategories);
SearchRouter.get('/languages', cacheMiddleware(cacheTTL.languages), listLanguages)

// New smart search endpoints
SearchRouter.get('/smart', smartSearch);
SearchRouter.get('/autocomplete', autocomplete); 
SearchRouter.get('/health', searchHealth); 

export { SearchRouter };
