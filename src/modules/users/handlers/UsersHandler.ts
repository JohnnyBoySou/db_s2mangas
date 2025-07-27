import prisma from '@/prisma/client';
import bcrypt from 'bcrypt';

// Listar todos os usuários
export const listUsers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                avatar: true,
                cover: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.user.count()
    ]);

    return {
        users,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    };
};

// Buscar usuário por ID
export const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            avatar: true,
            cover: true,
            bio: true,
            birthdate: true,
        }
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    return user;
};

// Criar novo usuário
export const createUser = async (data: {
    name: string;
    email: string;
    password: string;
    username?: string;
    avatar?: string;
    cover?: string;
}) => {
    const { name, email, password, username, avatar, cover } = data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: normalizedEmail },
                { username: username }
            ]
        }
    });

    if (existingUser) {
        throw new Error("Email ou username já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedUsername = username || `${name.toLowerCase().replace(/\s+/g, '')}_${Math.random().toString(36).substring(2, 7)}`;

    const user = await prisma.user.create({
        data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
            username: generatedUsername,
            avatar,
            cover,
            emailVerified: true // Admin criando usuário, então já é verificado
        },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            emailVerified: true,
            createdAt: true,
            avatar: true,
            cover: true,
        }
    });

    return user;
};

// Atualizar usuário
export const updateUser = async (userId: string, data: {
    name?: string;
    email?: string;
    password?: string;
    username?: string;
    avatar?: string;
    cover?: string;
    bio?: string;
    birthdate?: Date;
    categories?: Array<{ id: string; name: string }>;
    languages?: Array<{ id: string; name: string }>;
}) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            categories: true,
            languages: true
        }
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    const { categories, languages, ...userData } = data;
    const updateData: any = { ...userData };

    // Se houver categorias, atualiza a relação
    if (categories) {
        // Remove duplicatas e mantém apenas os IDs únicos
        const uniqueCategoryIds = [...new Set(categories.map(cat => cat.id))];
        
        // Primeiro verifica se todas as categorias existem
        const existingCategories = await prisma.category.findMany({
            where: { id: { in: uniqueCategoryIds } }
        });

        if (existingCategories.length !== uniqueCategoryIds.length) {
            throw new Error("Uma ou mais categorias não foram encontradas");
        }

        // Atualiza as relações usando o formato correto do Prisma
        updateData.categories = {
            deleteMany: {},
            create: uniqueCategoryIds.map(id => ({
                category: {
                    connect: { id }
                }
            }))
        };
    }

    // Se houver idiomas, atualiza a relação
    if (languages) {
        // Remove duplicatas e mantém apenas os IDs únicos
        const uniqueLanguageIds = [...new Set(languages.map(lang => lang.id))];
        
        // Primeiro verifica se todos os idiomas existem
        const existingLanguages = await prisma.language.findMany({
            where: { id: { in: uniqueLanguageIds } }
        });

        if (existingLanguages.length !== uniqueLanguageIds.length) {
            throw new Error("Um ou mais idiomas não foram encontrados");
        }

        // Atualiza as relações usando o formato correto do Prisma
        updateData.languages = {
            deleteMany: {},
            create: uniqueLanguageIds.map(id => ({
                language: {
                    connect: { id }
                }
            }))
        };
    }

    return prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            birthdate: true,
            bio: true,
            avatar: true,
            cover: true,
            categories: {
                select: {
                    id: true,
                    name: true
                }
            },
            languages: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

// Deletar usuário
export const deleteUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    await prisma.user.delete({
        where: { id: userId }
    });

    return { message: "Usuário deletado com sucesso" };
};

export const addCoins = async (userId: string, amount: number) => {
    if (amount <= 0) {
        throw new Error("A quantidade de coins deve ser maior que zero");
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            coins: {
                increment: amount
            }
        },
        select: {
            id: true,
            coins: true
        }
    });

    return user;
};

export const removeCoins = async (userId: string, amount: number) => {
    if (amount <= 0) {
        throw new Error("A quantidade de coins deve ser maior que zero");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { coins: true }
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    if (user.coins < amount) {
        throw new Error("Saldo insuficiente de coins");
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            coins: {
                decrement: amount
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