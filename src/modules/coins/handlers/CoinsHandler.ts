import prisma from "@/prisma/client";

export const addCoins = async (userId: string) => {
    const FIXED_AMOUNT = 30;

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            coins: {
                increment: FIXED_AMOUNT
            }
        },
        select: {
            id: true,
            coins: true
        }
    });

    return user;
};

export const removeCoins = async (userId: string) => {
    const FIXED_AMOUNT = 15;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { coins: true }
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    if (user.coins < FIXED_AMOUNT) {
        throw new Error("Saldo insuficiente de coins");
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            coins: {
                decrement: FIXED_AMOUNT
            }
        },
        select: {
            id: true,
            coins: true
        }
    });

    return updatedUser;
};

export const getCoins = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            coins: true
        }
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    return user;
}; 