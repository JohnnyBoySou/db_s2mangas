import bcrypt from 'bcrypt';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  addCoins,
  removeCoins,
  getCoins,
} from '../index';

import { prismaMock } from '../../../test/mocks/prisma';

// Mock das dependências
jest.mock('bcrypt');const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('User Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      // Given
      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@example.com',
          username: 'user1',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          avatar: null,
          cover: null,
        },
        {
          id: 'user-2',
          name: 'User 2',
          email: 'user2@example.com',
          username: 'user2',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          avatar: null,
          cover: null,
        },
      ];
      
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      prismaMock.user.count.mockResolvedValue(20);

      // When
      const result = await listUsers(1, 10);

      // Then
      expect(result).toEqual({
        users: mockUsers,
        total: 20,
        totalPages: 2,
        currentPage: 1,
      });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle pagination correctly', async () => {
      // Given
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(25);

      // When
      await listUsers(3, 10);

      // Then
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        })
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      // Given
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: null,
        cover: null,
        bio: null,
        birthdate: null,
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // When
      const result = await getUserById(userId);

      // Then
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getUserById('non-existent')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('createUser', () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      avatar: 'avatar-url',
      cover: 'cover-url',
    };

    it('should create user successfully', async () => {
      // Given
      prismaMock.user.findFirst.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      const createdUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        emailVerified: true,
        createdAt: new Date(),
        avatar: 'avatar-url',
        cover: 'cover-url',
      };
      prismaMock.user.create.mockResolvedValue(createdUser as any);

      // When
      const result = await createUser(mockUserData);

      // Then
      expect(result).toEqual(createdUser);
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: 'test@example.com' },
            { username: 'testuser' },
          ],
        },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed-password',
          username: 'testuser',
          avatar: 'avatar-url',
          cover: 'cover-url',
          emailVerified: true,
        },
        select: expect.any(Object),
      });
    });

    it('should throw error if email or username already exists', async () => {
      // Given
      prismaMock.user.findFirst.mockResolvedValue({ id: 'existing-user' } as any);

      // When & Then
      await expect(createUser(mockUserData)).rejects.toThrow('Email ou username já cadastrado');
    });

    it('should generate username if not provided', async () => {
      // Given
      const dataWithoutUsername = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      
      prismaMock.user.findFirst.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      prismaMock.user.create.mockResolvedValue({} as any);

      // When
      await createUser(dataWithoutUsername);

      // Then
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: expect.stringMatching(/testuser_[a-z0-9]{5}/),
          }),
        })
      );
    });
  });

  describe('updateUser', () => {
    const userId = 'user-id';

    it('should update user successfully', async () => {
      // Given
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
      };
      
      const existingUser = {
        id: userId,
        name: 'Old Name',
        categories: [],
        languages: [],
      };
      
      const updatedUser = {
        id: userId,
        name: 'Updated Name',
        bio: 'Updated bio',
      };
      
      prismaMock.user.findUnique.mockResolvedValue(existingUser as any);
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // When
      const result = await updateUser(userId, updateData);

      // Then
      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: expect.any(Object),
      });
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(updateUser(userId, { name: 'New Name' })).rejects.toThrow('Usuário não encontrado');
    });

    it('should update categories successfully', async () => {
      // Given
      const updateData = {
        categories: [{ id: 'cat-1', name: 'Category 1' }],
      };
      
      prismaMock.user.findUnique.mockResolvedValue({ id: userId } as any);
      prismaMock.category.findMany.mockResolvedValue([{ id: 'cat-1' }] as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      // When
      await updateUser(userId, updateData);

      // Then
      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['cat-1'] } },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          categories: {
            deleteMany: {},
            create: [{
              category: {
                connect: { id: 'cat-1' }
              }
            }]
          }
        },
        select: expect.any(Object),
      });
    });

    it('should throw error if category not found', async () => {
      // Given
      const updateData = {
        categories: [{ id: 'non-existent', name: 'Category' }],
      };
      
      prismaMock.user.findUnique.mockResolvedValue({ id: userId } as any);
      prismaMock.category.findMany.mockResolvedValue([]);

      // When & Then
      await expect(updateUser(userId, updateData)).rejects.toThrow('Uma ou mais categorias não foram encontradas');
    });

    it('should update languages successfully', async () => {
      // Given
      const updateData = {
        languages: [{ id: 'lang-1', name: 'Language 1' }],
      };
      
      prismaMock.user.findUnique.mockResolvedValue({ id: userId } as any);
      prismaMock.language.findMany.mockResolvedValue([{ id: 'lang-1' }] as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      // When
      await updateUser(userId, updateData);

      // Then
      expect(prismaMock.language.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['lang-1'] } },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          languages: {
            deleteMany: {},
            create: [{
              language: {
                connect: { id: 'lang-1' }
              }
            }]
          }
        },
        select: expect.any(Object),
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Given
      const userId = 'user-id';
      prismaMock.user.findUnique.mockResolvedValue({ id: userId } as any);
      prismaMock.user.delete.mockResolvedValue({} as any);

      // When
      const result = await deleteUser(userId);

      // Then
      expect(result).toEqual({ message: 'Usuário deletado com sucesso' });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(deleteUser('user-id')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('addCoins', () => {
    it('should add coins successfully', async () => {
      // Given
      const userId = 'user-id';
      const amount = 100;
      const updatedUser = { id: userId, coins: 200 };
      
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // When
      const result = await addCoins(userId, amount);

      // Then
      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            increment: amount,
          },
        },
        select: {
          id: true,
          coins: true,
        },
      });
    });

    it('should throw error if amount is zero or negative', async () => {
      // When & Then
      await expect(addCoins('user-id', 0)).rejects.toThrow('A quantidade de coins deve ser maior que zero');
      await expect(addCoins('user-id', -10)).rejects.toThrow('A quantidade de coins deve ser maior que zero');
    });
  });

  describe('removeCoins', () => {
    it('should remove coins successfully', async () => {
      // Given
      const userId = 'user-id';
      const amount = 50;
      const currentUser = { coins: 100 };
      const updatedUser = { id: userId, coins: 50 };
      
      prismaMock.user.findUnique.mockResolvedValue(currentUser as any);
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // When
      const result = await removeCoins(userId, amount);

      // Then
      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            decrement: amount,
          },
        },
        select: {
          id: true,
          coins: true,
        },
      });
    });

    it('should throw error if amount is zero or negative', async () => {
      // When & Then
      await expect(removeCoins('user-id', 0)).rejects.toThrow('A quantidade de coins deve ser maior que zero');
      await expect(removeCoins('user-id', -10)).rejects.toThrow('A quantidade de coins deve ser maior que zero');
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(removeCoins('user-id', 50)).rejects.toThrow('Usuário não encontrado');
    });

    it('should throw error if insufficient coins', async () => {
      // Given
      const userId = 'user-id';
      const amount = 150;
      const currentUser = { coins: 100 };
      
      prismaMock.user.findUnique.mockResolvedValue(currentUser as any);

      // When & Then
      await expect(removeCoins(userId, amount)).rejects.toThrow('Saldo insuficiente de coins');
    });
  });

  describe('getCoins', () => {
    it('should get user coins successfully', async () => {
      // Given
      const userId = 'user-id';
      const user = { id: userId, coins: 150 };
      
      prismaMock.user.findUnique.mockResolvedValue(user as any);

      // When
      const result = await getCoins(userId);

      // Then
      expect(result).toEqual(user);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          coins: true,
        },
      });
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getCoins('user-id')).rejects.toThrow('Usuário não encontrado');
    });
  });
});