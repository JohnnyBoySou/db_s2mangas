import request from 'supertest';
import express from 'express';
import { handleZodError } from '../../../utils/zodError';

// Mock das dependências
jest.mock('../handlers/UsersHandler', () => ({
    listUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
}));

jest.mock('@/utils/zodError');

const mockedUserHandlers = require('../handlers/UsersHandler');
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;

import * as userController from '../controllers/UsersControllers';

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Rotas para teste
app.get('/users', userController.listUsers);
app.get('/users/:id', userController.getUserById);
app.post('/users', userController.createUser);
app.put('/users/:id', userController.updateUser);
app.delete('/users/:id', userController.deleteUser);

describe('Controlador de Usuários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users - listUsers', () => {
    const mockUsersResponse = {
      users: [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@example.com',
          username: 'joao123',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          avatar: null,
          cover: null
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@example.com',
          username: 'maria456',
          emailVerified: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          avatar: null,
          cover: null
        }
      ],
      total: 2,
      totalPages: 1,
      currentPage: 1
    };

    it('deve listar usuários com sucesso', async () => {
      // Given
      mockedUserHandlers.listUsers.mockResolvedValue(mockUsersResponse as any);

      // When
      const response = await request(app)
        .get('/users');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsersResponse);
      expect(mockedUserHandlers.listUsers).toHaveBeenCalledWith(1, 10);
    });

    it('deve listar usuários com paginação customizada', async () => {
      // Given
      mockedUserHandlers.listUsers.mockResolvedValue(mockUsersResponse as any);

      // When
      const response = await request(app)
        .get('/users')
        .query({ page: '2', limit: '5' });

      // Then
      expect(response.status).toBe(200);
      expect(mockedUserHandlers.listUsers).toHaveBeenCalledWith(2, 5);
    });

    it('deve retornar erro 500 quando handler falha', async () => {
      // Given
      const error = new Error('Database error');
      mockedUserHandlers.listUsers.mockRejectedValue(error);

      // When
      const response = await request(app)
        .get('/users');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'Database error'
      });
    });
  });

  describe('GET /users/:id - getUserById', () => {
    const mockUser = {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      username: 'joao123',
      emailVerified: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      avatar: null,
      cover: null
    };

    it('deve buscar usuário por ID com sucesso', async () => {
      // Given
      mockedUserHandlers.getUserById.mockResolvedValue(mockUser as any);

      // When
      const response = await request(app)
        .get('/users/1');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(mockedUserHandlers.getUserById).toHaveBeenCalledWith('1');
    });

    it('deve retornar erro 500 quando usuário não é encontrado', async () => {
      // Given
      const error = new Error('User not found');
      mockedUserHandlers.getUserById.mockRejectedValue(error);

      // When
      const response = await request(app)
        .get('/users/999');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'User not found'
      });
    });
  });

  describe('POST /users - createUser', () => {
    const mockCreatedUser = {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      username: 'joao123',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    it('deve criar usuário com sucesso', async () => {
      // Given
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        username: 'joao123'
      };
      mockedUserHandlers.createUser.mockResolvedValue(mockCreatedUser as any);

      // When
      const response = await request(app)
        .post('/users')
        .send(userData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedUser);
      expect(mockedUserHandlers.createUser).toHaveBeenCalledWith(userData);
    });

    it('deve retornar erro 400 para dados inválidos - nome muito curto', async () => {
      // Given
      const invalidData = {
        name: 'Jo', // nome muito curto
        email: 'joao@example.com',
        password: '123456'
      };
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Nome deve ter no mínimo 3 caracteres' });
      });

      // When
      const response = await request(app)
        .post('/users')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });

    it('deve retornar erro 400 para email inválido', async () => {
      // Given
      const invalidData = {
        name: 'João Silva',
        email: 'email-invalido', // email inválido
        password: '123456'
      };
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Email inválido' });
      });

      // When
      const response = await request(app)
        .post('/users')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });

    it('deve retornar erro 400 para senha muito curta', async () => {
      // Given
      const invalidData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123' // senha muito curta
      };
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      });

      // When
      const response = await request(app)
        .post('/users')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('PUT /users/:id - updateUser', () => {
    const mockUpdatedUser = {
      id: '1',
      name: 'João Silva Atualizado',
      email: 'joao.novo@example.com',
      username: 'joao123',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    it('deve atualizar usuário com sucesso', async () => {
      // Given
      const updateData = {
        name: 'João Silva Atualizado',
        email: 'joao.novo@example.com'
      };
      mockedUserHandlers.updateUser.mockResolvedValue(mockUpdatedUser as any);

      // When
      const response = await request(app)
        .put('/users/1')
        .send(updateData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedUser);
      expect(mockedUserHandlers.updateUser).toHaveBeenCalledWith('1', updateData);
    });

    it('deve atualizar usuário com data de nascimento', async () => {
      // Given
      const updateData = {
        name: 'João Silva',
        birthdate: new Date('2024-01-01T00:00:00.000Z')
      };
      const expectedData = {
        name: 'João Silva',
        birthdate: new Date('2024-01-01T00:00:00.000Z')
      };
      mockedUserHandlers.updateUser.mockResolvedValue(mockUpdatedUser as any);

      // When
      const response = await request(app)
        .put('/users/1')
        .send(updateData);

      // Then
      expect(response.status).toBe(200);
      expect(mockedUserHandlers.updateUser).toHaveBeenCalledWith('1', expectedData);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      // Given
      const invalidData = {
        email: 'email-invalido'
      };
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Email inválido' });
      });

      // When
      const response = await request(app)
        .put('/users/1')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });
  });

  describe('DELETE /users/:id - deleteUser', () => {
    const mockDeleteResult = {
      message: 'Usuário deletado com sucesso'
    };

    it('deve deletar usuário com sucesso', async () => {
      // Given
      mockedUserHandlers.deleteUser.mockResolvedValue(mockDeleteResult as any);

      // When
      const response = await request(app)
        .delete('/users/1');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDeleteResult);
      expect(mockedUserHandlers.deleteUser).toHaveBeenCalledWith('1');
    });

    it('deve retornar erro 500 quando usuário não é encontrado', async () => {
      // Given
      const error = new Error('User not found');
      mockedUserHandlers.deleteUser.mockRejectedValue(error);

      // When
      const response = await request(app)
        .delete('/users/999');

      // Then
      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'User not found'
      });
    });
  });
});