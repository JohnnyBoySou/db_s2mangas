import { Router, RequestHandler } from "express";
import {
  getWallpapers,
  getWallpaperById,
  createWallpaper,
  updateWallpaper,
  deleteWallpaper
} from "@/controllers/wallpapers";
import { requireAuth } from "@/middlewares/authMiddleware";

const wallpaperRouter = Router();

wallpaperRouter.get("/", getWallpapers as RequestHandler);
wallpaperRouter.get("/:id", getWallpaperById as RequestHandler);
wallpaperRouter.post("/", requireAuth, createWallpaper as RequestHandler);
wallpaperRouter.put("/:id", requireAuth, updateWallpaper as RequestHandler);
wallpaperRouter.delete("/:id", requireAuth, deleteWallpaper as RequestHandler);

export default wallpaperRouter;
