import { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { NotificationRepository } from '../repositories/notificationRepository';
import { UserRepository } from '../repositories/userRepository';

export class NotificationController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const onlyUnread = String(req.query.unread || '') === '1';
      const rows = await NotificationRepository.listByUser(req.user!.id, onlyUnread);
      return res.json({ success: true, count: rows.length, data: rows });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });
      await NotificationRepository.markRead(req.user!.id, id);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response) {
    try {
      await NotificationRepository.markAllRead(req.user!.id);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
  }

  static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await UserRepository.getNotificationSettings(req.user!.id);
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to fetch notification settings' });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const emailEnabled =
        typeof req.body?.email_notifications_enabled === 'boolean'
          ? req.body.email_notifications_enabled
          : undefined;
      await UserRepository.updateNotificationSettings(req.user!.id, {
        email_notifications_enabled: emailEnabled,
      });
      const settings = await UserRepository.getNotificationSettings(req.user!.id);
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to update notification settings' });
    }
  }
}
