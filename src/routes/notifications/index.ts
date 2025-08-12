import { Router } from "express";
import { 
  listAllNotifications,
  createNotification, 
  deleteNotification, 
  getNotification,
} from "@/controllers/notifications";
import { requireAuth, requireAdmin } from "@/middlewares/auth";

const NotificationsRouter = Router();
const AdminNotificationsRouter = Router();

// Rotas do usuário
NotificationsRouter.get("/", requireAuth, listAllNotifications); // Listar notificações do usuário
NotificationsRouter.get("/:id", requireAuth, getNotification); // Buscar uma única notificação

// Rotas administrativas
AdminNotificationsRouter.get("/", requireAuth, requireAdmin, listAllNotifications); // Listar todas as notificações
AdminNotificationsRouter.post("/", requireAuth, requireAdmin, createNotification); 
AdminNotificationsRouter.delete("/:id", requireAuth, requireAdmin, deleteNotification); 

export { NotificationsRouter, AdminNotificationsRouter };