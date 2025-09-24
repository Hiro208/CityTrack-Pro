// src/scripts/init-db.ts
import { query } from '../config/database';
import pool from '../config/database';

const initDb = async () => {
  console.log('🏗️  正在初始化数据库 Schema...');

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS vehicle_positions (
      trip_id VARCHAR(255) PRIMARY KEY,
      route_id VARCHAR(50) NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,
      timestamp BIGINT NOT NULL,
      stop_name VARCHAR(255),
      current_status VARCHAR(50),
      direction VARCHAR(50),
      destination VARCHAR(255),
      consist VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_vehicle_route ON vehicle_positions(route_id);
    
    CREATE INDEX IF NOT EXISTS idx_vehicle_timestamp ON vehicle_positions(timestamp);
  `;

  try {
    await query(createTableQuery);
    console.log('✅ 数据库表结构创建成功！');
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  } finally {

    await pool.end();
  }
};

initDb();