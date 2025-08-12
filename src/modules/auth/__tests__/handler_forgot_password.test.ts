import { prismaMock } from '../../../test/mocks/prisma';
import { forgotPassword, verifyResetCode, resetPassword } from '../handler_forgot_password';
import bcrypt from 'bcrypt';
import emailAdapter from '../../../config/nodemailer';

// Mock das dependências
jest.mock('bcrypt');
jest.mock('@/config/nodemailer', () => ({
  sendMail: jest.fn(),
}));

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;
const emailMock = emailAdapter as jest.Mocked<typeof emailAdapter>;

// Mock do process.env
process.env.SMTP_USER = 'test@example.com';

describe('Forgot Password Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01 00:00:00
    jest.spyOn(Math, 'random').mockReturnValue(0.123456); // Para gerar OTP consistente
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('forgotPassword', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('deve enviar código de recuperação com sucesso', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, resetToken: expect.any(String), resetTokenExp: new Date() });
      emailMock.sendMail.mockResolvedValue({
        messageId: 'test-id',
        envelope: { from: 'test@example.com', to: ['test@example.com'] },
        accepted: ['test@example.com'],
        rejected: [],
        pending: [],
        response: '250 OK'
      } as any);

      // When
      const result = await forgotPassword('test@example.com');

      // Then
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          resetToken: expect.any(String),
          resetTokenExp: new Date(1640995200000 + 1000 * 60 * 60), // 1 hora depois
        },
      });

      expect(emailMock.sendMail).toHaveBeenCalledWith({
        from: '"Seu App" <test@example.com>',
        to: 'test@example.com',
        subject: 'Código para redefinição de senha',
        html: expect.any(String),
      });

      expect(result).toEqual({ message: 'Código enviado para seu email' });
    });

    it('deve lançar erro quando email não for fornecido', async () => {
      // When & Then
      await expect(forgotPassword('')).rejects.toThrow('Email é obrigatório');
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando usuário não for encontrado', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(forgotPassword('nonexistent@example.com'))
        .rejects.toThrow('Usuário não encontrado');
      
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(emailMock.sendMail).not.toHaveBeenCalled();
    });

    it('deve lidar com erro no envio de email', async () => {
      // Given
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, resetToken: expect.any(String), resetTokenExp: new Date() });
      emailMock.sendMail.mockRejectedValue(new Error('Erro no envio'));

      // When & Then
      await expect(forgotPassword('test@example.com'))
        .rejects.toThrow('Erro no envio');
    });
  });

  describe('verifyResetCode', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      resetToken: '123456',
      resetTokenExp: new Date(Date.now() + 1000 * 60 * 30), // 30 minutos no futuro
    };

    it('deve verificar código válido com sucesso', async () => {
      // Given
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      // When
      const result = await verifyResetCode('test@example.com', '123456');

      // Then
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          resetToken: '123456',
          resetTokenExp: { gte: expect.any(Date) },
        },
      });

      expect(result).toEqual({ message: 'Código válido' });
    });

    it('deve lançar erro quando email não for fornecido', async () => {
      // When & Then
      await expect(verifyResetCode('', '123456'))
        .rejects.toThrow('Email e código são obrigatórios');
      
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando código não for fornecido', async () => {
      // When & Then
      await expect(verifyResetCode('test@example.com', ''))
        .rejects.toThrow('Email e código são obrigatórios');
      
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando código for inválido', async () => {
      // Given
      prismaMock.user.findFirst.mockResolvedValue(null);

      // When & Then
      await expect(verifyResetCode('test@example.com', 'invalid-code'))
        .rejects.toThrow('Código inválido ou expirado');
    });

    it('deve lançar erro quando código estiver expirado', async () => {
      // Given
      const expiredUser = {
        ...mockUser,
        resetTokenExp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos no passado
      };
      prismaMock.user.findFirst.mockResolvedValue(null); // Simulando que não encontrou devido à expiração

      // When & Then
      await expect(verifyResetCode('test@example.com', '123456'))
        .rejects.toThrow('Código inválido ou expirado');
    });
  });

  describe('resetPassword', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      resetToken: '123456',
      resetTokenExp: new Date(Date.now() + 1000 * 60 * 30), // 30 minutos no futuro
    };

    it('deve redefinir senha com sucesso', async () => {
      // Given
      const newPassword = 'newPassword123';
      const hashedPassword = 'hashedPassword123';
      
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.update.mockResolvedValue({ 
        ...mockUser, 
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null 
      });

      // When
      const result = await resetPassword('test@example.com', '123456', newPassword);

      // Then
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          resetToken: '123456',
          resetTokenExp: { gte: expect.any(Date) },
        },
      });

      expect(bcryptMock.hash).toHaveBeenCalledWith(newPassword, 10);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExp: null,
        },
      });

      expect(result).toEqual({ message: 'Senha atualizada com sucesso' });
    });

    it('deve lançar erro quando email não for fornecido', async () => {
      // When & Then
      await expect(resetPassword('', '123456', 'newPassword'))
        .rejects.toThrow('Email, código e nova senha são obrigatórios');
      
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando código não for fornecido', async () => {
      // When & Then
      await expect(resetPassword('test@example.com', '', 'newPassword'))
        .rejects.toThrow('Email, código e nova senha são obrigatórios');
      
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando nova senha não for fornecida', async () => {
      // When & Then
      await expect(resetPassword('test@example.com', '123456', ''))
        .rejects.toThrow('Email, código e nova senha são obrigatórios');
      
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando código for inválido ou expirado', async () => {
      // Given
      prismaMock.user.findFirst.mockResolvedValue(null);

      // When & Then
      await expect(resetPassword('test@example.com', 'invalid-code', 'newPassword'))
        .rejects.toThrow('Código inválido ou expirado');
      
      expect(bcryptMock.hash).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deve lidar com erro no hash da senha', async () => {
      // Given
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      bcryptMock.hash.mockRejectedValue(new Error('Erro no hash') as never);

      // When & Then
      await expect(resetPassword('test@example.com', '123456', 'newPassword'))
        .rejects.toThrow('Erro no hash');
      
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deve lidar com erro na atualização do banco de dados', async () => {
      // Given
      const hashedPassword = 'hashedPassword123';
      
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.update.mockRejectedValue(new Error('Erro no banco'));

      // When & Then
      await expect(resetPassword('test@example.com', '123456', 'newPassword'))
        .rejects.toThrow('Erro no banco');
    });
  });

  describe('Integração - Fluxo completo', () => {
    const mockUser = {
      id: 'user-1',
      email: 'integration@example.com',
      name: 'Integration User',
    };

    it('deve executar fluxo completo de recuperação de senha', async () => {
      // Step 1: Solicitar código
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, resetToken: '223456', resetTokenExp: new Date() });
      emailMock.sendMail.mockResolvedValue({
        messageId: 'test-id',
        envelope: { from: 'test@example.com', to: ['integration@example.com'] },
        accepted: ['integration@example.com'],
        rejected: [],
        pending: [],
        response: '250 OK'
      } as any);

      const forgotResult = await forgotPassword('integration@example.com');
      expect(forgotResult.message).toBe('Código enviado para seu email');

      // Step 2: Verificar código
      const userWithToken = {
        ...mockUser,
        resetToken: '223456',
        resetTokenExp: new Date(Date.now() + 1000 * 60 * 30),
      };
      prismaMock.user.findFirst.mockResolvedValue(userWithToken);

      const verifyResult = await verifyResetCode('integration@example.com', '223456');
      expect(verifyResult.message).toBe('Código válido');

      // Step 3: Redefinir senha
      const hashedPassword = 'newHashedPassword';
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.update.mockResolvedValue({ 
        ...userWithToken, 
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null 
      });

      const resetResult = await resetPassword('integration@example.com', '223456', 'newPassword123');
      expect(resetResult.message).toBe('Senha atualizada com sucesso');
    });
  });
});