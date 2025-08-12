import { jest } from '@jest/globals';
import { prismaMock } from './mocks/prisma';

// Configuração global para os testes
beforeAll(() => {
  // Configurações que devem ser executadas antes de todos os testes
});

beforeEach(() => {
  // Limpa todos os mocks antes de cada teste
  jest.clearAllMocks();
});

afterAll(() => {
  // Limpeza após todos os testes
  jest.clearAllMocks();
});

// Extensão do tipo Request para incluir o user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

// Exporta o mock para uso nos testes
export { prismaMock };