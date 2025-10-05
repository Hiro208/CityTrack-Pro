import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { NotificationRepository } from '../repositories/notificationRepository';
import { UserRepository } from '../repositories/userRepository';
import type { NotificationRow } from '../models/Notification';

function getMailer() {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export class NotificationDispatchService {
  static async dispatchNewNotifications(notifications: NotificationRow[]): Promise<void> {
    if (notifications.length === 0) return;

    const byUser = new Map<number, NotificationRow[]>();
    for (const n of notifications) {
      if (!byUser.has(n.user_id)) byUser.set(n.user_id, []);
      byUser.get(n.user_id)!.push(n);
    }

    const mailer = getMailer();

    for (const [userId, userNotifications] of byUser.entries()) {
      const settings = await UserRepository.getNotificationSettings(userId);
      if (!settings) continue;

      // Email
      if (settings.email_notifications_enabled && mailer && env.SMTP_FROM) {
        const user = await UserRepository.findById(userId);
        if (user?.email) {
          const sentIds: number[] = [];
          for (const n of userNotifications) {
            try {
              await mailer.sendMail({
                from: env.SMTP_FROM,
                to: user.email,
                subject: `[MTA Alert] ${n.title}`,
                text: `${n.title}\n\n${n.body || ''}\n\nEffect: ${n.effect_text || 'N/A'}`,
              });
              sentIds.push(n.id);
            } catch (e) {
              // ignore email failure
            }
          }
          await NotificationRepository.markEmailSent(sentIds);
        }
      }
    }
  }
}
