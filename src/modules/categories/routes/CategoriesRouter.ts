import { Router } from "express";
import { requireAuth, requireAdmin } from "@/middlewares/auth";
import { CategoryController } from "../controllers/CategoriesController";

const CategoriesRouter = Router();
const AdminCategoriesRouter = Router();

CategoriesRouter.get("/", CategoryController.list);
CategoriesRouter.get("/:id", CategoryController.getById);

AdminCategoriesRouter.post("/", requireAuth, requireAdmin, CategoryController.create);
AdminCategoriesRouter.put("/:id", requireAuth, requireAdmin, CategoryController.update);
AdminCategoriesRouter.delete("/:id", requireAuth, requireAdmin, CategoryController.delete);

export  { CategoriesRouter, AdminCategoriesRouter }; 