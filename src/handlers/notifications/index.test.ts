import { jest } from '@jest/globals';
import { createFollowNotification, createUserNotification, listUserNotifications, markAsRead, markAllAsRead } from './index';
import prisma from '@/prisma/client';

// Mock do Prisma Client
jest.mock('@/prisma/client', () => ({
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Notification Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserNotification', () => {
    it('should create a notification for a user', async () => {
      // Given
      const mockNotification = {
        id: '1',
        userId: 'user1',
        type: 'follow',
        title: 'Novo seguidor',
        message: 'João começou a te seguir',
        data: { followerId: 'user2' },
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      // When
      const result = await createUserNotification({
        userId: 'user1',
        type: 'follow',
        title: 'Novo seguidor',
        message: 'João começou a te seguir',
        data: { followerId: 'user2' }
      });

      // Then
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          type: 'follow',
          title: 'Novo seguidor',
          message: 'João começou a te seguir',
          data: { followerId: 'user2' },
        },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('createFollowNotification', () => {
    it('should create a follow notification', async () => {
      // Given
      const mockNotification = {
        id: '1',
        userId: 'targetUser',
        type: 'follow',
        title: 'Novo seguidor',
        message: 'João começou a te seguir',
        data: { followerId: 'followerUser' },
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      // When
      const result = await createFollowNotification('followerUser', 'targetUser', 'João');

      // Then
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'targetUser',
          type: 'follow',
          title: 'Novo seguidor',
          message: 'João começou a te seguir',
          data: { followerId: 'followerUser' },
        },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('listUserNotifications', () => {
    it('should list user notifications with unread count', async () => {
      // Given
      const mockNotifications = [
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
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValueOnce(1); // total
      mockPrisma.notification.count.mockResolvedValueOnce(1); // unread

      // When
      const result = await listUserNotifications('user1', 1, 10);

      // Then
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        notifications: mockNotifications,
        total: 1,
        unreadCount: 1,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notification-id',
        userId: 'user-id',
        title: 'Test',
        message: 'Test message',
        type: 'FOLLOW',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: null
      };

      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await markAsRead('notification-id', 'user-id');

      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notification-id', userId: 'user-id' }
      });
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-id' },
        data: { isRead: true }
      });
      expect(result.isRead).toBe(true);
    });

    it('should throw error if notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(markAsRead('invalid-id', 'user-id')).rejects.toThrow('Notificação não encontrada');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockResult = { count: 3 };
      mockPrisma.notification.updateMany.mockResolvedValue(mockResult);

      const result = await markAllAsRead('user-id');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', isRead: false },
        data: { isRead: true }
      });
      expect(result.count).toBe(3);
    });
  });
});