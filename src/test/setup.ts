import { jest } from '@jest/globals';

// Configuração global para os testes
beforeAll(() => {
  // Configurações que devem ser executadas antes de todos os testes
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