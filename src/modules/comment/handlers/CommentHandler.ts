import prisma from '@/prisma/client';

export const createComment = async (data: {
    userId: string;
    mangaId: string;
    content: string;
}) => {
    const { userId, mangaId, content } = data;

    return await prisma.comment.create({
        data: {
            userId,
            mangaId,
            message: content,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });
};

export const listComments = async (mangaId: string, page: number, take: number) => {
    const skip = (page - 1) * take;

    const [comments, total] = await Promise.all([
        prisma.comment.findMany({
            where: { mangaId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        username: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma.comment.count({
            where: { mangaId },
        }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
        data: comments,
        pagination: {
            total,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        },
    };
};

export const updateComment = async (id: string, userId: string, content: string) => {
    const comment = await prisma.comment.findUnique({
        where: { id },
    });

    if (!comment) {
        throw new Error('Comentário não encontrado.');
    }

    if (comment.userId !== userId) {
        throw new Error('Você não tem permissão para editar este comentário.');
    }

    return await prisma.comment.update({
        where: { id },
        data: { message: content },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });
};

export const deleteComment = async (id: string, userId: string) => {
    const comment = await prisma.comment.findUnique({
        where: { id },
    });

    if (!comment) {
        throw new Error('Comentário não encontrado.');
    }

    if (comment.userId !== userId) {
        throw new Error('Você não tem permissão para deletar este comentário.');
    }

    await prisma.comment.delete({
        where: { id },
    });
};
