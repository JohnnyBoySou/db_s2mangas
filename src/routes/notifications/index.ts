import { Router } from "express";
import { 
  listNotifications, 
  listAllNotifications,
  createNotification, 
  deleteNotification, 
  getNotification,
  markAsRead,
  markAllAsRead
} from "@/controllers/notifications";
import { requireAuth, requireAdmin } from "@/middlewares/auth";

const NotificationsRouter = Router();
const AdminNotificationsRouter = Router();

// Rotas do usuário
NotificationsRouter.get("/", requireAuth, listNotifications); // Listar notificações do usuário
NotificationsRouter.get("/:id", requireAuth, getNotification); // Buscar uma única notificação
NotificationsRouter.patch("/:id/read", requireAuth, markAsRead); // Marcar como lida
NotificationsRouter.patch("/mark-all-read", requireAuth, markAllAsRead); // Marcar todas como lidas

// Rotas administrativas
AdminNotificationsRouter.get("/", requireAuth, requireAdmin, listAllNotifications); // Listar todas as notificações
AdminNotificationsRouter.post("/", requireAuth, requireAdmin, createNotification); 
AdminNotificationsRouter.delete("/:id", requireAuth, requireAdmin, deleteNotification); 

export { NotificationsRouter, AdminNotificationsRouter };