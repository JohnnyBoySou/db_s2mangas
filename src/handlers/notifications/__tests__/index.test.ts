import { prismaMock } from '../../../test/mocks/prisma';

// Mock do Prisma
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock,
}));

import {
  createNotification,
  listNotifications,
  getNotification,
  deleteNotification,
} from '../index';

describe('Notifications Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      // Given
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'INFO'
      };

      const mockNotification = {
        id: '1',
        ...notificationData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.notification.create.mockResolvedValue(mockNotification);

      // When
      const result = await createNotification(notificationData);

      // Then
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: notificationData
      });
      expect(result).toEqual(mockNotification);
    });

    it('should handle database errors', async () => {
      // Given
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'INFO'
      };

      prismaMock.notification.create.mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(createNotification(notificationData)).rejects.toThrow('Database error');
    });
  });

  describe('listNotifications', () => {
    it('should list notifications with pagination', async () => {
      // Given
      const page = 1;
      const take = 10;
      const mockNotifications = [
        {
          id: '1',
          title: 'Notification 1',
          message: 'Message 1',
          type: 'INFO',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Notification 2',
          message: 'Message 2',
          type: 'WARNING',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      const totalCount = 25;

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.notification.count.mockResolvedValue(totalCount);

      // When
      const result = await listNotifications(page, take);

      // Then
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      });
      expect(prismaMock.notification.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockNotifications,
        pagination: {
          total: totalCount,
          page: 1,
          limit: take,
          totalPages: 3,
          next: 2,
          prev: null
        }
      });
    });

    it('should handle pagination for last page', async () => {
      // Given
      const page = 3;
      const take = 10;
      const mockNotifications = [{
        id: '1',
        title: 'Notification 1',
        message: 'Message 1',
        type: 'INFO',
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      const totalCount = 25;

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.notification.count.mockResolvedValue(totalCount);

      // When
      const result = await listNotifications(page, take);

      // Then
      expect(result.pagination).toEqual({
        total: totalCount,
        page: 3,
        limit: take,
        totalPages: 3,
        next: null,
        prev: 2
      });
    });

    it('should handle empty results', async () => {
      // Given
      const page = 1;
      const take = 10;

      prismaMock.notification.findMany.mockResolvedValue([]);
      prismaMock.notification.count.mockResolvedValue(0);

      // When
      const result = await listNotifications(page, take);

      // Then
      expect(result).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: take,
          totalPages: 0,
          next: null,
          prev: null
        }
      });
    });
  });

  describe('getNotification', () => {
    it('should get notification by id successfully', async () => {
      // Given
      const notificationId = '1';
      const mockNotification = {
        id: notificationId,
        title: 'Test Notification',
        message: 'Test message',
        type: 'INFO',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.notification.findUnique.mockResolvedValue(mockNotification);

      // When
      const result = await getNotification(notificationId);

      // Then
      expect(prismaMock.notification.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId }
      });
      expect(result).toEqual(mockNotification);
    });

    it('should throw error when notification not found', async () => {
      // Given
      const notificationId = 'non-existent';
      prismaMock.notification.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(getNotification(notificationId)).rejects.toThrow('Notificação não encontrada');
      expect(prismaMock.notification.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId }
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      // Given
      const notificationId = '1';
      const mockNotification = {
        id: notificationId,
        title: 'Test Notification',
        message: 'Test message',
        type: 'INFO',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.notification.delete.mockResolvedValue(mockNotification);

      // When
      await deleteNotification(notificationId);

      // Then
      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: { id: notificationId }
      });
    });

    it('should handle database errors during deletion', async () => {
      // Given
      const notificationId = '1';
      prismaMock.notification.delete.mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(deleteNotification(notificationId)).rejects.toThrow('Database error');
    });
  });
});