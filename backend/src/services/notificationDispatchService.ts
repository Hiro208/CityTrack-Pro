import webpush from 'web-push';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { NotificationRepository } from '../repositories/notificationRepository';
import { UserRepository } from '../repositories/userRepository';
import type { NotificationRow } from '../models/Notification';

let webPushInitialized = false;

function initWebPush() {
  if (webPushInitialized) return;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  webPushInitialized = true;
}

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
  static getPushConfig() {
    return {
      enabled: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
      publicKey: env.VAPID_PUBLIC_KEY || '',
    };
  }

  static async dispatchNewNotifications(notifications: NotificationRow[]): Promise<void> {
    if (notifications.length === 0) return;

    const byUser = new Map<number, NotificationRow[]>();
    for (const n of notifications) {
      if (!byUser.has(n.user_id)) byUser.set(n.user_id, []);
      byUser.get(n.user_id)!.push(n);
    }

    const mailer = getMailer();
    initWebPush();

    for (const [userId, userNotifications] of byUser.entries()) {
      const settings = await UserRepository.getNotificationSettings(userId);
      if (!settings) continue;

      // Web Push
      if (settings.push_notifications_enabled && webPushInitialized) {
        const subs = await NotificationRepository.listPushSubscriptionsByUser(userId);
        if (subs.length > 0) {
          const payload = JSON.stringify({
            title: 'Transit Service Alert',
            body: userNotifications[0].title,
            count: userNotifications.length,
          });
          const sentIds: number[] = [];
          for (const n of userNotifications) {
            try {
              await Promise.all(
                subs.map((s) =>
                  webpush.sendNotification(
                    {
                      endpoint: s.endpoint,
                      keys: { p256dh: s.p256dh, auth: s.auth },
                    },
                    payload
                  )
                )
              );
              sentIds.push(n.id);
            } catch (e) {
              // ignore single-send failure
            }
          }
          await NotificationRepository.markWebPushSent(sentIds);
        }
      }

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
