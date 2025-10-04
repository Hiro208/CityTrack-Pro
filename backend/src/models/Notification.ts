export interface NotificationRow {
  id: number;
  user_id: number;
  alert_id: string;
  title: string;
  body: string | null;
  effect_text: string | null;
  is_read: boolean;
  email_sent: boolean;
  webpush_sent: boolean;
  created_at: Date;
  read_at: Date | null;
}

export interface PushSubscriptionRow {
  id?: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at?: Date;
}
