import { Router } from "express";
import {
  listLibrary,
  upsertLibraryEntry,
  updateLibraryEntry,
  removeLibraryEntry,
  toggleLibraryEntry,
  checkMangaStatus,
} from "../controllers/LibraryController";
import { requireAuth } from "@/middlewares/auth";

const LibraryRouter = Router();

LibraryRouter.get("/:type", requireAuth, listLibrary); // /library/progress, /library/completes, etc

// Rotas para gerenciar entradas da biblioteca
LibraryRouter.post("/", requireAuth, upsertLibraryEntry);
LibraryRouter.patch("/", requireAuth, updateLibraryEntry);
LibraryRouter.delete("/:mangaId", requireAuth, removeLibraryEntry);
LibraryRouter.post("/:type/toggle/:mangaId", requireAuth, toggleLibraryEntry);
LibraryRouter.get("/status/:mangaId", requireAuth, checkMangaStatus);

export { LibraryRouter };
