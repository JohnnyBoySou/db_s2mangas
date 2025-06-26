import { addCoins, removeCoins, getCoins } from '../index';
import { prismaMock } from '../../../test/mocks/prisma';

describe('Coins Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCoins', () => {
    it('deve adicionar 30 coins ao usuário com sucesso', async () => {
      // Given
      const userId = 'user-123';
      const mockUser = { id: userId, coins: 130 };
      prismaMock.user.update.mockResolvedValue(mockUser);

      // When
      const result = await addCoins(userId);

      // Then
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            increment: 30
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
      prismaMock.user.update.mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(addCoins(userId)).rejects.toThrow(errorMessage);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            increment: 30
          }
        },
        select: {
          id: true,
          coins: true
        }
      });
    });
  });

  describe('removeCoins', () => {
    it('deve remover 15 coins do usuário com sucesso', async () => {
      // Given
      const userId = 'user-123';
      const mockUserFind = { coins: 50 };
      const mockUserUpdate = { id: userId, coins: 35 };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUserFind as any);
      prismaMock.user.update.mockResolvedValue(mockUserUpdate);

      // When
      const result = await removeCoins(userId);

      // Then
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { coins: true }
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          coins: {
            decrement: 15
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
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(removeCoins(userId)).rejects.toThrow('Usuário não encontrado');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { coins: true }
      });
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando usuário tem saldo insuficiente', async () => {
      // Given
      const userId = 'user-123';
      const mockUserFind = { coins: 10 }; // Menos que 15
      prismaMock.user.findUnique.mockResolvedValue(mockUserFind as any);

      // When & Then
      await expect(removeCoins(userId)).rejects.toThrow('Saldo insuficiente de coins');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { coins: true }
      });
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deve permitir remoção quando usuário tem exatamente 15 coins', async () => {
      // Given
      const userId = 'user-123';
      const mockUserFind = { coins: 15 };
      const mockUserUpdate = { id: userId, coins: 0 };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUserFind as any);
      prismaMock.user.update.mockResolvedValue(mockUserUpdate);

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
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

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
      prismaMock.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getCoins(userId)).rejects.toThrow('Usuário não encontrado');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          coins: true
        }
      });
    });

    it('deve propagar erro do Prisma', async () => {
      // Given
      const userId = 'user-123';
      const errorMessage = 'Erro de conexão com o banco';
      prismaMock.user.findUnique.mockRejectedValue(new Error(errorMessage));

      // When & Then
      await expect(getCoins(userId)).rejects.toThrow(errorMessage);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          coins: true
        }
      });
    });
  });
});