import { prismaMock } from '../../../test/mocks/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateUsername } from '../../../utils/generate';
import emailAdapter from '../../../config/nodemailer';

// Mock do process.env antes das importações
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SMTP_USER = 'test@example.com';

// Mock do UsernameBloomFilter
const mockUsernameBloomFilter = {
    checkUsernameExists: jest.fn(),
    addUsername: jest.fn(),
    mightExist: jest.fn(),
    initialize: jest.fn(),
    getStats: jest.fn(),
    reset: jest.fn()
};

jest.mock('@/services/UsernameBloomFilter', () => ({
    __esModule: true,
    usernameBloomFilter: mockUsernameBloomFilter,
    UsernameBloomFilter: jest.fn(() => mockUsernameBloomFilter)
}));

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
    __esModule: true,
    default: prismaMock,
}));

// Mock das dependências
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@/config/nodemailer');
jest.mock('@/utils/generate');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedEmailAdapter = emailAdapter as jest.Mocked<typeof emailAdapter>;
const mockedGenerateUsername = generateUsername as jest.MockedFunction<typeof generateUsername>;

import { register, verifyEmailCode, login, getProfile, updateMe, deleteMe } from '../handlers/AuthHandler';

describe('Auth Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsernameBloomFilter.checkUsernameExists.mockResolvedValue(false);
    mockUsernameBloomFilter.addUsername.mockReturnValue(undefined);
  });

  describe('register', () => {
    const mockRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      avatar: 'avatar-url',
      cover: 'cover-url',
    };

    it('should register a new user successfully', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockedGenerateUsername.mockReturnValue('testuser');
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // Para verificar username
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      (prismaMock.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
      } as any);
      mockedEmailAdapter.sendMail.mockResolvedValue(undefined as any);

      // When
      const result = await register(mockRegisterData);

      // Then
      expect(result).toEqual({ message: "Usuário criado. Verifique seu email com o código enviado." });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(mockedEmailAdapter.sendMail).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' } as any);

      // When & Then
      await expect(register(mockRegisterData)).rejects.toThrow('Email já cadastrado');
    });

    it('should generate unique username if collision occurs', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null); // Email check
      
      // Mock bloom filter to return true for 'testuser' and false for 'testuser_1'
      mockUsernameBloomFilter.checkUsernameExists
        .mockResolvedValueOnce(true)  // 'testuser' exists
        .mockResolvedValueOnce(false); // 'testuser_1' doesn't exist
      
      mockedGenerateUsername.mockReturnValue('testuser');
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      (prismaMock.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        username: 'testuser_1',
      } as any);
      mockedEmailAdapter.sendMail.mockResolvedValue(undefined as any);

      // When
      await register(mockRegisterData);

      // Then
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'testuser_1'
          })
        })
      );
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify email code successfully', async () => {
      // Given
      const email = 'test@example.com';
      const code = '123456';
      const futureDate = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes in future
      
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        emailVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExp: futureDate,
      } as any);
      (prismaMock.user.update as jest.Mock).mockResolvedValue({} as any);

      // When
      const result = await verifyEmailCode(email, code);

      // Then
      expect(result).toEqual({ message: "Email verificado com sucesso" });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          emailVerified: true,
          emailVerificationCode: null,
          emailVerificationExp: null,
        },
      });
    });

    it('should throw error if email or code is missing', async () => {
      // When & Then
      await expect(verifyEmailCode('', '123456')).rejects.toThrow('Email e código são obrigatórios');
      await expect(verifyEmailCode('test@example.com', '')).rejects.toThrow('Email e código são obrigatórios');
    });

    it('should throw error if user not found', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(verifyEmailCode('test@example.com', '123456')).rejects.toThrow('Usuário não encontrado ou já verificado');
    });

    it('should throw error if user already verified', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        emailVerified: true,
      } as any);

      // When & Then
      await expect(verifyEmailCode('test@example.com', '123456')).rejects.toThrow('Usuário não encontrado ou já verificado');
    });

    it('should throw error if code is invalid or expired', async () => {
      // Given
      const pastDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes in past
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        emailVerified: false,
        emailVerificationCode: '654321',
        emailVerificationExp: pastDate,
      } as any);

      // When & Then
      await expect(verifyEmailCode('test@example.com', '123456')).rejects.toThrow('Código inválido ou expirado');
    });
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with verified email', async () => {
      // Given
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        emailVerified: true,
        name: 'Test User',
        username: 'testuser',
      };

      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue('jwt-token' as never);
      (prismaMock.user.update as jest.Mock).mockResolvedValue({} as any);

      // When
      const result = await login(mockLoginData);

      // Then
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockedJwt.sign).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(login(mockLoginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw error if password is incorrect', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
      } as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // When & Then
      await expect(login(mockLoginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw error if email not verified', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        emailVerified: false,
      } as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // When & Then
      await expect(login(mockLoginData)).rejects.toThrow('Email não verificado');
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      // Given
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        avatar: 'avatar-url',
        cover: 'cover-url',
        bio: 'Test bio',
        birthdate: null,
        categories: [],
        languages: [],
        coins: 100,
        createdAt: new Date(),
      };

      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);

      // When
      const result = await getProfile(userId);

      // Then
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatar: true,
          cover: true,
          bio: true,
          birthdate: true,
          categories: true,
          languages: true,
          coins: true,
          createdAt: true,
        },
      });
    });

    it('should throw error if user not found', async () => {
      // Given
      const userId = 'user-id';
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(getProfile(userId)).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('updateMe', () => {
    const userId = 'user-id';
    const updateData = {
      name: 'Updated Name',
      bio: 'Updated bio',
    };

    it('should update user successfully', async () => {
      // Given
      const updatedUser = {
        id: userId,
        ...updateData,
      };

      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(updatedUser as any);
      (prismaMock.user.update as jest.Mock).mockResolvedValue(updatedUser as any);

      // When
      const result = await updateMe(userId, updateData);

      // Then
      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          cover: true,
          bio: true,
          birthdate: true,
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          languages: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should throw error if username already exists', async () => {
      // Given
      const updateDataWithUsername = { ...updateData, username: 'existinguser' };
      
      // Mock bloom filter to indicate username might exist
      mockUsernameBloomFilter.checkUsernameExists.mockResolvedValue(true);
      
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'other-user-id',
        username: 'existinguser',
      } as any);

      // When & Then
      await expect(updateMe(userId, updateDataWithUsername)).rejects.toThrow('Username já está em uso');
    });

    it('should handle category updates successfully', async () => {
      // Given
      const updateDataWithCategories = {
        ...updateData,
        categories: [{ id: 'cat-1', name: 'Category 1' }, { id: 'cat-2', name: 'Category 2' }],
      };
      const updatedUser = {
        id: userId,
        ...updateData,
      };

      (prismaMock.category.findMany as jest.Mock).mockResolvedValue([{ id: 'cat-1' }, { id: 'cat-2' }] as any);
      (prismaMock.user.update as jest.Mock).mockResolvedValue({} as any);

      // When
      await updateMe(userId, updateDataWithCategories);

      // Then
      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['cat-1', 'cat-2'] } },
      });
    });

    it('should handle empty categories array', async () => {
      // Given
      const updateDataWithEmptyCategories = {
        ...updateData,
        categories: [],
      };

      (prismaMock.category.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.user.update as jest.Mock).mockResolvedValue({} as any);

      // When
      await updateMe(userId, updateDataWithEmptyCategories);

      // Then
      expect(prismaMock.user.update).toHaveBeenCalled();
    });
  });

  describe('deleteMe', () => {
    const userId = 'user-id';

    it('should delete user successfully', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: userId } as any);
      (prismaMock.user.delete as jest.Mock).mockResolvedValue({} as any);

      // When
      const result = await deleteMe(userId);

      // Then
      expect(result).toEqual({ message: "Conta deletada com sucesso" });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw error if user not found', async () => {
      // Given
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(deleteMe(userId)).rejects.toThrow('Usuário não encontrado');
    });
  });
});