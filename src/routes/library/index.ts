import { Router } from "express";
import { listLibrary, upsertLibraryEntry, updateLibraryEntry, removeLibraryEntry } from "@/controllers/library";
import { requireAuth } from "@/middlewares/authMiddleware";

const libraryRouter = Router();

// Rotas para listar biblioteca por tipo
libraryRouter.get("/:type", requireAuth, listLibrary); // /library/progress, /library/completes, etc
libraryRouter.get("/", requireAuth, listLibrary); // /library (lista todos)

// Rotas para gerenciar entradas da biblioteca
libraryRouter.post("/", requireAuth, upsertLibraryEntry);
libraryRouter.patch("/", requireAuth, updateLibraryEntry);
libraryRouter.delete("/:mangaId", requireAuth, removeLibraryEntry);

export default libraryRouter;
