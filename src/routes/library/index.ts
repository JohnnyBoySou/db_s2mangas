import { Router } from "express";
import { listLibrary, upsertLibraryEntry, updateLibraryEntry, removeLibraryEntry, toggleLibraryEntry, checkMangaStatus } from "@/controllers/library";
import { requireAuth } from "@/middlewares/auth";

const libraryRouter = Router();

// Rotas para listar biblioteca por tipo
libraryRouter.get("/:type", requireAuth, listLibrary); // /library/progress, /library/completes, etc

// Rotas para gerenciar entradas da biblioteca
libraryRouter.post("/", requireAuth, upsertLibraryEntry);
libraryRouter.patch("/", requireAuth, updateLibraryEntry);
libraryRouter.delete("/:mangaId", requireAuth, removeLibraryEntry);
libraryRouter.post("/:type/toggle/:mangaId", requireAuth, toggleLibraryEntry);
libraryRouter.get("/status/:mangaId", requireAuth, checkMangaStatus);

export default libraryRouter;
