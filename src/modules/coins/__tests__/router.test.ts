import request from 'supertest';
import express from 'express';

// Mock do middleware de autenticação - deve ser declarado antes dos imports que o utilizam
const mockRequireAuth = jest.fn((req, res, next) => {
  req.user = { id: 'user-123' };
  next();
});

// Mock do middleware de autenticação
jest.mock('../../../middlewares/auth', () => ({
  requireAuth: mockRequireAuth
}));

// Importar após os mocks
import { CoinsRouter } from '../routes/CoinsRouter';
import * as coinsController from '../controllers/CoinsController';

// Mock do controller
jest.mock('../controllers/CoinsController');
const mockCoinsController = coinsController as jest.Mocked<typeof coinsController>;

describe('Coins Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/coins', CoinsRouter);
    jest.clearAllMocks();
  });

  describe('GET /coins', () => {
    it('deve retornar coins do usuário', async () => {
      // Given
      const mockUser = { id: 'user-123', coins: 100 };
      mockCoinsController.get.mockImplementation((req, res) => {
        res.json(mockUser);
      });

      // When
      const response = await request(app)
        .get('/coins')
        .expect(200);

      // Then
      expect(response.body).toEqual(mockUser);
      expect(mockCoinsController.get).toHaveBeenCalled();
    });

    it('deve retornar erro quando controller falha', async () => {
      // Given
      const errorMessage = 'Usuário não encontrado';
      mockCoinsController.get.mockImplementation((req, res) => {
        res.status(400).json({ error: errorMessage });
      });

      // When
      const response = await request(app)
        .get('/coins')
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: errorMessage });
    });
  });

  describe('POST /coins/add', () => {
    it('deve adicionar coins ao usuário', async () => {
      // Given
      const mockUser = { id: 'user-123', coins: 130 };
      mockCoinsController.add.mockImplementation((req, res) => {
        res.json(mockUser);
      });

      // When
      const response = await request(app)
        .post('/coins/add')
        .expect(200);

      // Then
      expect(response.body).toEqual(mockUser);
      expect(mockCoinsController.add).toHaveBeenCalled();
    });

    it('deve retornar erro quando controller falha', async () => {
      // Given
      const errorMessage = 'Erro ao adicionar coins';
      mockCoinsController.add.mockImplementation((req, res) => {
        res.status(400).json({ error: errorMessage });
      });

      // When
      const response = await request(app)
        .post('/coins/add')
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: errorMessage });
    });
  });

  describe('POST /coins/remove', () => {
    it('deve remover coins do usuário', async () => {
      // Given
      const mockUser = { id: 'user-123', coins: 85 };
      mockCoinsController.remove.mockImplementation((req, res) => {
        res.json(mockUser);
      });

      // When
      const response = await request(app)
        .post('/coins/remove')
        .expect(200);

      // Then
      expect(response.body).toEqual(mockUser);
      expect(mockCoinsController.remove).toHaveBeenCalled();
    });

    it('deve retornar erro quando saldo é insuficiente', async () => {
      // Given
      const errorMessage = 'Saldo insuficiente de coins';
      mockCoinsController.remove.mockImplementation((req, res) => {
        res.status(400).json({ error: errorMessage });
      });

      // When
      const response = await request(app)
        .post('/coins/remove')
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: errorMessage });
    });
  });

});