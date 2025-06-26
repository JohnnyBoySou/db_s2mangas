import prisma from '@/prisma/client';

export const createNotification = async (data: {
    title: string;
    message: string;
    type: string;
    userId?: string;
    data?: Record<string, any>;
}) => {
    const { title, message, type, userId, data: notificationData } = data;

    return await prisma.notification.create({
        data: {
            title,
            message,
            type,
            userId: userId || 'system',
            data: notificationData
        }
    });
};

// Criar notificação para um usuário específico
export const createUserNotification = async (data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: Record<string, any>;
}) => {
    const { userId, title, message, type, data: notificationData } = data;

    return await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            data: notificationData
        }
    });
};

// Criar notificação de follow
export const createFollowNotification = async (followerId: string, targetId: string, followerName: string) => {
    return await createUserNotification({
        userId: targetId,
        title: 'Novo seguidor',
        message: `${followerName} começou a te seguir`,
        type: 'follow',
        data: {
            followerId,
            followerName
        }
    });
};

export const listNotifications = async (page: number, take: number, userId?: string) => {
    const skip = (page - 1) * take;
    const where = userId ? { userId } : {};

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip,
            take,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.notification.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    return {
        data: notifications,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages ? page + 1 : null,
            prev: page > 1 ? page - 1 : null,
        },
    };
};

// Listar notificações de um usuário específico
export const listUserNotifications = async (userId: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            skip,
            take,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    const totalPages = Math.ceil(total / take);

    return {
        data: notifications,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages ? page + 1 : null,
            prev: page > 1 ? page - 1 : null,
        },
        unreadCount
    };
};

// Marcar notificação como lida
export const markAsRead = async (notificationId: string, userId: string) => {
    const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
    });

    if (!notification) {
        throw new Error('Notificação não encontrada');
    }

    return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
    });
};

// Marcar todas as notificações como lidas
export const markAllAsRead = async (userId: string) => {
    return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
    });
};

export const getNotification = async (notificationId: string) => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
    });

    if (!notification) {
        throw new Error("Notificação não encontrada");
    }

    return notification;
};

export const deleteNotification = async (notificationId: string) => {
    await prisma.notification.delete({
        where: { id: notificationId }
    });
};
