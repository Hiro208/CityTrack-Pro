import { query } from '../config/database';

export interface ServiceAlertRow {
  id: string;
  header_text: string | null;
  description_text: string | null;
  effect_text: string | null;
  cause_text: string | null;
  route_ids: string[];
  stop_ids: string[];
  updated_at: number;
  created_at?: Date;
}

export class AlertRepository {
  static async upsertBatch(alerts: ServiceAlertRow[]): Promise<void> {
    if (alerts.length === 0) return;
    const sql = `
      INSERT INTO service_alerts (
        id, header_text, description_text, effect_text, cause_text, route_ids, stop_ids, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id)
      DO UPDATE SET
        header_text = EXCLUDED.header_text,
        description_text = EXCLUDED.description_text,
        effect_text = EXCLUDED.effect_text,
        cause_text = EXCLUDED.cause_text,
        route_ids = EXCLUDED.route_ids,
        stop_ids = EXCLUDED.stop_ids,
        updated_at = EXCLUDED.updated_at,
        created_at = NOW()
    `;

    for (const a of alerts) {
      await query(sql, [
        a.id,
        a.header_text,
        a.description_text,
        a.effect_text,
        a.cause_text,
        a.route_ids,
        a.stop_ids,
        a.updated_at,
      ]);
    }
  }

  static async getRecent(limit = 100): Promise<ServiceAlertRow[]> {
    const sql = `
      SELECT * FROM service_alerts
      WHERE updated_at > (EXTRACT(EPOCH FROM NOW()) - 86400)
      ORDER BY updated_at DESC
      LIMIT $1
    `;
    const result = await query<ServiceAlertRow>(sql, [limit]);
    return result.rows;
  }

  static async getForFavorites(routeIds: string[], stopIds: string[], limit = 100): Promise<ServiceAlertRow[]> {
    if (routeIds.length === 0 && stopIds.length === 0) return [];
    const sql = `
      SELECT * FROM service_alerts
      WHERE (
        (cardinality($1::text[]) > 0 AND route_ids && $1::text[])
        OR
        (cardinality($2::text[]) > 0 AND stop_ids && $2::text[])
      )
      ORDER BY updated_at DESC
      LIMIT $3
    `;
    const result = await query<ServiceAlertRow>(sql, [routeIds, stopIds, limit]);
    return result.rows;
  }
}
