import request from 'supertest';
import express from 'express';
import * as forgotPasswordController from '../controllers/ForgotPasswordController';
import * as forgotPasswordHandlers from '../handlers/ForgotPasswordHandler';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('../handlers/ForgotPasswordHandler', () => ({
    forgotPassword: jest.fn(),
    verifyResetCode: jest.fn(),
    resetPassword: jest.fn()
}));

jest.mock('@/utils/zodError');
jest.mock('@/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    }
  }
}));
jest.mock('@/config/nodemailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
}));

const mockedForgotPasswordHandlers = require('../handlers/ForgotPasswordHandler');
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Rotas para teste
app.post('/auth/forgot-password', forgotPasswordController.forgotPassword);
app.post('/auth/verify-reset-code', forgotPasswordController.verifyResetCode);
app.post('/auth/reset-password', forgotPasswordController.resetPassword);

describe('Controlador de Recuperação de Senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restaurar o comportamento real do handleZodError para os testes de erro
    mockedHandleZodError.mockImplementation((error, res) => {
      // Se for um erro do Zod
      if (error instanceof Error && error.name === 'ZodError') {
        const formattedErrors = (error as any).errors.map((err: any) => ({
          field: err.path.join('.') || '(root)',
          message: err.message,
        }))
        return res.status(400).json({ errors: formattedErrors })
      }

      // Se for um erro customizado (Error comum)
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      // Para outros tipos de erro
      return res.status(400).json({ error: 'Erro interno' })
    });
  });

  describe('POST /auth/forgot-password', () => {
    const mockForgotPasswordData = {
      email: 'joao@example.com'
    };

    const mockForgotPasswordResponse = {
      success: true,
      message: 'Código de recuperação enviado para o email'
    };

    it('deve enviar código de recuperação com sucesso', async () => {
      // Given
      mockedForgotPasswordHandlers.forgotPassword.mockResolvedValue(mockForgotPasswordResponse as any);

      // When
      const response = await request(app)
        .post('/auth/forgot-password')
        .send(mockForgotPasswordData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockForgotPasswordResponse);
      expect(mockedForgotPasswordHandlers.forgotPassword).toHaveBeenCalledWith(mockForgotPasswordData.email);
    });

    it('deve lidar com erro ao enviar código de recuperação', async () => {
      // Given
      const forgotPasswordError = new Error('Email não encontrado');
      mockedForgotPasswordHandlers.forgotPassword.mockRejectedValue(forgotPasswordError);

      // When
      const response = await request(app)
        .post('/auth/forgot-password')
        .send(mockForgotPasswordData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email não encontrado' });
    });

    it('deve lidar com erro desconhecido ao enviar código de recuperação', async () => {
      // Given
      const unknownError = 'Erro desconhecido';
      mockedForgotPasswordHandlers.forgotPassword.mockRejectedValue(unknownError);

      // When
      const response = await request(app)
        .post('/auth/forgot-password')
        .send(mockForgotPasswordData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Erro interno' });
    });
  });

  describe('POST /auth/verify-reset-code', () => {
    const mockVerifyCodeData = {
      email: 'joao@example.com',
      code: '123456'
    };

    const mockVerifyCodeResponse = {
      success: true,
      message: 'Código verificado com sucesso'
    };

    it('deve verificar código de recuperação com sucesso', async () => {
      // Given
      mockedForgotPasswordHandlers.verifyResetCode.mockResolvedValue(mockVerifyCodeResponse as any);

      // When
      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send(mockVerifyCodeData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVerifyCodeResponse);
      expect(mockedForgotPasswordHandlers.verifyResetCode).toHaveBeenCalledWith(
        mockVerifyCodeData.email,
        mockVerifyCodeData.code
      );
    });

    it('deve lidar com erro ao verificar código de recuperação', async () => {
      // Given
      const verifyCodeError = new Error('Código inválido ou expirado');
      mockedForgotPasswordHandlers.verifyResetCode.mockRejectedValue(verifyCodeError);

      // When
      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send(mockVerifyCodeData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Código inválido ou expirado' });
    });

    it('deve lidar com erro desconhecido ao verificar código', async () => {
      // Given
      const unknownError = 'Erro desconhecido';
      mockedForgotPasswordHandlers.verifyResetCode.mockRejectedValue(unknownError);

      // When
      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send(mockVerifyCodeData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Erro interno' });
    });
  });

  describe('POST /auth/reset-password', () => {
    const mockResetPasswordData = {
      email: 'joao@example.com',
      code: '123456',
      newPassword: 'novaSenha123'
    };

    const mockResetPasswordResponse = {
      success: true,
      message: 'Senha redefinida com sucesso'
    };

    it('deve redefinir senha com sucesso', async () => {
      // Given
      mockedForgotPasswordHandlers.resetPassword.mockResolvedValue(mockResetPasswordResponse as any);

      // When
      const response = await request(app)
        .post('/auth/reset-password')
        .send(mockResetPasswordData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResetPasswordResponse);
      expect(mockedForgotPasswordHandlers.resetPassword).toHaveBeenCalledWith(
        mockResetPasswordData.email,
        mockResetPasswordData.code,
        mockResetPasswordData.newPassword
      );
    });

    it('deve lidar com erro ao redefinir senha', async () => {
      // Given
      const resetPasswordError = new Error('Código inválido ou expirado');
      mockedForgotPasswordHandlers.resetPassword.mockRejectedValue(resetPasswordError);

      // When
      const response = await request(app)
        .post('/auth/reset-password')
        .send(mockResetPasswordData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Código inválido ou expirado' });
    });

    it('deve lidar com erro desconhecido ao redefinir senha', async () => {
      // Given
      const unknownError = 'Erro desconhecido';
      mockedForgotPasswordHandlers.resetPassword.mockRejectedValue(unknownError);

      // When
      const response = await request(app)
        .post('/auth/reset-password')
        .send(mockResetPasswordData);

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Erro interno' });
    });

    it('deve validar dados obrigatórios para redefinir senha', async () => {
      // Given
      const incompleteData = {
        email: 'joao@example.com',
        code: '123456'
        // newPassword ausente
      };

      // When
      const response = await request(app)
        .post('/auth/reset-password')
        .send(incompleteData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
      expect(mockedForgotPasswordHandlers.resetPassword).not.toHaveBeenCalled();
    });

    it('deve validar email obrigatório para redefinir senha', async () => {
      // Given
      const incompleteData = {
        code: '123456',
        newPassword: 'novaSenha123'
        // email ausente
      };

      // When
      const response = await request(app)
        .post('/auth/reset-password')
        .send(incompleteData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
      expect(mockedForgotPasswordHandlers.resetPassword).not.toHaveBeenCalled();
    });

    it('deve validar código obrigatório para redefinir senha', async () => {
      // Given
      const incompleteData = {
        email: 'joao@example.com',
        newPassword: 'novaSenha123'
        // code ausente
      };

      // When
      const response = await request(app)
        .post('/auth/reset-password')
        .send(incompleteData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
      expect(mockedForgotPasswordHandlers.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('Validação de dados de entrada', () => {
    beforeEach(() => {
      // Configurar o mock do handleZodError para simular erro de validação
      mockedHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ error: 'Dados inválidos' });
      });
    });

    it('deve lidar com email ausente no forgot-password', async () => {
      // Given
      const incompleteData = {};

      // When
      const response = await request(app)
        .post('/auth/forgot-password')
        .send(incompleteData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
      expect(mockedForgotPasswordHandlers.forgotPassword).not.toHaveBeenCalled();
    });

    it('deve lidar com dados ausentes no verify-reset-code', async () => {
      // Given
      const incompleteData = {
        email: 'joao@example.com'
        // code ausente
      };

      // When
      const response = await request(app)
        .post('/auth/verify-reset-code')
        .send(incompleteData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
      expect(mockedForgotPasswordHandlers.verifyResetCode).not.toHaveBeenCalled();
    });
  });
});