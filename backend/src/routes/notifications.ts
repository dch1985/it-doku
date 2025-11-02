import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { devAuthenticate } from '../middleware/auth.dev.middleware.js';

const router = Router();

// Apply authentication middleware
const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_AUTH_ENABLED === 'true';
router.use(isDevMode ? devAuthenticate : authenticate);

// GET /api/notifications - Get user's notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to view notifications'
      });
    }

    const { unread } = req.query;
    const unreadOnly = unread === 'true' || unread === '1';

    const notifications = await notificationService.getUserNotifications(req.user.id, unreadOnly);

    res.json(notifications);
  } catch (error: any) {
    console.error('[Notifications] Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to view notification count'
      });
    }

    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({ count });
  } catch (error: any) {
    console.error('[Notifications] Error fetching unread count:', error);
    res.status(500).json({
      error: 'Failed to fetch unread count',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to mark notifications as read'
      });
    }

    const { id } = req.params;

    await notificationService.markAsRead(id, req.user.id);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Notifications] Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to mark notifications as read'
      });
    }

    await notificationService.markAllAsRead(req.user.id);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Notifications] Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete notifications'
      });
    }

    const { id } = req.params;

    await notificationService.delete(id, req.user.id);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Notifications] Error deleting notification:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

export default router;

