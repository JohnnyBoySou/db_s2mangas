import { Router } from "express";
import { requireAuth, requireAdmin } from "@/middlewares/auth";
import { 
  listAllNotifications,
  createNotification, 
  deleteNotification, 
  getNotification,
  updateNotification,
  patchNotification,
} from "../controllers/NotificationsController";

const NotificationsRouter = Router();
const AdminNotificationsRouter = Router();

// Rotas do usuário
NotificationsRouter.get("/", requireAuth, listAllNotifications); // Listar notificações do usuário
NotificationsRouter.get("/:notificationId", requireAuth, getNotification); // Buscar uma única notificação

// Rotas administrativas
AdminNotificationsRouter.get("/", requireAuth, requireAdmin, listAllNotifications); // Listar todas as notificações
AdminNotificationsRouter.post("/", requireAuth, requireAdmin, createNotification); 
AdminNotificationsRouter.put("/:notificationId", requireAuth, requireAdmin, updateNotification); // Atualização completa
AdminNotificationsRouter.patch("/:notificationId", requireAuth, requireAdmin, patchNotification); // Atualização parcial
AdminNotificationsRouter.delete("/:notificationId", requireAuth, requireAdmin, deleteNotification); 

export { NotificationsRouter, AdminNotificationsRouter };