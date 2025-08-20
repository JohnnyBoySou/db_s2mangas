import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dos middlewares de autenticação (definidos antes do jest.mock)
const mockRequireAuth = jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user123', email: 'test@example.com' };
    next();
});

const mockRequireAdmin = jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'admin123', email: 'admin@example.com', role: 'admin' };
    next();
});

// Mock dos controllers (definidos antes do jest.mock)
const mockControllers = {
    listAllNotifications: jest.fn(),
    createNotification: jest.fn(),
    deleteNotification: jest.fn(),
    getNotification: jest.fn(),
    updateNotification: jest.fn(),
    patchNotification: jest.fn(),
};

jest.mock('@/middlewares/auth', () => ({
    requireAuth: mockRequireAuth,
    requireAdmin: mockRequireAdmin,
}));

jest.mock('../controllers/NotificationsController', () => ({
    listAllNotifications: mockControllers.listAllNotifications,
    createNotification: mockControllers.createNotification,
    deleteNotification: mockControllers.deleteNotification,
    getNotification: mockControllers.getNotification,
    updateNotification: mockControllers.updateNotification,
    patchNotification: mockControllers.patchNotification,
}));

import { NotificationsRouter, AdminNotificationsRouter } from '../routes/NotificationsRouter';

describe('NotificationsRouter', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/notifications', NotificationsRouter);
        
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup default mock responses
        mockControllers.listAllNotifications.mockImplementation((req: any, res: any) => {
            res.json({ notifications: [], total: 0 });
        });
        
        mockControllers.getNotification.mockImplementation((req: any, res: any) => {
            res.json({ id: req.params.notificationId, title: 'Test Notification' });
        });
    });

    describe('GET /notifications', () => {
        it('should call requireAuth middleware and listAllNotifications controller', async () => {
            // When
            const response = await request(app)
                .get('/notifications')
                .expect(200);

            // Then
            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockControllers.listAllNotifications).toHaveBeenCalled();
            expect(response.body).toEqual({ notifications: [], total: 0 });
        });
    });

    describe('GET /notifications/:notificationId', () => {
        it('should call requireAuth middleware and getNotification controller', async () => {
            // Given
            const notificationId = '123';

            // When
            const response = await request(app)
                .get(`/notifications/${notificationId}`)
                .expect(200);

            // Then
            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockControllers.getNotification).toHaveBeenCalled();
            expect(response.body).toEqual({ id: notificationId, title: 'Test Notification' });
        });
    });
});

describe('AdminNotificationsRouter', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/admin/notifications', AdminNotificationsRouter);
        
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup default mock responses
        mockControllers.listAllNotifications.mockImplementation((req: any, res: any) => {
            res.json({ notifications: [], total: 0 });
        });
        
        mockControllers.createNotification.mockImplementation((req: any, res: any) => {
            res.status(201).json({ id: '123', ...req.body });
        });
        
        mockControllers.updateNotification.mockImplementation((req: any, res: any) => {
            res.json({ id: req.params.notificationId, ...req.body });
        });
        
        mockControllers.patchNotification.mockImplementation((req: any, res: any) => {
            res.json({ id: req.params.notificationId, ...req.body });
        });
        
        mockControllers.deleteNotification.mockImplementation((req: any, res: any) => {
            res.status(204).send();
        });
    });

    describe('GET /admin/notifications', () => {
        it('should call requireAuth, requireAdmin middlewares and listAllNotifications controller', async () => {
            // When
            const response = await request(app)
                .get('/admin/notifications')
                .expect(200);

            // Then
            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockRequireAdmin).toHaveBeenCalled();
            expect(mockControllers.listAllNotifications).toHaveBeenCalled();
            expect(response.body).toEqual({ notifications: [], total: 0 });
        });
    });

    describe('POST /admin/notifications', () => {
        it('should call requireAuth, requireAdmin middlewares and createNotification controller', async () => {
            // Given
            const notificationData = {
                title: 'Test Notification',
                message: 'Test message',
                type: 'INFO'
            };

            // When
            const response = await request(app)
                .post('/admin/notifications')
                .send(notificationData)
                .expect(201);

            // Then
            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockRequireAdmin).toHaveBeenCalled();
            expect(mockControllers.createNotification).toHaveBeenCalled();
            expect(response.body).toEqual({ id: '123', ...notificationData });
        });
    });

    describe('PUT /admin/notifications/:notificationId', () => {
        it('should call requireAuth, requireAdmin middlewares and updateNotification controller', async () => {
            // Given
            const notificationId = '123';
            const updateData = {
                title: 'Updated Notification',
                message: 'Updated message',
                type: 'WARNING'
            };

            // When
            const response = await request(app)
                .put(`/admin/notifications/${notificationId}`)
                .send(updateData)
                .expect(200);

            // Then
            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockRequireAdmin).toHaveBeenCalled();
            expect(mockControllers.updateNotification).toHaveBeenCalled();
            expect(response.body).toEqual({ id: notificationId, ...updateData });
        });
    });

    describe('PATCH /admin/notifications/:notificationId', () => {
        it('should call requireAuth, requireAdmin middlewares and patchNotification controller', async () => {
            // Given
            const notificationId = '123';
            const patchData = {
                title: 'Patched Title'
            };

            // When
            const response = await request(app)
                .patch(`/admin/notifications/${notificationId}`)
                .send(patchData)
                .expect(200);

            // Then
            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockRequireAdmin).toHaveBeenCalled();
            expect(mockControllers.patchNotification).toHaveBeenCalled();
            expect(response.body).toEqual({ id: notificationId, ...patchData });
        });
    });

    describe('DELETE /admin/notifications/:notificationId', () => {
        it('should call requireAuth, requireAdmin middlewares and deleteNotification controller', async () => {
            // Given
            const notificationId = '123';

            // When
            await request(app)
                .delete(`/admin/notifications/${notificationId}`)
                .expect(204);

            // Then
            expect(mockRequireAuth).toHaveBeenCalled();
            expect(mockRequireAdmin).toHaveBeenCalled();
            expect(mockControllers.deleteNotification).toHaveBeenCalled();
        });
    });
});