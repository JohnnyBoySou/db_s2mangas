import { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { getPaginationParams } from "@/utils/pagination";
import { z } from "zod";
import * as notificationHandlers from "@/handlers/notifications";

const createNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.string()
});

// Listar notificações
export const listNotifications: RequestHandler = async (req, res) => {
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

/*
// Marcar notificação como lida
export const markAsRead: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;
  const { notificationId } = req.params;

  try {
    const notification = await notificationHandlers.markAsRead(notificationId, userId);
    res.json(notification);
  } catch (err) {
    handleZodError(err, res);
  }
};

// Marcar todas as notificações como lidas
export const markAllAsRead: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;

  try {
    const result = await notificationHandlers.markAllAsRead(userId);
    res.json(result);
  } catch (err) {
    handleZodError(err, res);
  }
};*/