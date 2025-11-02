import { prisma } from '../lib/prisma.js';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async create(data: CreateNotificationData): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (error: any) {
      console.error('[NotificationService] Failed to create notification:', error.message);
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createForUsers(userIds: string[], data: Omit<CreateNotificationData, 'userId'>): Promise<void> {
    try {
      await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        })),
      });
    } catch (error: any) {
      console.error('[NotificationService] Failed to create notifications:', error.message);
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, unreadOnly = false) {
    const where: any = {
      userId: userId,
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 notifications
    });

    return notifications.map(notification => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    }));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId, // Ensure user owns the notification
        },
        data: {
          read: true,
        },
      });
    } catch (error: any) {
      console.error('[NotificationService] Failed to mark notification as read:', error.message);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false,
        },
        data: {
          read: true,
        },
      });
    } catch (error: any) {
      console.error('[NotificationService] Failed to mark all notifications as read:', error.message);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId, // Ensure user owns the notification
        },
      });
    } catch (error: any) {
      console.error('[NotificationService] Failed to delete notification:', error.message);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId: userId,
        read: false,
      },
    });
  }
}

export const notificationService = new NotificationService();

