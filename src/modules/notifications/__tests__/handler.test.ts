import { jest } from '@jest/globals';

// Mock do Prisma
const mockPrisma = {
    notification: {
        create: jest.fn() as jest.MockedFunction<any>,
        findUnique: jest.fn() as jest.MockedFunction<any>,
        update: jest.fn() as jest.MockedFunction<any>,
        findMany: jest.fn() as jest.MockedFunction<any>,
        count: jest.fn() as jest.MockedFunction<any>,
        delete: jest.fn() as jest.MockedFunction<any>,
    },
};

jest.mock('../../../prisma/client', () => ({
    __esModule: true,
    default: mockPrisma,
}));

import {
    createNotification,
    createUserNotification,
    updateNotification,
    patchNotification,
    createFollowNotification,
    listNotifications,
    getNotification,
    deleteNotification
} from '../handlers/NotificationsHandler';

describe('NotificationsHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotification', () => {
        it('should create a notification successfully', async () => {
            // Given
            const notificationData = {
                title: 'Test Notification',
                message: 'Test message',
                type: 'INFO',
                cover: 'https://example.com/cover.jpg',
                data: { key: 'value' }
            };

            const mockNotification = {
                id: 'notification-123',
                ...notificationData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.notification.create.mockResolvedValue(mockNotification);

            // When
            const result = await createNotification(notificationData);

            // Then
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type,
                    cover: notificationData.cover,
                    data: notificationData.data
                }
            });
            expect(result).toEqual(mockNotification);
        });

        it('should create a notification without optional fields', async () => {
            // Given
            const notificationData = {
                title: 'Test Notification',
                message: 'Test message',
                type: 'test'
            };

            const mockNotification = {
                id: 'notification-123',
                ...notificationData,
                cover: null,
                data: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.notification.create.mockResolvedValue(mockNotification);

            // When
            const result = await createNotification(notificationData);

            // Then
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type,
                    cover: undefined,
                    data: undefined
                }
            });
            expect(result).toEqual(mockNotification);
        });
    });

    describe('createUserNotification', () => {
        it('should create a user notification successfully', async () => {
            // Given
            const notificationData = {
                title: 'User Notification',
                message: 'User message',
                type: 'user',
                cover: 'https://example.com/cover.jpg',
                data: { userId: 'user-123' }
            };

            const mockNotification = {
                id: 'notification-456',
                ...notificationData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.notification.create.mockResolvedValue(mockNotification);

            // When
            const result = await createUserNotification(notificationData);

            // Then
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type,
                    cover: notificationData.cover,
                    data: notificationData.data
                }
            });
            expect(result).toEqual(mockNotification);
        });
    });

    describe('updateNotification', () => {
        it('should update a notification successfully', async () => {
            // Given
            const notificationId = 'notification-123';
            const updateData = {
                title: 'Updated Title',
                message: 'Updated message',
                type: 'updated',
                cover: 'https://example.com/new-cover.jpg',
                data: { updated: true }
            };

            const existingNotification = {
                id: notificationId,
                title: 'Old Title',
                message: 'Old message',
                type: 'old',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const updatedNotification = {
                ...existingNotification,
                ...updateData,
                updatedAt: expect.any(Date)
            };

            mockPrisma.notification.findUnique.mockResolvedValue(existingNotification);
            mockPrisma.notification.update.mockResolvedValue(updatedNotification);

            // When
            const result = await updateNotification(notificationId, updateData);

            // Then
            expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId }
            });
            expect(mockPrisma.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: {
                    ...updateData,
                    updatedAt: expect.any(Date)
                }
            });
            expect(result).toEqual(updatedNotification);
        });

        it('should throw error when notification not found', async () => {
            // Given
            const notificationId = 'non-existent-id';
            const updateData = {
                title: 'Updated Title',
                message: 'Updated message',
                type: 'updated'
            };

            mockPrisma.notification.findUnique.mockResolvedValue(null);

            // When & Then
            await expect(updateNotification(notificationId, updateData))
                .rejects.toThrow('Notificação não encontrada');

            expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId }
            });
            expect(mockPrisma.notification.update).not.toHaveBeenCalled();
        });
    });

    describe('patchNotification', () => {
        it('should patch a notification successfully', async () => {
            // Given
            const notificationId = 'notification-123';
            const patchData = {
                title: 'Patched Title',
                data: { patched: true }
            };

            const existingNotification = {
                id: notificationId,
                title: 'Old Title',
                message: 'Old message',
                type: 'old',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const patchedNotification = {
                ...existingNotification,
                title: patchData.title,
                data: patchData.data,
                updatedAt: expect.any(Date)
            };

            mockPrisma.notification.findUnique.mockResolvedValue(existingNotification);
            mockPrisma.notification.update.mockResolvedValue(patchedNotification);

            // When
            const result = await patchNotification(notificationId, patchData);

            // Then
            expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId }
            });
            expect(mockPrisma.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: {
                    title: patchData.title,
                    data: patchData.data,
                    updatedAt: expect.any(Date)
                }
            });
            expect(result).toEqual(patchedNotification);
        });

        it('should filter out undefined values in patch data', async () => {
            // Given
            const notificationId = 'notification-123';
            const patchData = {
                title: 'Patched Title',
                message: undefined,
                type: undefined,
                cover: 'https://example.com/cover.jpg'
            };

            const existingNotification = {
                id: notificationId,
                title: 'Old Title',
                message: 'Old message',
                type: 'old',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.notification.findUnique.mockResolvedValue(existingNotification);
            mockPrisma.notification.update.mockResolvedValue(existingNotification);

            // When
            await patchNotification(notificationId, patchData);

            // Then
            expect(mockPrisma.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: {
                    title: 'Patched Title',
                    cover: 'https://example.com/cover.jpg',
                    updatedAt: expect.any(Date)
                }
            });
        });

        it('should throw error when notification not found', async () => {
            // Given
            const notificationId = 'non-existent-id';
            const patchData = { title: 'Patched Title' };

            mockPrisma.notification.findUnique.mockResolvedValue(null);

            // When & Then
            await expect(patchNotification(notificationId, patchData))
                .rejects.toThrow('Notificação não encontrada');

            expect(mockPrisma.notification.update).not.toHaveBeenCalled();
        });
    });

    describe('createFollowNotification', () => {
        it('should create a follow notification successfully', async () => {
            // Given
            const followerId = 'follower-123';
            const targetId = 'target-456';
            const followerName = 'John Doe';

            const mockNotification = {
                id: 'notification-789',
                title: 'Novo seguidor',
                message: `${followerName} começou a te seguir`,
                type: 'FOLLOW',
                data: {
                    followerId,
                    followerName,
                    targetId
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.notification.create.mockResolvedValue(mockNotification);

            // When
            const result = await createFollowNotification(followerId, targetId, followerName);

            // Then
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    title: 'Novo seguidor',
                    message: `${followerName} começou a te seguir`,
                    type: 'follow',
                    cover: undefined,
                    data: {
                        followerId,
                        followerName,
                        targetId
                    }
                }
            });
            expect(result).toEqual(mockNotification);
        });
    });

    describe('listNotifications', () => {
        it('should list notifications with pagination', async () => {
            // Given
            const page = 1;
            const take = 10;
            const skip = 0;

            const mockNotifications = [
                {
                    id: 'notification-1',
                    title: 'Notification 1',
                    message: 'Message 1',
                    type: 'test',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'notification-2',
                    title: 'Notification 2',
                    message: 'Message 2',
                    type: 'test',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const totalCount = 25;

            mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
            mockPrisma.notification.count.mockResolvedValue(totalCount);

            // When
            const result = await listNotifications(page, take);

            // Then
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
                skip,
                take,
                orderBy: {
                    createdAt: 'desc'
                }
            });
            expect(mockPrisma.notification.count).toHaveBeenCalledWith({});
            expect(result).toEqual({
                data: mockNotifications,
                pagination: {
                    total: totalCount,
                    page,
                    limit: take,
                    totalPages: 3,
                    next: 2,
                    prev: null
                }
            });
        });

        it('should handle pagination for middle page', async () => {
            // Given
            const page = 2;
            const take = 10;
            const skip = 10;
            const totalCount = 25;

            mockPrisma.notification.findMany.mockResolvedValue([]);
            mockPrisma.notification.count.mockResolvedValue(totalCount);

            // When
            const result = await listNotifications(page, take);

            // Then
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
                skip,
                take,
                orderBy: {
                    createdAt: 'desc'
                }
            });
            expect(result.pagination).toEqual({
                total: totalCount,
                page,
                limit: take,
                totalPages: 3,
                next: 3,
                prev: 1
            });
        });

        it('should handle pagination for last page', async () => {
            // Given
            const page = 3;
            const take = 10;
            const totalCount = 25;

            mockPrisma.notification.findMany.mockResolvedValue([]);
            mockPrisma.notification.count.mockResolvedValue(totalCount);

            // When
            const result = await listNotifications(page, take);

            // Then
            expect(result.pagination).toEqual({
                total: totalCount,
                page,
                limit: take,
                totalPages: 3,
                next: null,
                prev: 2
            });
        });
    });

    describe('getNotification', () => {
        it('should get a notification successfully', async () => {
            // Given
            const notificationId = 'notification-123';
            const mockNotification = {
                id: notificationId,
                title: 'Test Notification',
                message: 'Test message',
                type: 'test',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);

            // When
            const result = await getNotification(notificationId);

            // Then
            expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId }
            });
            expect(result).toEqual(mockNotification);
        });

        it('should throw error when notification not found', async () => {
            // Given
            const notificationId = 'non-existent-id';

            mockPrisma.notification.findUnique.mockResolvedValue(null);

            // When & Then
            await expect(getNotification(notificationId))
                .rejects.toThrow('Notificação não encontrada');

            expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
                where: { id: notificationId }
            });
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification successfully', async () => {
            // Given
            const notificationId = 'notification-123';

            mockPrisma.notification.delete.mockResolvedValue(undefined);

            // When
            await deleteNotification(notificationId);

            // Then
            expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
                where: { id: notificationId }
            });
        });

        it('should handle delete errors', async () => {
            // Given
            const notificationId = 'notification-123';
            const deleteError = new Error('Delete failed');

            mockPrisma.notification.delete.mockRejectedValue(deleteError);

            // When & Then
            await expect(deleteNotification(notificationId))
                .rejects.toThrow('Delete failed');

            expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
                where: { id: notificationId }
            });
        });
    });
});