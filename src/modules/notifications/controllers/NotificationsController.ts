import { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from "@/utils/pagination";
import * as notificationHandlers from "../handlers/NotificationsHandler";
import { 
  createNotificationSchema, 
  updateNotificationSchema, 
  patchNotificationSchema 
} from "../validators/NotificationValidators";

// Listar todas as notificações (apenas admin)
export const listAllNotifications: RequestHandler = async (req, res) => {
  const { take, page } = getPaginationParams(req);

  try {
    const result = await notificationHandlers.listNotifications(page, take);
    res.json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};

// Criar notificação (apenas admin)
export const createNotification: RequestHandler = async (req, res) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);
    const notification = await notificationHandlers.createNotification(validatedData);
    res.status(201).json(notification);
  } catch (err) {
    console.log(err)
    handleZodError(err, res);
  }
};

// Deletar notificação (apenas admin)
export const deleteNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    await notificationHandlers.deleteNotification(notificationId);
    res.status(204).send();
  } catch (err) {
    handleZodError(err, res);
  }
};

// Buscar uma única notificação
export const getNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await notificationHandlers.getNotification(notificationId);
    res.json(notification);
  } catch (err) {
    if (err instanceof Error && err.message === "Notificação não encontrada") {
      res.status(404).json({ message: err.message });
      return;
    }
    handleZodError(err, res);
  }
};

// Atualizar notificação completa (PUT) - apenas admin
export const updateNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const validatedData = updateNotificationSchema.parse(req.body);
    const notification = await notificationHandlers.updateNotification(notificationId, validatedData);
    res.json(notification);
  } catch (err) {
    if (err instanceof Error && err.message === "Notificação não encontrada") {
      res.status(404).json({ message: err.message });
      return;
    }
    handleZodError(err, res);
  }
};

// Atualizar notificação parcial (PATCH) - apenas admin
export const patchNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const validatedData = patchNotificationSchema.parse(req.body);
    const notification = await notificationHandlers.patchNotification(notificationId, validatedData);
    res.json(notification);
  } catch (err) {
    if (err instanceof Error && err.message === "Notificação não encontrada") {
      res.status(404).json({ message: err.message });
      return;
    }
    handleZodError(err, res);
  }
};