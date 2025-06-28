import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { NotificationsRouter, AdminNotificationsRouter } from './index';
import * as notificationHandlers from '../../handlers/notifications';

// Mock dos handlers
jest.mock('@/handlers/notifications', () => ({
  listUserNotifications: jest.fn(),
  listNotifications: jest.fn(),
  createNotification: jest.fn(),
  getNotification: jest.fn(),
  deleteNotification: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
}));

// Mock dos middlewares de autenticação
jest.mock('@/middlewares/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user1', role: 'user' };
    next();
  },
  requireAdmin: (req: any, res: any, next: any) => {
    if (req.user?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Acesso negado' });
    }
  },
}));

const mockHandlers = notificationHandlers as jest.Mocked<typeof notificationHandlers>;

const app = express();
app.use(express.json());
app.use('/notifications', NotificationsRouter);
app.use('/admin/notifications', AdminNotificationsRouter);

// Mock para admin
const adminApp = express();
adminApp.use(express.json());
adminApp.use((req: any, res: any, next: any) => {
  req.user = { id: 'admin1', role: 'admin' };
  next();
});
adminApp.use('/admin/notifications', AdminNotificationsRouter);

describe('Notification Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Notification Routes', () => {
    describe('GET /notifications', () => {
      it('should list user notifications successfully', async () => {
        // Given
        const mockResponse = {
          data: [
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
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            next: null,
            prev: null,
          },
          unreadCount: 1,
        };

        mockHandlers.listUserNotifications.mockResolvedValue(mockResponse);

        // When
        const response = await request(app)
          .get('/notifications')
          .expect(200);

        // Then
        expect(response.body).toEqual(mockResponse);
        expect(mockHandlers.listUserNotifications).toHaveBeenCalledWith('user1', 1, 10);
      });

      it('should handle pagination parameters', async () => {
        // Given
        const mockResponse = {
          notifications: [],
          total: 0,
          unreadCount: 0,
          page: 2,
          totalPages: 0,
        };

        mockHandlers.listUserNotifications.mockResolvedValue(mockResponse);

        // When
        await request(app)
          .get('/notifications?page=2&take=5')
          .expect(200);

        // Then
        expect(mockHandlers.listUserNotifications).toHaveBeenCalledWith('user1', 2, 5);
      });
    });

    describe('GET /notifications/:id', () => {
      it('should get a specific notification', async () => {
        // Given
        const mockNotification = {
          id: '1',
          userId: 'user1',
          type: 'follow',
          title: 'Novo seguidor',
          message: 'João começou a te seguir',
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        mockHandlers.getNotification.mockResolvedValue(mockNotification);

        // When
        const response = await request(app)
          .get('/notifications/1')
          .expect(200);

        // Then
        expect(response.body).toEqual(mockNotification);
        expect(mockHandlers.getNotification).toHaveBeenCalledWith('1');
      });
    });

    describe('PATCH /notifications/:id/read', () => {
      it('should mark notification as read', async () => {
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
        expect(response.body).toEqual({ message: 'Notificação marcada como lida' });
        expect(mockHandlers.markAsRead).toHaveBeenCalledWith('1', 'user1');
      });
    });

    describe('PATCH /notifications/mark-all-read', () => {
      it('should mark all notifications as read', async () => {
        // Given
        const mockResult = { count: 3 };
        mockHandlers.markAllAsRead.mockResolvedValue(mockResult);

        // When
        const response = await request(app)
          .patch('/notifications/mark-all-read')
          .expect(200);

        // Then
        expect(response.body).toEqual({ message: 'Todas as notificações foram marcadas como lidas' });
        expect(mockHandlers.markAllAsRead).toHaveBeenCalledWith('user1');
      });
    });
  });

  describe('Admin Notification Routes', () => {
    describe('GET /admin/notifications', () => {
      it('should list all notifications for admin', async () => {
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
        const response = await request(adminApp)
          .get('/admin/notifications')
          .expect(200);

        // Then
        expect(response.body).toEqual(mockResponse);
        expect(mockHandlers.listNotifications).toHaveBeenCalledWith(1, 10);
      });

      it('should deny access to non-admin users', async () => {
        // When & Then
        await request(app)
          .get('/admin/notifications')
          .expect(403)
          .expect({ error: 'Acesso negado' });
      });
    });

    describe('POST /admin/notifications', () => {
      it('should create notification for admin', async () => {
        // Given
        const notificationData = {
          type: 'system',
          title: 'Manutenção programada',
          message: 'O sistema ficará indisponível das 2h às 4h',
        };

        const mockNotification = {
          id: '1',
          userId: 'admin-user-id',
          data: {},
          isRead: false,
          ...notificationData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockHandlers.createNotification.mockResolvedValue(mockNotification);

        // When
        const response = await request(adminApp)
          .post('/admin/notifications')
          .send(notificationData)
          .expect(201);

        // Then
        expect(response.body).toEqual(mockNotification);
        expect(mockHandlers.createNotification).toHaveBeenCalled();
      });
    });

    describe('DELETE /admin/notifications/:id', () => {
      it('should delete notification for admin', async () => {
        // Given
        mockHandlers.deleteNotification.mockResolvedValue(undefined);

        // When
        const response = await request(adminApp)
          .delete('/admin/notifications/1')
          .expect(200);

        // Then
        expect(response.body).toEqual({ message: 'Notificação deletada com sucesso' });
        expect(mockHandlers.deleteNotification).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      // Given
      mockHandlers.listUserNotifications.mockRejectedValue(new Error('Database error'));

      // When & Then
      await request(app)
        .get('/notifications')
        .expect(500);
    });

    it('should handle validation errors', async () => {
      // Given
      mockHandlers.markAsRead.mockRejectedValue({
        name: 'ZodError',
        issues: [{ message: 'Invalid ID format' }],
      });

      // When & Then
      await request(app)
        .patch('/notifications/invalid-id/read')
        .expect(500);
    });
  });
});