import { jest } from '@jest/globals';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

// Mock dos handlers
const mockHandlers = {
    createNotification: jest.fn() as jest.MockedFunction<any>,
    updateNotification: jest.fn() as jest.MockedFunction<any>,
    patchNotification: jest.fn() as jest.MockedFunction<any>,
    listNotifications: jest.fn() as jest.MockedFunction<any>,
    getNotification: jest.fn() as jest.MockedFunction<any>,
    deleteNotification: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('../handlers/NotificationsHandler', () => ({
    createNotification: mockHandlers.createNotification,
    updateNotification: mockHandlers.updateNotification,
    patchNotification: mockHandlers.patchNotification,
    listNotifications: mockHandlers.listNotifications,
    getNotification: mockHandlers.getNotification,
    deleteNotification: mockHandlers.deleteNotification,
}));

// Mock das funções utilitárias
const mockHandleZodError = jest.fn();
const mockGetPaginationParams = jest.fn();

jest.mock('@/utils/zodError', () => ({
    handleZodError: mockHandleZodError,
}));

jest.mock('@/utils/pagination', () => ({
    getPaginationParams: mockGetPaginationParams,
}));

import {
    listAllNotifications,
    createNotification,
    deleteNotification,
    getNotification,
    updateNotification,
    patchNotification
} from '../controllers/NotificationsController';

describe('NotificationsController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<any>;

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn().mockReturnThis() as any,
        };
        mockNext = jest.fn();

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('listAllNotifications', () => {
        it('should list notifications with pagination', async () => {
            // Given
            const page = 1;
            const take = 10;
            const mockNotifications = {
                notifications: [
                    {
                        id: '1',
                        title: 'Test Notification',
                        message: 'Test message',
                        type: 'INFO',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ],
                totalCount: 1,
                totalPages: 1,
                currentPage: 1
            };

            mockGetPaginationParams.mockReturnValue({ page, take });
            mockHandlers.listNotifications.mockResolvedValue(mockNotifications);
            mockRequest.query = { page: '1', take: '10' };

            // When
            await listAllNotifications(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandlers.listNotifications).toHaveBeenCalledWith(page, take);
            expect(mockResponse.json).toHaveBeenCalledWith(mockNotifications);
        });

        it('should handle errors', async () => {
            // Given
            const error = new Error('Database error');
            mockGetPaginationParams.mockReturnValue({ page: 1, take: 10 });
            mockHandlers.listNotifications.mockRejectedValue(error);

            // When
            await listAllNotifications(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockResponse);
        });
    });

    describe('createNotification', () => {
        it('should create a notification successfully', async () => {
            // Given
            const notificationData = {
                title: 'Test Notification',
                message: 'Test message',
                type: 'INFO',
                cover: 'https://example.com/cover.jpg'
            };
            const createdNotification = {
                id: '1',
                ...notificationData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.body = notificationData;
            mockHandlers.createNotification.mockResolvedValue(createdNotification);

            // When
            await createNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandlers.createNotification).toHaveBeenCalledWith(notificationData);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(createdNotification);
        });

        it('should handle validation errors', async () => {
            // Given
            mockRequest.body = { title: '' }; // Invalid data
            mockHandleZodError.mockReturnValue(true);

            // When
            await createNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalled();
        });

        it('should handle other errors', async () => {
            // Given
            const error = new Error('Database error');
            mockRequest.body = {
                title: 'Test',
                message: 'Test message',
                type: 'INFO'
            };
            mockHandlers.createNotification.mockRejectedValue(error);

            // When
            await createNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockResponse);
        });
    });

    describe('getNotification', () => {
        it('should get a notification successfully', async () => {
            // Given
            const notificationId = '1';
            const notification = {
                id: notificationId,
                title: 'Test Notification',
                message: 'Test message',
                type: 'INFO',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.params = { notificationId };
            mockHandlers.getNotification.mockResolvedValue(notification);

            // When
            await getNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandlers.getNotification).toHaveBeenCalledWith(notificationId);
            expect(mockResponse.json).toHaveBeenCalledWith(notification);
        });

        it('should handle not found errors', async () => {
            // Given
            const notificationId = '999';
            const error = new Error('Notificação não encontrada');
            mockRequest.params = { notificationId };
            mockHandlers.getNotification.mockRejectedValue(error);

            // When
            await getNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Notificação não encontrada' });
        });
    });

    describe('updateNotification', () => {
        it('should update a notification successfully', async () => {
            // Given
            const notificationId = '1';
            const updateData = {
                title: 'Updated Notification',
                message: 'Updated message',
                type: 'WARNING'
            };
            const updatedNotification = {
                id: notificationId,
                ...updateData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.params = { notificationId };
            mockRequest.body = updateData;
            mockHandlers.updateNotification.mockResolvedValue(updatedNotification);

            // When
            await updateNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandlers.updateNotification).toHaveBeenCalledWith('1', updateData);
            expect(mockResponse.json).toHaveBeenCalledWith(updatedNotification);
        });

        it('should handle validation errors', async () => {
            // Given
            mockRequest.params = { notificationId: '1' };
            mockRequest.body = { title: '' }; // Invalid data
            mockHandleZodError.mockReturnValue(true);

            // When
            await updateNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalled();
        });
    });

    describe('patchNotification', () => {
        it('should patch a notification successfully', async () => {
            // Given
            const notificationId = '1';
            const patchData = {
                title: 'Patched Title'
            };
            const patchedNotification = {
                id: notificationId,
                title: 'Patched Title',
                message: 'Original message',
                type: 'INFO',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.params = { notificationId };
            mockRequest.body = patchData;
            mockHandlers.patchNotification.mockResolvedValue(patchedNotification);

            // When
            await patchNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandlers.patchNotification).toHaveBeenCalledWith('1', patchData);
            expect(mockResponse.json).toHaveBeenCalledWith(patchedNotification);
        });

        it('should handle validation errors', async () => {
            // Given
            mockRequest.params = { notificationId: '1' };
            mockRequest.body = {}; // Empty patch data
            mockHandleZodError.mockReturnValue(true);

            // When
            await patchNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalled();
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification successfully', async () => {
            // Given
            const notificationId = '1';
            mockRequest.params = { notificationId };
            mockHandlers.deleteNotification.mockResolvedValue(undefined);
            mockResponse.send = jest.fn() as any;

            // When
            await deleteNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandlers.deleteNotification).toHaveBeenCalledWith(notificationId);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle delete errors', async () => {
            // Given
            const notificationId = '999';
            const error = new Error('Notificação não encontrada');
            mockRequest.params = { notificationId };
            mockHandlers.deleteNotification.mockRejectedValue(error);

            // When
            await deleteNotification(mockRequest as Request, mockResponse as Response, mockNext);

            // Then
            expect(mockHandleZodError).toHaveBeenCalledWith(error, mockResponse);
        });
    });
});