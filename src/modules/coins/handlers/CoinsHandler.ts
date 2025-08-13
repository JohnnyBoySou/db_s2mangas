import { createPrismaRepository, } from "@/modules/crud/handlers/CrudHandler";
import prisma from "@/prisma/client";

// Interface para dados do usuário relacionados a coins
interface UserCoins {
  id: string;
  coins: number;
}

// Criar repositório base para usuários
const userRepository = createPrismaRepository<UserCoins, any, any>({
  model: prisma.user,
  defaultInclude: undefined
});

// Constantes para valores fixos
const COIN_AMOUNTS = {
  ADD: 30,
  REMOVE: 15
} as const;

// Função para adicionar coins
export const addCoins = async (userId: string, customAmount?: number): Promise<UserCoins> => {
  const amount = customAmount || COIN_AMOUNTS.ADD;

  try {
    const user = await prisma.user.update({
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

    return user;
  } catch (error) {
    throw new Error(`Erro ao adicionar coins: ${error}`);
  }
};

// Função para remover coins
export const removeCoins = async (userId: string, customAmount?: number): Promise<UserCoins> => {
  const amount = customAmount || COIN_AMOUNTS.REMOVE;

  try {
    // Verificar se o usuário existe e tem coins suficientes
    const user = await userRepository.findById(userId, {
      select: {
        id: true,
        coins: true
      }
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.coins < amount) {
      throw new Error("Saldo insuficiente de coins");
    }

    // Remover coins
    const updatedUser = await prisma.user.update({
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

    return updatedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Erro ao remover coins: ${error}`);
  }
};

// Função para obter coins do usuário
export const getCoins = async (userId: string): Promise<UserCoins> => {
  try {
    const user = await userRepository.findById(userId, {
      select: {
        id: true,
        coins: true
      }
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Erro ao obter coins: ${error}`);
  }
};

// Função para transferir coins entre usuários
export const transferCoins = async (
  fromUserId: string, 
  toUserId: string, 
  amount: number
): Promise<{ from: UserCoins; to: UserCoins }> => {
  try {
    // Verificar se ambos os usuários existem
    const [fromUser, toUser] = await Promise.all([
      userRepository.findById(fromUserId),
      userRepository.findById(toUserId)
    ]);

    if (!fromUser) {
      throw new Error("Usuário remetente não encontrado");
    }

    if (!toUser) {
      throw new Error("Usuário destinatário não encontrado");
    }

    if (fromUser.coins < amount) {
      throw new Error("Saldo insuficiente para transferência");
    }

    // Realizar transferência usando transação
    const result = await prisma.$transaction(async (tx) => {
      const updatedFromUser = await tx.user.update({
        where: { id: fromUserId },
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

      const updatedToUser = await tx.user.update({
        where: { id: toUserId },
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

      return {
        from: updatedFromUser,
        to: updatedToUser
      };
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Erro ao transferir coins: ${error}`);
  }
};

// Função para obter histórico de transações (se necessário)
export const getUserCoinsHistory = async (userId: string, page = 1, limit = 10) => {
  try {
    // Verificar se o usuário existe
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Aqui você pode implementar a lógica para buscar histórico de transações
    // se houver uma tabela de transações no banco de dados
    
    return {
      userId,
      currentCoins: user.coins,
      transactions: [], // Implementar quando houver tabela de transações
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Erro ao obter histórico de coins: ${error}`);
  }
};

// Exportar o repositório para uso em outros módulos se necessário
export { userRepository };

// Exportar constantes
export { COIN_AMOUNTS };