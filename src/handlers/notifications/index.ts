import prisma from '@/prisma/client';

export const createNotification = async (data: {
    title: string;
    message: string;
    type: string;
    data?: Record<string, any>;
    cover?: string;
}) => {
    const { title, message, type, data: notificationData, cover } = data;

    return await prisma.notification.create({
        data: {
            title,
            message,
            type,
            data: notificationData,
            cover
        }
    });
};

// Criar notificação para um usuário específico (agora genérica, sem userId)
export const createUserNotification = async (data: {
    title: string;
    message: string;
    type: string;
    data?: Record<string, any>;
    cover?: string;
}) => {
    const { title, message, type, data: notificationData, cover } = data;

    return await prisma.notification.create({
        data: {
            title,
            message,
            type,
            data: notificationData,
            cover
        }
    });
};

// Criar notificação de follow (sem userId)
export const createFollowNotification = async (followerId: string, targetId: string, followerName: string) => {
    return await createUserNotification({
        title: 'Novo seguidor',
        message: `${followerName} começou a te seguir`,
        type: 'follow',
        data: {
            followerId,
            followerName,
            targetId
        }
    });
};

export const listNotifications = async (page: number, take: number) => {
    const skip = (page - 1) * take;

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            skip,
            take,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.notification.count({})
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

// Removido listUserNotifications, markAsRead e markAllAsRead pois dependiam de userId/isRead

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
