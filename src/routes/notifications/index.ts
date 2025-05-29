import { Router } from "express";
import { listNotifications, createNotification, markAsRead, deleteNotification, markAllAsRead, getNotification } from "@/controllers/notifications";
import { requireAuth, requireAdmin } from "@/middlewares/authMiddleware";

const notificationsRouter = Router();

// Rotas públicas (requer autenticação)
notificationsRouter.get("/", requireAuth, listNotifications); // Listar notificações do usuário
notificationsRouter.get("/:notificationId", requireAuth, getNotification); // Buscar uma única notificação
notificationsRouter.post("/", requireAuth, createNotification); // Criar notificação
notificationsRouter.patch("/:notificationId/read", requireAuth, markAsRead); // Marcar como lida
notificationsRouter.patch("/mark-all-read", requireAuth, markAllAsRead); // Marcar todas como lidas
notificationsRouter.delete("/:notificationId", requireAuth, deleteNotification); // Deletar notificação
// Rotas administrativas
notificationsRouter.post("/", requireAdmin, createNotification); // Criar notificação
notificationsRouter.delete("/:notificationId", requireAdmin, deleteNotification); // Deletar notificação

export default notificationsRouter; 