import { Request, Response, NextFunction } from 'express';
import * as coinsController from '../index';
import * as coinsHandler from '../../../handlers/coins';

// Mock dos handlers
jest.mock('../../../handlers/coins');
const mockCoinsHandler = coinsHandler as jest.Mocked<typeof coinsHandler>;

describe('Coins Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    
    mockReq = {
      user: { id: 'user-123' }
    };
    
    mockRes = {
      json: mockJson,
      status: mockStatus
    };

    jest.clearAllMocks();
  });

  describe('add', () => {
    it('deve adicionar coins com sucesso', async () => {
      // Given
      const mockUser = { id: 'user-123', coins: 130 };
      mockCoinsHandler.addCoins.mockResolvedValue(mockUser);

      // When
      await coinsController.add(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCoinsHandler.addCoins).toHaveBeenCalledWith('user-123');
      expect(mockJson).toHaveBeenCalledWith(mockUser);
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando addCoins falha', async () => {
      // Given
      const errorMessage = 'Erro ao adicionar coins';
      mockCoinsHandler.addCoins.mockRejectedValue(new Error(errorMessage));

      // When
      await coinsController.add(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCoinsHandler.addCoins).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });

    it('deve lidar com usuário sem ID', async () => {
      // Given
      mockReq.user = undefined;
      const errorMessage = 'Cannot read properties of undefined';
      mockCoinsHandler.addCoins.mockRejectedValue(new Error(errorMessage));

      // When
      await coinsController.add(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('remove', () => {
    it('deve remover coins com sucesso', async () => {
      // Given
      const mockUser = { id: 'user-123', coins: 85 };
      mockCoinsHandler.removeCoins.mockResolvedValue(mockUser);

      // When
      await coinsController.remove(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCoinsHandler.removeCoins).toHaveBeenCalledWith('user-123');
      expect(mockJson).toHaveBeenCalledWith(mockUser);
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando removeCoins falha', async () => {
      // Given
      const errorMessage = 'Saldo insuficiente de coins';
      mockCoinsHandler.removeCoins.mockRejectedValue(new Error(errorMessage));

      // When
      await coinsController.remove(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCoinsHandler.removeCoins).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });

    it('deve lidar com usuário não encontrado', async () => {
      // Given
      const errorMessage = 'Usuário não encontrado';
      mockCoinsHandler.removeCoins.mockRejectedValue(new Error(errorMessage));

      // When
      await coinsController.remove(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCoinsHandler.removeCoins).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('get', () => {
    it('deve obter coins do usuário com sucesso', async () => {
      // Given
      const mockUser = { id: 'user-123', coins: 100 };
      mockCoinsHandler.getCoins.mockResolvedValue(mockUser);

      // When
      await coinsController.get(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCoinsHandler.getCoins).toHaveBeenCalledWith('user-123');
      expect(mockJson).toHaveBeenCalledWith(mockUser);
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando getCoins falha', async () => {
      // Given
      const errorMessage = 'Usuário não encontrado';
      mockCoinsHandler.getCoins.mockRejectedValue(new Error(errorMessage));

      // When
      await coinsController.get(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockCoinsHandler.getCoins).toHaveBeenCalledWith('user-123');
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });

    it('deve lidar com usuário sem ID no token', async () => {
      // Given
      mockReq.user = { id: '' };
      const errorMessage = 'ID do usuário é obrigatório';
      mockCoinsHandler.getCoins.mockRejectedValue(new Error(errorMessage));

      // When
      await coinsController.get(mockReq as Request, mockRes as Response, mockNext);

      // Then
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});