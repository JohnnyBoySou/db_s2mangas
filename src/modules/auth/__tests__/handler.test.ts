import { prismaMock } from '../../../test/mocks/prisma';
// Mock do process.env antes das importações
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SMTP_USER = 'test@example.com';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateUsername } from '../../../utils/generate';
import emailAdapter from '../../../config/nodemailer';
import { register, verifyEmailCode, login, getProfile, updateMe, deleteMe } from '../handler';

// Mock das dependências
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@/config/nodemailer');
jest.mock('@/utils/generate');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedEmailAdapter = emailAdapter as jest.Mocked<typeof emailAdapter>;
const mockedGenerateUsername = generateUsername as jest.MockedFunction<typeof generateUsername>;

describe('Auth Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      prismaMock.user.findUnique.mockResolvedValue(null);
      mockedGenerateUsername.mockReturnValue('testuser');
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // Para verificar username
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      prismaMock.user.create.mockResolvedValue({
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
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-user' } as any);

      // When & Then
      await expect(register(mockRegisterData)).rejects.toThrow('Email já cadastrado');
    });

    it('should generate unique username if collision occurs', async () => {
      // Given
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce({ id: 'existing' } as any) // Username collision
        .mockResolvedValueOnce(null); // Username with suffix available
      
      mockedGenerateUsername.mockReturnValue('testuser');
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      prismaMock.user.create.mockResolvedValue({
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
      const futureDate = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes in future
      
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        emailVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExp: futureDate,
      } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

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
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(verifyEmailCode('test@example.com', '123456')).rejects.toThrow('Usuário não encontrado ou já verificado');
    });

    it('should throw error if user already verified', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        emailVerified: true,
      } as any);

      // When & Then
      await expect(verifyEmailCode('test@example.com', '123456')).rejects.toThrow('Usuário não encontrado ou já verificado');
    });

    it('should throw error if code is invalid or expired', async () => {
      // Given
      const pastDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes in past
      prismaMock.user.findUnique.mockResolvedValue({
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
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue('jwt-token' as never);

      // When
      const result = await login(mockLoginData);

      // Then
      expect(result).toEqual({ token: 'jwt-token', user: mockUser });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockedJwt.sign).toHaveBeenCalledWith({ id: 'user-id' }, 'test-jwt-secret', { expiresIn: "15d" });
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(login(mockLoginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw error if password is invalid', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
      } as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // When & Then
      await expect(login(mockLoginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('should resend verification code if email not verified', async () => {
      // Given
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        emailVerified: false,
        name: 'Test User',
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      prismaMock.user.update.mockResolvedValue({} as any);
      mockedEmailAdapter.sendMail.mockResolvedValue(undefined as any);

      // When & Then
      await expect(login(mockLoginData)).rejects.toThrow('Email não verificado. Código de verificação reenviado.');
      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(mockedEmailAdapter.sendMail).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Given
      const userId = 'user-id';
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        bio: 'Test bio',
        createdAt: new Date(),
        birthdate: new Date(),
        categories: [],
        languages: [],
        cover: null,
        avatar: null,
        coins: 100,
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

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
          bio: true,
          createdAt: true,
          birthdate: true,
          categories: true,
          languages: true,
          cover: true,
          avatar: true,
          coins: true,
        },
      });
    });

    it('should throw error if userId is not provided', async () => {
      // When & Then
      await expect(getProfile('')).rejects.toThrow('Não autorizado');
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getProfile('user-id')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('updateMe', () => {
    const userId = 'user-id';

    it('should update user successfully', async () => {
      // Given
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
      };
      
      const updatedUser = {
        id: userId,
        name: 'Updated Name',
        bio: 'Updated bio',
        username: 'testuser',
        birthdate: null,
        avatar: null,
        cover: null,
        categories: [],
        languages: [],
      };
      
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // When
      const result = await updateMe(userId, updateData);

      // Then
      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: expect.any(Object),
      });
    });

    it('should throw error if nothing to update', async () => {
      // When & Then
      await expect(updateMe(userId, {})).rejects.toThrow('Nada para atualizar');
    });

    it('should throw error if username already exists', async () => {
      // Given
      const updateData = { username: 'existinguser' };
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'other-user-id',
        username: 'existinguser',
      } as any);

      // When & Then
      await expect(updateMe(userId, updateData)).rejects.toThrow('Username já está em uso');
    });

    it('should update categories successfully', async () => {
      // Given
      const updateData = {
        categories: [{ id: 'cat-1', name: 'Category 1' }],
      };
      
      prismaMock.category.findMany.mockResolvedValue([{ id: 'cat-1' }] as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      // When
      await updateMe(userId, updateData);

      // Then
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          categories: {
            set: [{ id: 'cat-1' }]
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
      
      prismaMock.category.findMany.mockResolvedValue([]);

      // When & Then
      await expect(updateMe(userId, updateData)).rejects.toThrow('Uma ou mais categorias não foram encontradas');
    });
  });

  describe('deleteMe', () => {
    it('should delete user successfully', async () => {
      // Given
      const userId = 'user-id';
      prismaMock.user.findUnique.mockResolvedValue({ id: userId } as any);
      prismaMock.user.delete.mockResolvedValue({} as any);

      // When
      const result = await deleteMe(userId);

      // Then
      expect(result).toEqual({ message: "Conta deletada com sucesso" });
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw error if userId is not provided', async () => {
      // When & Then
      await expect(deleteMe('')).rejects.toThrow('ID do usuário não encontrado no token');
    });

    it('should throw error if user not found', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(deleteMe('user-id')).rejects.toThrow('Usuário não encontrado');
    });
  });
});