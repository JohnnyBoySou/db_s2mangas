import { 
  addCoins, 
  removeCoins, 
  getCoins, 
  transferCoins, 
  getUserCoinsHistory,
  COIN_AMOUNTS 
} from '../handlers/CoinsHandler';
import { prismaMock } from '../../../test/mocks/prisma';

// Mock do createPrismaRepository para retornar um mock que usa prismaMock
jest.mock('@/modules/crud/handlers/CrudHandler', () => ({
  createPrismaRepository: jest.fn(() => ({
    findById: jest.fn((id: string, options?: any) => {
      return prismaMock.user.findUnique({
        where: { id },
        ...options
      });
    }),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),
    batchDelete: jest.fn(),
    search: jest.fn()
  }))
}));

describe('Coins Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCoins', () => {
    it('deve adicionar 30 coins ao usuário com sucesso', async () => {
      // Given
      const userId = 'user-123';
      const mockUser = { id: userId, coins: 130 };
      (prismaMock.user.update as jest.Mock).mockResolvedValue(mockUser);

      // When
      const result = await addCoins(userId);

      // Then
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            increment: COIN_AMOUNTS.ADD
          }
        },
        select: {
          id: true,
          coins: true
        }
      });
      expect(result).toEqual(mockUser);
    });

    it('deve adicionar quantidade customizada de coins', async () => {
      // Given
      const userId = 'user-123';
      const customAmount = 50;
      const mockUser = { id: userId, coins: 150 };
      (prismaMock.user.update as jest.Mock).mockResolvedValue(mockUser);

      // When
      const result = await addCoins(userId, customAmount);

      // Then
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            increment: customAmount
          }
        },
        select: {
          id: true,
          coins: true
        }
      });
      expect(result).toEqual(mockUser);
    });

    it('deve propagar erro do Prisma', async () => {
      // Given
      const userId = 'user-123';
      const errorMessage = 'Erro de conexão com o banco';
      (prismaMock.user.update as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(addCoins(userId)).rejects.toThrow('Erro ao adicionar coins:');
    });
  });

  describe('removeCoins', () => {
    it('deve remover 15 coins do usuário com sucesso', async () => {
      // Given
      const userId = 'user-123';
      const mockUserFind = { id: userId, coins: 50 };
      const mockUserUpdate = { id: userId, coins: 35 };
      
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUserFind);
      (prismaMock.user.update as jest.Mock).mockResolvedValue(mockUserUpdate);

      // When
      const result = await removeCoins(userId);

      // Then
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          coins: true
        }
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            decrement: COIN_AMOUNTS.REMOVE
          }
        },
        select: {
          id: true,
          coins: true
        }
      });
      expect(result).toEqual(mockUserUpdate);
    });

    it('deve remover quantidade customizada de coins', async () => {
      // Given
      const userId = 'user-123';
      const customAmount = 25;
      const mockUserFind = { id: userId, coins: 50 };
      const mockUserUpdate = { id: userId, coins: 25 };
      
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUserFind);
      (prismaMock.user.update as jest.Mock).mockResolvedValue(mockUserUpdate);

      // When
      const result = await removeCoins(userId, customAmount);

      // Then
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            decrement: customAmount
          }
        },
        select: {
          id: true,
          coins: true
        }
      });
      expect(result).toEqual(mockUserUpdate);
    });

    it('deve lançar erro quando usuário não é encontrado', async () => {
      // Given
      const userId = 'user-123';
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(removeCoins(userId)).rejects.toThrow('Usuário não encontrado');
      expect(prismaMock.user.findUnique).toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando usuário tem saldo insuficiente', async () => {
      // Given
      const userId = 'user-123';
      const mockUserFind = { id: userId, coins: 10 }; // Menos que 15
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUserFind);

      // When & Then
      await expect(removeCoins(userId)).rejects.toThrow('Saldo insuficiente de coins');
      expect(prismaMock.user.findUnique).toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deve permitir remoção quando usuário tem exatamente 15 coins', async () => {
      // Given
      const userId = 'user-123';
      const mockUserFind = { id: userId, coins: 15 };
      const mockUserUpdate = { id: userId, coins: 0 };
      
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUserFind);
      (prismaMock.user.update as jest.Mock).mockResolvedValue(mockUserUpdate);

      // When
      const result = await removeCoins(userId);

      // Then
      expect(result).toEqual(mockUserUpdate);
      expect(prismaMock.user.update).toHaveBeenCalled();
    });
  });

  describe('getCoins', () => {
    it('deve retornar informações de coins do usuário com sucesso', async () => {
      // Given
      const userId = 'user-123';
      const mockUser = { id: userId, coins: 100 };
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // When
      const result = await getCoins(userId);

      // Then
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
      // Given
      const userId = 'user-123';
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(getCoins(userId)).rejects.toThrow('Usuário não encontrado');
      expect(prismaMock.user.findUnique).toHaveBeenCalled();
    });

    it('deve propagar erro do repositório', async () => {
      // Given
      const userId = 'user-123';
      const errorMessage = 'Erro de conexão com o banco';
      (prismaMock.user.findUnique as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(getCoins(userId)).rejects.toThrow(errorMessage);
    });
  });

  describe('transferCoins', () => {
    it('deve transferir coins entre usuários com sucesso', async () => {
      // Given
      const fromUserId = 'user-123';
      const toUserId = 'user-456';
      const amount = 20;
      const mockFromUser = { id: fromUserId, coins: 50 };
      const mockToUser = { id: toUserId, coins: 30 };
      const mockUpdatedFromUser = { id: fromUserId, coins: 30 };
      const mockUpdatedToUser = { id: toUserId, coins: 50 };
      
      (prismaMock.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockFromUser)
        .mockResolvedValueOnce(mockToUser);
      
      (prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          user: {
            update: jest.fn()
              .mockResolvedValueOnce(mockUpdatedFromUser)
              .mockResolvedValueOnce(mockUpdatedToUser)
          }
        });
      });

      // When
      const result = await transferCoins(fromUserId, toUserId, amount);

      // Then
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        from: mockUpdatedFromUser,
        to: mockUpdatedToUser
      });
    });

    it('deve lançar erro quando usuário remetente não é encontrado', async () => {
      // Given
      const fromUserId = 'user-123';
      const toUserId = 'user-456';
      const amount = 20;
      
      (prismaMock.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: toUserId, coins: 30 });

      // When & Then
      await expect(transferCoins(fromUserId, toUserId, amount))
        .rejects.toThrow('Usuário remetente não encontrado');
    });

    it('deve lançar erro quando usuário destinatário não é encontrado', async () => {
      // Given
      const fromUserId = 'user-123';
      const toUserId = 'user-456';
      const amount = 20;
      
      (prismaMock.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: fromUserId, coins: 50 })
        .mockResolvedValueOnce(null);

      // When & Then
      await expect(transferCoins(fromUserId, toUserId, amount))
        .rejects.toThrow('Usuário destinatário não encontrado');
    });

    it('deve lançar erro quando saldo é insuficiente para transferência', async () => {
      // Given
      const fromUserId = 'user-123';
      const toUserId = 'user-456';
      const amount = 60; // Mais que o saldo disponível
      
      (prismaMock.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: fromUserId, coins: 50 })
        .mockResolvedValueOnce({ id: toUserId, coins: 30 });

      // When & Then
      await expect(transferCoins(fromUserId, toUserId, amount))
        .rejects.toThrow('Saldo insuficiente para transferência');
    });
  });

  describe('getUserCoinsHistory', () => {
    it('deve retornar histórico de coins do usuário', async () => {
      // Given
      const userId = 'user-123';
      const mockUser = { id: userId, coins: 100 };
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // When
      const result = await getUserCoinsHistory(userId);

      // Then
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(result).toEqual({
        userId,
        currentCoins: mockUser.coins,
        transactions: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      });
    });

    it('deve lançar erro quando usuário não é encontrado', async () => {
      // Given
      const userId = 'user-123';
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When & Then
      await expect(getUserCoinsHistory(userId))
        .rejects.toThrow('Usuário não encontrado');
    });

    it('deve aceitar parâmetros de paginação customizados', async () => {
      // Given
      const userId = 'user-123';
      const page = 2;
      const limit = 5;
      const mockUser = { id: userId, coins: 100 };
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // When
      const result = await getUserCoinsHistory(userId, page, limit);

      // Then
      expect(result.pagination).toEqual({
        page,
        limit,
        total: 0,
        totalPages: 0
      });
    });
  });

  describe('COIN_AMOUNTS', () => {
    it('deve ter valores corretos para as constantes', () => {
      expect(COIN_AMOUNTS.ADD).toBe(30);
      expect(COIN_AMOUNTS.REMOVE).toBe(15);
    });
  });
});