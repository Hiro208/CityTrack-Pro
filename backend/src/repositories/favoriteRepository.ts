import { query } from '../config/database';

export interface FavoriteRouteRow {
  route_id: string;
}

export interface FavoriteStopRow {
  stop_id: string;
  stop_name: string | null;
}

export class FavoriteRepository {
  static async getFavoriteRoutes(userId: number): Promise<FavoriteRouteRow[]> {
    const sql = 'SELECT route_id FROM favorite_routes WHERE user_id = $1 ORDER BY route_id';
    const result = await query<FavoriteRouteRow>(sql, [userId]);
    return result.rows;
  }

  static async addFavoriteRoute(userId: number, routeId: string): Promise<void> {
    const sql = `
      INSERT INTO favorite_routes (user_id, route_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, route_id) DO NOTHING
    `;
    await query(sql, [userId, routeId.toUpperCase()]);
  }

  static async removeFavoriteRoute(userId: number, routeId: string): Promise<void> {
    const sql = 'DELETE FROM favorite_routes WHERE user_id = $1 AND route_id = $2';
    await query(sql, [userId, routeId.toUpperCase()]);
  }

  static async getFavoriteStops(userId: number): Promise<FavoriteStopRow[]> {
    const sql = 'SELECT stop_id, stop_name FROM favorite_stops WHERE user_id = $1 ORDER BY stop_id';
    const result = await query<FavoriteStopRow>(sql, [userId]);
    return result.rows;
  }

  static async addFavoriteStop(userId: number, stopId: string, stopName: string): Promise<void> {
    const sql = `
      INSERT INTO favorite_stops (user_id, stop_id, stop_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, stop_id)
      DO UPDATE SET stop_name = EXCLUDED.stop_name
    `;
    await query(sql, [userId, stopId.toUpperCase(), stopName]);
  }

  static async removeFavoriteStop(userId: number, stopId: string): Promise<void> {
    const sql = 'DELETE FROM favorite_stops WHERE user_id = $1 AND stop_id = $2';
    await query(sql, [userId, stopId.toUpperCase()]);
  }
}
