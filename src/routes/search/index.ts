import { Router } from "express";
import { searchManga, listCategories, searchCategories, searchAdvanced, listTypes, listLanguages } from "@/controllers/search";
import { requireAuth } from "@/middlewares/authMiddleware";

const searchRouter = Router();

searchRouter.post("/", requireAuth, searchManga);
searchRouter.post("/advenced", requireAuth, searchAdvanced)
searchRouter.get('/categories', listCategories);
searchRouter.post('/categories', searchCategories);
searchRouter.get('/types', listTypes)
searchRouter.get('/languages', listLanguages)
export default searchRouter;
