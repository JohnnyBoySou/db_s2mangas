import { Router } from "express";
import { create, list, get, update, remove } from "@/controllers/categories";
import { requireAuth, requireAdmin } from "@/middlewares/auth";

const CategoriesRouter = Router();
const AdminCategoriesRouter = Router();

CategoriesRouter.get("/", list);
CategoriesRouter.get("/:id", get);

AdminCategoriesRouter.post("/", requireAuth, requireAdmin, create);
AdminCategoriesRouter.put("/:id", requireAuth, requireAdmin, update);
AdminCategoriesRouter.delete("/:id", requireAuth, requireAdmin, remove);

export  { CategoriesRouter, AdminCategoriesRouter }; 