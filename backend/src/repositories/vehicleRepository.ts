import { query } from '../config/database';
import pool from '../config/database';
import { VehiclePositionRow } from '../models/Vehicle'; 
import redisClient from '../config/redis';

type InsightsRange = '15m' | '1h' | '6h' | '24h';
type InsightsCompare = 'none' | 'previous';

export interface VehicleInsightPoint {
  ts: number;
  count: number;
}

export interface VehicleInsightTopRoute {
  route_id: string;
  vehicle_count: number;
}

export interface VehicleInsightsResult {
  range: InsightsRange;
  compare: InsightsCompare;
  route: string;
  series: VehicleInsightPoint[];
  current_avg: number;
  previous_avg: number | null;
  delta: number | null;
  delta_percent: number | null;
  top_routes: VehicleInsightTopRoute[];
}

export class VehicleRepository {
  
  static async findAll(): Promise<VehiclePositionRow[]> {
    // 尝试从 Redis 获取缓存
    const cachedData = await redisClient.get('vehicles:all');
    
    if (cachedData) {
      // console.log('🚀 Cache Hit! (从 Redis 读取)');
      return JSON.parse(cachedData);
    }

    // 缓存失效，查数据库
    console.log('🐢 Cache Miss! (从数据库读取)');
    const sql = `
      SELECT * FROM vehicle_positions 
      WHERE timestamp > (EXTRACT(EPOCH FROM NOW()) - 300)
      ORDER BY route_id ASC
    `;
    const result = await query<VehiclePositionRow>(sql);
  
    await redisClient.set('vehicles:all', JSON.stringify(result.rows), {
      EX: 60 
    });
    return result.rows;
  }

