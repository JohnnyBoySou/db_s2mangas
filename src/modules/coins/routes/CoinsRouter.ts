import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import { add, remove, get } from "../controllers/CoinsController";

const CoinsRouter = Router();

CoinsRouter.post("/add", requireAuth, add);
CoinsRouter.post("/remove", requireAuth, remove);
CoinsRouter.get("/", requireAuth, get);

export { CoinsRouter };
