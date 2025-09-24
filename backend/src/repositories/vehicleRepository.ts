import { query } from '../config/database';
import pool from '../config/database';
import { VehiclePositionRow } from '../models/Vehicle'; 

export class VehicleRepository {
  
  static async findAll(): Promise<VehiclePositionRow[]> {
    const sql = `
      SELECT * FROM vehicle_positions 
      WHERE timestamp > (EXTRACT(EPOCH FROM NOW()) - 300)
      ORDER BY route_id ASC
    `;
    
    const result = await query<VehiclePositionRow>(sql);
    
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

  static async pruneOldData(): Promise<number> {
    const sql = `
      DELETE FROM vehicle_positions 
      WHERE timestamp < (EXTRACT(EPOCH FROM NOW()) - 600)
    `;
    
    const result = await query(sql); 
    
    return result.rowCount || 0; 
  }
}