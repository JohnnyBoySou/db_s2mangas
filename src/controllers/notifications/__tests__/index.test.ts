import request from 'supertest';
import express from 'express';
import * as notificationController from '../index';
import * as notificationHandlers from '../../../handlers/notifications';
import { handleZodError } from '@/utils/zodError';
import { getPaginationParams } from '@/utils/pagination';

// Mock das dependências
jest.mock('@/handlers/notifications');
jest.mock('@/utils/zodError');
jest.mock('@/utils/pagination');

const mockedNotificationHandlers = notificationHandlers as jest.Mocked<typeof notificationHandlers>;
const mockedHandleZodError = handleZodError as jest.MockedFunction<typeof handleZodError>;
const mockedGetPaginationParams = getPaginationParams as jest.MockedFunction<typeof getPaginationParams>;

// Setup do Express app para testes
const app = express();
app.use(express.json());

// Rotas para teste
app.get('/notifications', notificationController.listNotifications);
app.post('/notifications', notificationController.createNotification);
app.delete('/notifications/:notificationId', notificationController.deleteNotification);
app.get('/notifications/:notificationId', notificationController.getNotification);

describe('Controlador de Notificações', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notifications - listNotifications', () => {
    const mockPaginationParams = { take: 20, page: 1, skip: 0 };
    const mockNotificationsResponse = {
      notifications: [
        {
          id: '1',
          title: 'Notificação 1',
          message: 'Mensagem da notificação 1',
          type: 'info',
          createdAt: new Date()
        }
      ],
      total: 1,
      page: 1,
      totalPages: 1
    };

    it('deve listar notificações com sucesso', async () => {
      // Given
      mockedGetPaginationParams.mockReturnValue(mockPaginationParams);
      mockedNotificationHandlers.listNotifications.mockResolvedValue(mockNotificationsResponse as any);

      // When
      const response = await request(app)
        .get('/notifications');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        total: mockNotificationsResponse.total,
        page: mockNotificationsResponse.page,
        totalPages: mockNotificationsResponse.totalPages
      });
      expect(response.body.notifications).toHaveLength(1);
      expect(response.body.notifications[0]).toMatchObject({
        id: '1',
        title: 'Notificação 1',
        message: 'Mensagem da notificação 1',
        type: 'info'
      });
      expect(mockedGetPaginationParams).toHaveBeenCalledWith(expect.any(Object));
      expect(mockedNotificationHandlers.listNotifications).toHaveBeenCalledWith(1, 20);
    });

    it('deve lidar com erro ao listar notificações', async () => {
      // Given
      const mockError = new Error('Erro interno');
      mockedGetPaginationParams.mockReturnValue(mockPaginationParams);
      mockedNotificationHandlers.listNotifications.mockRejectedValue(mockError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Erro interno' });
      });

      // When
      const response = await request(app)
        .get('/notifications');

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });
  });

  describe('POST /notifications - createNotification', () => {
    const mockNotificationData = {
      title: 'Nova Notificação',
      message: 'Mensagem da nova notificação',
      type: 'info'
    };

    const mockCreatedNotification = {
      id: '1',
      ...mockNotificationData,
      createdAt: new Date()
    };

    it('deve criar notificação com sucesso', async () => {
      // Given
      mockedNotificationHandlers.createNotification.mockResolvedValue(mockCreatedNotification as any);

      // When
      const response = await request(app)
        .post('/notifications')
        .send(mockNotificationData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: mockCreatedNotification.id,
        title: mockCreatedNotification.title,
        message: mockCreatedNotification.message,
        type: mockCreatedNotification.type
      });
      expect(mockedNotificationHandlers.createNotification).toHaveBeenCalledWith(mockNotificationData);
    });

    it('deve retornar erro 400 para dados inválidos - tipo inválido', async () => {
      // Given
      const invalidData = {
        title: 'Título válido',
        message: 'Mensagem válida',
        type: 123 // tipo inválido
      };
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Dados inválidos' });
      });

      // When
      const response = await request(app)
        .post('/notifications')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });

    it('deve retornar erro 400 para dados inválidos - mensagem muito longa', async () => {
      // Given
      const invalidData = {
        title: 'Título válido',
        message: 'a'.repeat(501), // Mensagem muito longa
        type: 'info'
      };

      // When
      const response = await request(app)
        .post('/notifications')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });

    it('deve retornar erro 400 para dados inválidos - campos obrigatórios ausentes', async () => {
      // Given
      const invalidData = {
        title: '',
        message: '',
        type: ''
      };
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      });

      // When
      const response = await request(app)
        .post('/notifications')
        .send(invalidData);

      // Then
      expect(response.status).toBe(400);
      expect(mockedHandleZodError).toHaveBeenCalled();
    });

    it('deve lidar com erro do handler', async () => {
      // Given
      const mockError = new Error('Erro interno');
      mockedNotificationHandlers.createNotification.mockRejectedValue(mockError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Erro interno' });
      });

      // When
      const response = await request(app)
        .post('/notifications')
        .send(mockNotificationData);

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });
  });

  describe('DELETE /notifications/:notificationId - deleteNotification', () => {
    const notificationId = '123';

    it('deve deletar notificação com sucesso', async () => {
      // Given
      mockedNotificationHandlers.deleteNotification.mockResolvedValue(undefined);

      // When
      const response = await request(app)
        .delete(`/notifications/${notificationId}`);

      // Then
      expect(response.status).toBe(204);
      expect(mockedNotificationHandlers.deleteNotification).toHaveBeenCalledWith(notificationId);
    });

    it('deve lidar com erro ao deletar notificação', async () => {
      // Given
      const mockError = new Error('Notificação não encontrada');
      mockedNotificationHandlers.deleteNotification.mockRejectedValue(mockError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      });

      // When
      const response = await request(app)
        .delete(`/notifications/${notificationId}`);

      // Then
      expect(response.status).toBe(404);
      expect(mockedHandleZodError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });
  });

  describe('GET /notifications/:notificationId - getNotification', () => {
    const notificationId = '123';
    const mockNotification = {
      id: notificationId,
      title: 'Notificação Específica',
      message: 'Mensagem da notificação específica',
      type: 'info',
      createdAt: new Date()
    };

    it('deve buscar notificação específica com sucesso', async () => {
      // Given
      mockedNotificationHandlers.getNotification.mockResolvedValue(mockNotification as any);

      // When
      const response = await request(app)
        .get(`/notifications/${notificationId}`);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: mockNotification.id,
        title: mockNotification.title,
        message: mockNotification.message,
        type: mockNotification.type
      });
      expect(mockedNotificationHandlers.getNotification).toHaveBeenCalledWith(notificationId);
    });

    it('deve retornar 404 quando notificação não for encontrada', async () => {
      // Given
      const mockError = new Error('Notificação não encontrada');
      mockedNotificationHandlers.getNotification.mockRejectedValue(mockError);

      // When
      const response = await request(app)
        .get(`/notifications/${notificationId}`);

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Notificação não encontrada' });
    });

    it('deve lidar com outros erros', async () => {
      // Given
      const mockError = new Error('Erro interno');
      mockedNotificationHandlers.getNotification.mockRejectedValue(mockError);
      mockedHandleZodError.mockImplementation((err, res) => {
        return res.status(500).json({ error: 'Erro interno' });
      });

      // When
      const response = await request(app)
        .get(`/notifications/${notificationId}`);

      // Then
      expect(response.status).toBe(500);
      expect(mockedHandleZodError).toHaveBeenCalledWith(mockError, expect.any(Object));
    });
  });
});