  static async saveBatch(vehicles: any[]): Promise<void> {
    if (vehicles.length === 0) return;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const upsertQuery = `
        INSERT INTO vehicle_positions (
          trip_id, route_id, lat, lon, timestamp, 
          stop_name, current_status, direction, destination, consist
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (trip_id) 
        DO UPDATE SET 
          lat = EXCLUDED.lat,
          lon = EXCLUDED.lon,
          timestamp = EXCLUDED.timestamp,
          stop_name = EXCLUDED.stop_name,
          current_status = EXCLUDED.current_status,
          direction = EXCLUDED.direction,
          destination = EXCLUDED.destination,
          consist = EXCLUDED.consist,
          created_at = NOW();
      `;

      for (const v of vehicles) {
        await client.query(upsertQuery, [
          v.trip_id,
          v.route_id,
          v.lat,
          v.lon,
          v.timestamp,
          v.stop_name,
          v.current_status,
          v.direction,
          v.destination,
          v.consist
        ]);
      }

      await client.query('COMMIT');
      console.log(`💾 成功存储/更新了 ${vehicles.length} 辆车的数据`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('🔥 批量保存失败，已回滚:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async saveMetricsSnapshot(vehicles: any[]): Promise<void> {
    const snapshotTs = Math.floor(Date.now() / 1000);
    const routeCounts = vehicles.reduce<Record<string, number>>((acc, v) => {
      const routeId = String(v.route_id || '').toUpperCase();
      if (!routeId) return acc;
      acc[routeId] = (acc[routeId] || 0) + 1;
      return acc;
    }, {});

    const rows: Array<{ routeId: string; count: number }> = [
      { routeId: 'ALL', count: vehicles.length },
      ...Object.entries(routeCounts).map(([routeId, count]) => ({ routeId, count })),
    ];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const upsert = `
        INSERT INTO vehicle_metrics_snapshots (snapshot_ts, route_id, vehicle_count)
        VALUES ($1, $2, $3)
        ON CONFLICT (snapshot_ts, route_id)
        DO UPDATE SET vehicle_count = EXCLUDED.vehicle_count
      `;
      for (const row of rows) {
        await client.query(upsert, [snapshotTs, row.routeId, row.count]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('🔥 保存车辆指标快照失败:', error);
    } finally {
      client.release();
    }
  }

  static async getInsights(params: {
    route?: string;
    range?: string;
    compare?: string;
  }): Promise<VehicleInsightsResult> {
    const route = String(params.route || 'ALL').toUpperCase();
    const range = (params.range || '1h') as InsightsRange;
    const compare = (params.compare || 'previous') as InsightsCompare;

    const rangeMap: Record<InsightsRange, number> = {
      '15m': 15 * 60,
      '1h': 60 * 60,
      '6h': 6 * 60 * 60,
      '24h': 24 * 60 * 60,
    };
    const safeRange: InsightsRange = rangeMap[range] ? range : '1h';
    const safeCompare: InsightsCompare = compare === 'none' ? 'none' : 'previous';
    const nowTs = Math.floor(Date.now() / 1000);
    const currentStartTs = nowTs - rangeMap[safeRange];

    const seriesSql = `
      SELECT snapshot_ts, vehicle_count
      FROM vehicle_metrics_snapshots
      WHERE route_id = $1
        AND snapshot_ts >= $2
      ORDER BY snapshot_ts ASC
    `;
    const seriesRes = await query<{ snapshot_ts: number; vehicle_count: number }>(seriesSql, [
      route,
      currentStartTs,
    ]);
    const series = seriesRes.rows.map((r) => ({
      ts: Number(r.snapshot_ts) * 1000,
      count: Number(r.vehicle_count),
    }));

    const avgSql = `
      SELECT ROUND(AVG(vehicle_count))::int AS avg_count
      FROM vehicle_metrics_snapshots
      WHERE route_id = $1
        AND snapshot_ts >= $2
    `;
    const currentAvgRes = await query<{ avg_count: number | null }>(avgSql, [route, currentStartTs]);
    const currentAvg = Number(currentAvgRes.rows[0]?.avg_count ?? 0);

    let previousAvg: number | null = null;
    if (safeCompare === 'previous') {
      const previousStartTs = currentStartTs - rangeMap[safeRange];
      const previousAvgRes = await query<{ avg_count: number | null }>(avgSql, [route, previousStartTs]);
      const previousWindowAvgRes = await query<{ avg_count: number | null }>(
        `
        SELECT ROUND(AVG(vehicle_count))::int AS avg_count
        FROM vehicle_metrics_snapshots
        WHERE route_id = $1
          AND snapshot_ts >= $2
          AND snapshot_ts < $3
      `,
        [route, previousStartTs, currentStartTs]
      );
      previousAvg = previousWindowAvgRes.rows[0]?.avg_count ?? previousAvgRes.rows[0]?.avg_count ?? null;
      if (previousAvg != null) previousAvg = Number(previousAvg);
    }

    const delta = previousAvg == null ? null : currentAvg - previousAvg;
    const deltaPercent =
      previousAvg == null || previousAvg === 0 || delta == null
        ? null
        : Math.round((delta / previousAvg) * 100);

    const topRoutesRes = route === 'ALL'
      ? await query<{ route_id: string; vehicle_count: number }>(
          `
          SELECT route_id, ROUND(AVG(vehicle_count))::int AS vehicle_count
          FROM vehicle_metrics_snapshots
          WHERE route_id <> 'ALL'
            AND snapshot_ts >= $1
          GROUP BY route_id
          ORDER BY vehicle_count DESC
          LIMIT 5
        `,
          [currentStartTs]
        )
      : await query<{ route_id: string; vehicle_count: number }>(
          `
          SELECT route_id, ROUND(AVG(vehicle_count))::int AS vehicle_count
          FROM vehicle_metrics_snapshots
          WHERE route_id = $1
            AND snapshot_ts >= $2
          GROUP BY route_id
        `,
          [route, currentStartTs]
        );

    return {
      range: safeRange,
      compare: safeCompare,
      route,
      series,
      current_avg: currentAvg,
      previous_avg: previousAvg,
      delta,
      delta_percent: deltaPercent,
      top_routes: topRoutesRes.rows.map((r) => ({
        route_id: String(r.route_id),
        vehicle_count: Number(r.vehicle_count),
      })),
    };
  }

  static async pruneOldData(): Promise<number> {
    const sql = `
      DELETE FROM vehicle_positions 
      WHERE timestamp < (EXTRACT(EPOCH FROM NOW()) - 600)
    `;
    
    const result = await query(sql); 
    
    return result.rowCount || 0; 
  }
}