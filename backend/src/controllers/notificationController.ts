import { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { NotificationRepository } from '../repositories/notificationRepository';
import { NotificationDispatchService } from '../services/notificationDispatchService';
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

  static async getPushConfig(req: AuthenticatedRequest, res: Response) {
    const config = NotificationDispatchService.getPushConfig();
    return res.json({ success: true, data: config });
  }

  static async subscribePush(req: AuthenticatedRequest, res: Response) {
    try {
      const endpoint = String(req.body?.endpoint || '');
      const p256dh = String(req.body?.keys?.p256dh || '');
      const auth = String(req.body?.keys?.auth || '');
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ success: false, message: 'Invalid push subscription payload' });
      }
      await NotificationRepository.upsertPushSubscription({
        user_id: req.user!.id,
        endpoint,
        p256dh,
        auth,
      });
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to subscribe push notifications' });
    }
  }

  static async unsubscribePush(req: AuthenticatedRequest, res: Response) {
    try {
      const endpoint = String(req.body?.endpoint || '');
      if (!endpoint) return res.status(400).json({ success: false, message: 'Invalid endpoint' });
      await NotificationRepository.removePushSubscription(req.user!.id, endpoint);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to unsubscribe push notifications' });
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
      const pushEnabled =
        typeof req.body?.push_notifications_enabled === 'boolean'
          ? req.body.push_notifications_enabled
          : undefined;
      await UserRepository.updateNotificationSettings(req.user!.id, {
        email_notifications_enabled: emailEnabled,
        push_notifications_enabled: pushEnabled,
      });
      const settings = await UserRepository.getNotificationSettings(req.user!.id);
      return res.json({ success: true, data: settings });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to update notification settings' });
    }
  }
}
