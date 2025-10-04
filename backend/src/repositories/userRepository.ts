import { query } from '../config/database';
import type { UserRow } from '../models/Auth';

export class UserRepository {
  static async findByEmail(email: string): Promise<UserRow | null> {
    const sql = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    const result = await query<UserRow>(sql, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  static async create(email: string, passwordHash: string): Promise<UserRow> {
    const sql = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash, created_at
    `;
    const result = await query<UserRow>(sql, [email.toLowerCase(), passwordHash]);
    return result.rows[0];
  }

  static async findById(id: number): Promise<UserRow | null> {
    const sql = 'SELECT * FROM users WHERE id = $1 LIMIT 1';
    const result = await query<UserRow>(sql, [id]);
    return result.rows[0] || null;
  }

  static async getNotificationSettings(userId: number): Promise<{
    email_notifications_enabled: boolean;
    push_notifications_enabled: boolean;
  } | null> {
    const sql = `
      SELECT email_notifications_enabled, push_notifications_enabled
      FROM users
      WHERE id = $1
      LIMIT 1
    `;
    const result = await query<{
      email_notifications_enabled: boolean;
      push_notifications_enabled: boolean;
    }>(sql, [userId]);
    return result.rows[0] || null;
  }

  static async updateNotificationSettings(
    userId: number,
    settings: { email_notifications_enabled?: boolean; push_notifications_enabled?: boolean }
  ): Promise<void> {
    const sql = `
      UPDATE users
      SET
        email_notifications_enabled = COALESCE($2, email_notifications_enabled),
        push_notifications_enabled = COALESCE($3, push_notifications_enabled)
      WHERE id = $1
    `;
    await query(sql, [userId, settings.email_notifications_enabled, settings.push_notifications_enabled]);
  }
}
