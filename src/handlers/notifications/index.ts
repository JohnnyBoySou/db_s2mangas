import prisma from '@/prisma/client';

export const createNotification = async (data: {
    title: string;
    message: string;
    type: string;
}) => {
    const { title, message, type } = data;

    return await prisma.notification.create({
        data: {
            title,
            message,
            type
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
        prisma.notification.count()
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
