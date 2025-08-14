import request from 'supertest';
import express from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('../handlers/AuthHandler', () => ({
    register: jest.fn(),
    verifyEmailCode: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    updateMe: jest.fn(),
    deleteMe: jest.fn()
}));

jest.mock('@/utils/zodError');
jest.mock('../validators/AuthSchema', () => ({
  loginSchema: {
    parse: jest.fn()
  },
  registerSchema: {
    parse: jest.fn()
  },
  updateUserSchema: {
    parse: jest.fn()
  }
}));

const mockedAuthHandlers = require('../handlers/AuthHandler');
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Importar os schemas mockados
const { loginSchema, registerSchema, updateUserSchema } = require('../validators/AuthSchema');

import * as authController from '../controllers/AuthController';

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Middleware para simular usuário autenticado
app.use((req, res, next) => {
  (req as any).user = { id: 'user-123' };
  next();
});

// Rotas para teste
app.post('/auth/register', authController.register);
app.post('/auth/verify-email', authController.verifyEmailCode);
app.post('/auth/login', authController.login);
app.get('/auth/profile', authController.getProfile);
app.put('/auth/me', authController.updateMe);
app.delete('/auth/me', authController.deleteMe);

describe('Controlador de Autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const mockRegisterData = {
      name: 'João Silva',
      email: 'joao@example.com',
      username: 'joaosilva',
      password: 'senha123'
    };

    const mockRegisterResponse = {
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com',
        username: 'joaosilva'
      }
    };

    it('deve registrar um usuário com sucesso', async () => {
      // Given
      registerSchema.parse.mockReturnValue(mockRegisterData as any);
      mockedAuthHandlers.register.mockResolvedValue(mockRegisterResponse as any);

      // When
      const response = await request(app)
        .post('/auth/register')
        .send(mockRegisterData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockRegisterResponse);
      expect(registerSchema.parse).toHaveBeenCalledWith(mockRegisterData);
      expect(mockedAuthHandlers.register).toHaveBeenCalledWith(mockRegisterData);
    });
  });

  describe('POST /auth/verify-email', () => {
    const mockVerifyEmailData = {
      email: 'joao@example.com',
      code: '123456'
    };

    const mockVerifyEmailResponse = {
      success: true,
      message: 'Email verificado com sucesso'
    };

    it('deve verificar o código de email com sucesso', async () => {
      // Given
      mockedAuthHandlers.verifyEmailCode.mockResolvedValue(mockVerifyEmailResponse as any);

      // When
      const response = await request(app)
        .post('/auth/verify-email')
        .send(mockVerifyEmailData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVerifyEmailResponse);
      expect(mockedAuthHandlers.verifyEmailCode).toHaveBeenCalledWith(
        mockVerifyEmailData.email,
        mockVerifyEmailData.code
      );
    });

  });

  describe('POST /auth/login', () => {
    const mockLoginData = {
      email: 'joao@example.com',
      password: 'senha123'
    };

    const mockLoginResponse = {
      success: true,
      token: 'jwt-token-123',
      user: {
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com'
      }
    };

    it('deve fazer login com sucesso', async () => {
      // Given
      loginSchema.parse.mockReturnValue(mockLoginData as any);
      mockedAuthHandlers.login.mockResolvedValue(mockLoginResponse as any);

      // When
      const response = await request(app)
        .post('/auth/login')
        .send(mockLoginData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLoginResponse);
      expect(loginSchema.parse).toHaveBeenCalledWith(mockLoginData);
      expect(mockedAuthHandlers.login).toHaveBeenCalledWith(mockLoginData);
    });
  });

  describe('GET /auth/profile', () => {
    const mockProfileResponse = {
      id: 'user-123',
      name: 'João Silva',
      email: 'joao@example.com',
      username: 'joaosilva',
      avatar: 'avatar.jpg',
      bio: 'Desenvolvedor'
    };

    it('deve obter o perfil do usuário com sucesso', async () => {
      // Given
      mockedAuthHandlers.getProfile.mockResolvedValue(mockProfileResponse as any);

      // When
      const response = await request(app)
        .get('/auth/profile');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfileResponse);
      expect(mockedAuthHandlers.getProfile).toHaveBeenCalledWith('user-123');
    });

    it('deve lidar com erro ao obter perfil', async () => {
      // Given
      const profileError = new Error('Usuário não encontrado');
      mockedAuthHandlers.getProfile.mockRejectedValue(profileError);

      // When
      const response = await request(app)
        .get('/auth/profile');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Usuário não encontrado' });
    });

    it('deve lidar com erro desconhecido ao obter perfil', async () => {
      // Given
      const unknownError = 'Erro desconhecido';
      mockedAuthHandlers.getProfile.mockRejectedValue(unknownError);

      // When
      const response = await request(app)
        .get('/auth/profile');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno' });
    });
  });

  describe('PUT /auth/me', () => {
    const mockUpdateData = {
      name: 'João Silva Atualizado',
      email: 'joao.novo@example.com',
      username: 'joaosilva_novo',
      avatar: 'novo-avatar.jpg',
      cover: 'nova-capa.jpg',
      bio: 'Desenvolvedor Senior',
      birthdate: '1990-01-01'
    };

    const mockUpdateResponse = {
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: {
        id: 'user-123',
        ...mockUpdateData
      }
    };

    it('deve atualizar o perfil do usuário com sucesso', async () => {
      // Given
      updateUserSchema.parse.mockReturnValue(mockUpdateData as any);
      mockedAuthHandlers.updateMe.mockResolvedValue(mockUpdateResponse as any);

      // When
      const response = await request(app)
        .put('/auth/me')
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdateResponse);
      expect(updateUserSchema.parse).toHaveBeenCalledWith(mockUpdateData);
      expect(mockedAuthHandlers.updateMe).toHaveBeenCalledWith('user-123', {
        name: mockUpdateData.name,
        email: mockUpdateData.email,
        username: mockUpdateData.username,
        avatar: mockUpdateData.avatar,
        cover: mockUpdateData.cover,
        bio: mockUpdateData.bio,
        birthdate: mockUpdateData.birthdate
      });
    });
    

    it('deve lidar com erro do handler de atualização', async () => {
      // Given
      const updateError = new Error('Erro ao atualizar usuário');
      updateUserSchema.parse.mockReturnValue(mockUpdateData as any);
      mockedAuthHandlers.updateMe.mockRejectedValue(updateError);

      // When
      const response = await request(app)
        .put('/auth/me')
        .send(mockUpdateData);

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro ao atualizar usuário' });
    });
  });

  describe('DELETE /auth/me', () => {
    const mockDeleteResponse = {
      success: true,
      message: 'Conta deletada com sucesso'
    };

    it('deve deletar a conta do usuário com sucesso', async () => {
      // Given
      mockedAuthHandlers.deleteMe.mockResolvedValue(mockDeleteResponse as any);

      // When
      const response = await request(app)
        .delete('/auth/me');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDeleteResponse);
      expect(mockedAuthHandlers.deleteMe).toHaveBeenCalledWith('user-123');
    });

    it('deve lidar com erro ao deletar conta', async () => {
      // Given
      const deleteError = new Error('Erro ao deletar conta');
      mockedAuthHandlers.deleteMe.mockRejectedValue(deleteError);

      // When
      const response = await request(app)
        .delete('/auth/me');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro ao deletar conta' });
    });

    it('deve lidar com erro desconhecido ao deletar conta', async () => {
      // Given
      const unknownError = 'Erro desconhecido';
      mockedAuthHandlers.deleteMe.mockRejectedValue(unknownError);

      // When
      const response = await request(app)
        .delete('/auth/me');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno' });
    });
  });
});