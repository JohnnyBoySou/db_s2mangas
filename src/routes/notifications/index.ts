import { Router } from "express";
import { listNotifications, createNotification,  deleteNotification, getNotification } from "@/controllers/notifications";
import { requireAuth, requireAdmin } from "@/middlewares/auth";

const NotificationsRouter = Router();
const AdminNotificationsRouter = Router();

NotificationsRouter.get("/", requireAuth, listNotifications); // Listar notificações do usuário
NotificationsRouter.get("/:notificationId", requireAuth, getNotification); // Buscar uma única notificação
//NotificationsRouter.patch("/:notificationId/read", requireAuth, markAsRead); // Marcar como lida
//NotificationsRouter.patch("/mark-all-read", requireAuth, markAllAsRead); // Marcar todas como lidas

// Rotas administrativas
AdminNotificationsRouter.post("/", requireAuth, requireAdmin, createNotification); 
AdminNotificationsRouter.delete("/:notificationId", requireAuth, requireAdmin, deleteNotification); 

export { NotificationsRouter, AdminNotificationsRouter }; 