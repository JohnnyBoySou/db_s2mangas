import { Router } from 'express';
import {
  getWallpapers,
  getWallpaperById,
  createWallpaper,
  updateWallpaper,
  deleteWallpaper,
  importWallpapers,
  toggleWallpaperImage,
  importPinterestWallpaper
} from "../controllers/WallpaperControllers";
import { requireAdmin, requireAuth } from "@/middlewares/auth";

const WallpaperRouter = Router();
const AdminWallpaperRouter = Router();

WallpaperRouter.get("/", requireAuth, getWallpapers);
WallpaperRouter.get("/:id", requireAuth, getWallpaperById);

AdminWallpaperRouter.get("/:id", requireAuth, requireAdmin, getWallpaperById);
AdminWallpaperRouter.get("/", requireAuth, requireAdmin,getWallpapers);
AdminWallpaperRouter.post("/", requireAuth, requireAdmin, createWallpaper);
AdminWallpaperRouter.put("/:id", requireAuth, requireAdmin, updateWallpaper );
AdminWallpaperRouter.delete("/:id", requireAuth, requireAdmin,  deleteWallpaper );
AdminWallpaperRouter.post("/:id/toggle", requireAuth, requireAdmin, toggleWallpaperImage );

AdminWallpaperRouter.post("/import", requireAuth, importWallpapers );
AdminWallpaperRouter.post("/import-pinterest", requireAuth, importPinterestWallpaper );

export { WallpaperRouter, AdminWallpaperRouter };
