import bcrypt from 'bcrypt';
import { prismaMock } from '../../../test/mocks/prisma';
import {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    addCoins,
    removeCoins,
    getCoins
} from '../handlers/UsersHandler';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Users Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('listUsers', () => {
        it('deve listar usuários com paginação padrão', async () => {
            const mockUsers = [
                {
                    id: '1',
                    name: 'João Silva',
                    email: 'joao@example.com',
                    username: 'joao123',
                    emailVerified: true,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    avatar: null,
                    cover: null
                }
            ];
            const mockTotal = 1;

            prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
            prismaMock.user.count.mockResolvedValue(mockTotal);

            const result = await listUsers();

            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
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
            });
            expect(prismaMock.user.count).toHaveBeenCalled();
            expect(result).toEqual({
                users: mockUsers,
                total: mockTotal,
                totalPages: 1,
                currentPage: 1
            });
        });

        it('deve listar usuários com paginação customizada', async () => {
            const mockUsers = [];
            const mockTotal = 25;

            prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
            prismaMock.user.count.mockResolvedValue(mockTotal);

            const result = await listUsers(3, 5);

            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                skip: 10, // (3-1) * 5
                take: 5,
                select: expect.any(Object),
                orderBy: {
                    createdAt: 'desc'
                }
            });
            expect(result).toEqual({
                users: mockUsers,
                total: mockTotal,
                totalPages: 5, // Math.ceil(25/5)
                currentPage: 3
            });
        });
    });

    describe('getUserById', () => {
        it('deve buscar usuário por ID com sucesso', async () => {
            const mockUser = {
                id: '1',
                name: 'João Silva',
                email: 'joao@example.com',
                username: 'joao123',
                emailVerified: true,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                avatar: null,
                cover: null,
                bio: null,
                birthdate: null
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            const result = await getUserById('1');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
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
            expect(result).toEqual(mockUser);
        });

        it('deve lançar erro quando usuário não é encontrado', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(getUserById('999'))
                .rejects
                .toThrow('Usuário não encontrado');
        });
    });

    describe('createUser', () => {
        it('deve criar usuário com sucesso', async () => {
            const userData = {
                name: 'João Silva',
                email: 'JOAO@EXAMPLE.COM',
                password: 'password123',
                username: 'joao123'
            };

            const mockCreatedUser = {
                id: '1',
                name: 'João Silva',
                email: 'joao@example.com',
                username: 'joao123',
                emailVerified: true,
                createdAt: new Date('2024-01-01'),
                avatar: null,
                cover: null
            };

            prismaMock.user.findFirst.mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
            prismaMock.user.create.mockResolvedValue(mockCreatedUser as any);

            const result = await createUser(userData);

            expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { email: 'joao@example.com' },
                        { username: 'joao123' }
                    ]
                }
            });
            expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: {
                    name: 'João Silva',
                    email: 'joao@example.com',
                    password: 'hashedPassword',
                    username: 'joao123',
                    avatar: undefined,
                    cover: undefined,
                    emailVerified: true
                },
                select: expect.any(Object)
            });
            expect(result).toEqual(mockCreatedUser);
        });

        it('deve gerar username automaticamente quando não fornecido', async () => {
            const userData = {
                name: 'João Silva',
                email: 'joao@example.com',
                password: 'password123'
            };

            const mockCreatedUser = {
                id: '1',
                name: 'João Silva',
                email: 'joao@example.com',
                username: 'joãosilva_abc12',
                emailVerified: true,
                createdAt: new Date('2024-01-01'),
                avatar: null,
                cover: null
            };

            prismaMock.user.findFirst.mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
            prismaMock.user.create.mockResolvedValue(mockCreatedUser as any);

            // Mock Math.random para gerar username previsível
            const originalMathRandom = Math.random;
            Math.random = jest.fn(() => 0.123456789);

            const result = await createUser(userData);

            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    username: expect.stringMatching(/^joãosilva_[a-z0-9]{5}$/)
                }),
                select: expect.any(Object)
            });

            // Restaura Math.random
            Math.random = originalMathRandom;
        });

        it('deve lançar erro quando email ou username já existe', async () => {
            const userData = {
                name: 'João Silva',
                email: 'joao@example.com',
                password: 'password123',
                username: 'joao123'
            };

            const existingUser = {
                id: '1',
                email: 'joao@example.com',
                username: 'joao123'
            };

            prismaMock.user.findFirst.mockResolvedValue(existingUser as any);

            await expect(createUser(userData))
                .rejects
                .toThrow('Email ou username já cadastrado');
        });
    });

    describe('updateUser', () => {
        it('deve atualizar usuário com sucesso', async () => {
            const userId = '1';
            const updateData = {
                name: 'João Silva Atualizado',
                bio: 'Nova bio'
            };

            const mockExistingUser = {
                id: '1',
                name: 'João Silva',
                categories: [],
                languages: []
            };

            const mockUpdatedUser = {
                id: '1',
                name: 'João Silva Atualizado',
                email: 'joao@example.com',
                username: 'joao123',
                birthdate: null,
                bio: 'Nova bio',
                avatar: null,
                cover: null,
                categories: [],
                languages: []
            };

            prismaMock.user.findUnique.mockResolvedValue(mockExistingUser as any);
            prismaMock.user.update.mockResolvedValue(mockUpdatedUser as any);

            const result = await updateUser(userId, updateData);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
                include: {
                    categories: true,
                    languages: true
                }
            });
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: updateData,
                select: expect.any(Object)
            });
            expect(result).toEqual(mockUpdatedUser);
        });

        it('deve atualizar usuário com categorias', async () => {
            const userId = '1';
            const updateData = {
                name: 'João Silva',
                categories: [{ id: 'cat1', name: 'Categoria 1' }, { id: 'cat2', name: 'Categoria 2' }]
            };

            const mockExistingUser = {
                id: '1',
                name: 'João Silva',
                categories: [],
                languages: []
            };

            const mockExistingCategories = [
                { id: 'cat1', name: 'Categoria 1' },
                { id: 'cat2', name: 'Categoria 2' }
            ];

            prismaMock.user.findUnique.mockResolvedValue(mockExistingUser as any);
            prismaMock.category.findMany.mockResolvedValue(mockExistingCategories as any);
            prismaMock.user.update.mockResolvedValue({} as any);

            await updateUser(userId, updateData);

            expect(prismaMock.category.findMany).toHaveBeenCalledWith({
                where: { id: { in: ['cat1', 'cat2'] } }
            });
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    name: 'João Silva',
                    categories: {
                        deleteMany: {},
                        create: [
                            { category: { connect: { id: 'cat1' } } },
                            { category: { connect: { id: 'cat2' } } }
                        ]
                    }
                },
                select: expect.any(Object)
            });
        });

        it('deve lançar erro quando usuário não é encontrado', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(updateUser('999', { name: 'Novo Nome' }))
                .rejects
                .toThrow('Usuário não encontrado');
        });

        it('deve lançar erro quando categoria não é encontrada', async () => {
            const userId = '1';
            const updateData = {
                categories: [{ id: 'cat1', name: 'Categoria 1' }]
            };

            const mockExistingUser = {
                id: '1',
                categories: [],
                languages: []
            };

            prismaMock.user.findUnique.mockResolvedValue(mockExistingUser as any);
            prismaMock.category.findMany.mockResolvedValue([]); // Nenhuma categoria encontrada

            await expect(updateUser(userId, updateData))
                .rejects
                .toThrow('Uma ou mais categorias não foram encontradas');
        });
    });

    describe('deleteUser', () => {
        it('deve deletar usuário com sucesso', async () => {
            const userId = '1';
            const mockUser = {
                id: '1',
                name: 'João Silva'
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.user.delete.mockResolvedValue(mockUser as any);

            const result = await deleteUser(userId);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId }
            });
            expect(prismaMock.user.delete).toHaveBeenCalledWith({
                where: { id: userId }
            });
            expect(result).toEqual({ message: 'Usuário deletado com sucesso' });
        });

        it('deve lançar erro quando usuário não é encontrado', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(deleteUser('999'))
                .rejects
                .toThrow('Usuário não encontrado');
        });
    });

    describe('addCoins', () => {
        it('deve adicionar coins com sucesso', async () => {
            const userId = '1';
            const amount = 100;
            const mockUpdatedUser = {
                id: '1',
                coins: 150
            };

            prismaMock.user.update.mockResolvedValue(mockUpdatedUser as any);

            const result = await addCoins(userId, amount);

            expect(prismaMock.user.update).toHaveBeenCalledWith({
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
            expect(result).toEqual(mockUpdatedUser);
        });

        it('deve lançar erro quando amount é menor ou igual a zero', async () => {
            await expect(addCoins('1', 0))
                .rejects
                .toThrow('A quantidade de coins deve ser maior que zero');

            await expect(addCoins('1', -10))
                .rejects
                .toThrow('A quantidade de coins deve ser maior que zero');
        });
    });

    describe('removeCoins', () => {
        it('deve remover coins com sucesso', async () => {
            const userId = '1';
            const amount = 50;
            const mockUser = {
                coins: 100
            };
            const mockUpdatedUser = {
                id: '1',
                coins: 50
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.user.update.mockResolvedValue(mockUpdatedUser as any);

            const result = await removeCoins(userId, amount);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
                select: { coins: true }
            });
            expect(prismaMock.user.update).toHaveBeenCalledWith({
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
            expect(result).toEqual(mockUpdatedUser);
        });

        it('deve lançar erro quando amount é menor ou igual a zero', async () => {
            await expect(removeCoins('1', 0))
                .rejects
                .toThrow('A quantidade de coins deve ser maior que zero');

            await expect(removeCoins('1', -10))
                .rejects
                .toThrow('A quantidade de coins deve ser maior que zero');
        });

        it('deve lançar erro quando usuário não é encontrado', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(removeCoins('999', 50))
                .rejects
                .toThrow('Usuário não encontrado');
        });

        it('deve lançar erro quando saldo é insuficiente', async () => {
            const userId = '1';
            const amount = 150;
            const mockUser = {
                coins: 100
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            await expect(removeCoins(userId, amount))
                .rejects
                .toThrow('Saldo insuficiente de coins');
        });
    });

    describe('getCoins', () => {
        it('deve buscar coins do usuário com sucesso', async () => {
            const userId = '1';
            const mockUser = {
                id: '1',
                coins: 100
            };

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            const result = await getCoins(userId);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
                select: {
                    id: true,
                    coins: true
                }
            });
            expect(result).toEqual(mockUser);
        });

        it('deve lançar erro quando usuário não é encontrado', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            await expect(getCoins('999'))
                .rejects
                .toThrow('Usuário não encontrado');
        });
    });
});