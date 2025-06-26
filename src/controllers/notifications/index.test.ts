import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { listNotifications, markAsRead, markAllAsRead, listAllNotifications } from './index';
import * as notificationHandlers from '@/handlers/notifications';

// Mock dos handlers
jest.mock('@/handlers/notifications', () => ({
  listUserNotifications: jest.fn(),
  listNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
}));

const mockHandlers = notificationHandlers as jest.Mocked<typeof notificationHandlers>;

// Mock do middleware de autenticação
const mockRequireAuth = (req: any, res: any, next: any) => {
  req.user = { id: 'user1' };
  next();
};

const app = express();
app.use(express.json());
app.get('/notifications', mockRequireAuth, listNotifications);
app.get('/admin/notifications', mockRequireAuth, listAllNotifications);
app.patch('/notifications/:id/read', mockRequireAuth, markAsRead);
app.patch('/notifications/mark-all-read', mockRequireAuth, markAllAsRead);

describe('Notification Controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notifications', () => {
    it('should list user notifications successfully', async () => {
      // Given
      const mockResponse = {
        notifications: [
          {
            id: '1',
            userId: 'user1',
            type: 'follow',
            title: 'Novo seguidor',
            message: 'João começou a te seguir',
            data: { followerId: 'user2' },
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        unreadCount: 1,
        page: 1,
        totalPages: 1,
      };

      mockHandlers.listUserNotifications.mockResolvedValue(mockResponse);

      // When
      const response = await request(app)
        .get('/notifications')
        .expect(200);

      // Then
      expect(mockHandlers.listUserNotifications).toHaveBeenCalledWith('user1', 1, 10);
      expect(response.body).toEqual(mockResponse);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Given
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.get('/notifications', listNotifications);

      // When & Then
      await request(appWithoutAuth)
        .get('/notifications')
        .expect(401)
        .expect({ error: 'Usuário não autenticado' });
    });
  });

  describe('GET /admin/notifications', () => {
    it('should list all notifications successfully', async () => {
      // Given
      const mockResponse = {
        data: [
          {
            id: '1',
            userId: 'user-id',
            type: 'follow',
            title: 'Novo seguidor',
            message: 'João começou a te seguir',
            data: {},
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
           total: 1,
           page: 1,
           limit: 10,
           totalPages: 1,
           next: null,
           prev: null,
         },
      };

      mockHandlers.listNotifications.mockResolvedValue(mockResponse);

      // When
      const response = await request(app)
        .get('/admin/notifications')
        .expect(200);

      // Then
      expect(mockHandlers.listNotifications).toHaveBeenCalledWith(1, 10);
      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read successfully', async () => {
      // Given
      const mockNotification = {
        id: '1',
        userId: 'user1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'FOLLOW',
        data: {},
        isRead: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockHandlers.markAsRead.mockResolvedValue(mockNotification);

      // When
      const response = await request(app)
        .patch('/notifications/1/read')
        .expect(200);

      // Then
      expect(mockHandlers.markAsRead).toHaveBeenCalledWith('1', 'user1');
      expect(response.body).toEqual({ message: 'Notificação marcada como lida' });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Given
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.patch('/notifications/:id/read', markAsRead);

      // When & Then
      await request(appWithoutAuth)
        .patch('/notifications/1/read')
        .expect(401)
        .expect({ error: 'Usuário não autenticado' });
    });
  });

  describe('PATCH /notifications/mark-all-read', () => {
    it('should mark all notifications as read successfully', async () => {
      // Given
      const mockResult = { count: 3 };
      mockHandlers.markAllAsRead.mockResolvedValue(mockResult);

      // When
      const response = await request(app)
        .patch('/notifications/mark-all-read')
        .expect(200);

      // Then
      expect(mockHandlers.markAllAsRead).toHaveBeenCalledWith('user1');
      expect(response.body).toEqual({ message: 'Todas as notificações foram marcadas como lidas' });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Given
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.patch('/notifications/mark-all-read', markAllAsRead);

      // When & Then
      await request(appWithoutAuth)
        .patch('/notifications/mark-all-read')
        .expect(401)
        .expect({ error: 'Usuário não autenticado' });
    });
  });

  describe('Error handling', () => {
    it('should handle errors in listNotifications', async () => {
      // Given
      mockHandlers.listUserNotifications.mockRejectedValue(new Error('Database error'));

      // When & Then
      await request(app)
        .get('/notifications')
        .expect(500);
    });

    it('should handle errors in markAsRead', async () => {
      // Given
      mockHandlers.markAsRead.mockRejectedValue(new Error('Notification not found'));

      // When & Then
      await request(app)
        .patch('/notifications/1/read')
        .expect(500);
    });
  });
});