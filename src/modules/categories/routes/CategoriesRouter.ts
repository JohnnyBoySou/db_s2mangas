import { Router } from "express";
import { requireAuth, requireAdmin } from "@/middlewares/auth";
import { create, list, get, update, remove } from "../controllers/CategoriesController";

const CategoriesRouter = Router();
const AdminCategoriesRouter = Router();

CategoriesRouter.get("/", list);
CategoriesRouter.get("/:id", get);

AdminCategoriesRouter.post("/", requireAuth, requireAdmin, create);
AdminCategoriesRouter.put("/:id", requireAuth, requireAdmin, update);
AdminCategoriesRouter.delete("/:id", requireAuth, requireAdmin, remove);

export  { CategoriesRouter, AdminCategoriesRouter }; 