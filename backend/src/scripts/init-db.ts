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

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS favorite_routes (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      route_id VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, route_id)
    );

    CREATE TABLE IF NOT EXISTS favorite_stops (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stop_id VARCHAR(50) NOT NULL,
      stop_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, stop_id)
    );

    CREATE TABLE IF NOT EXISTS service_alerts (
      id VARCHAR(255) PRIMARY KEY,
      header_text TEXT,
      description_text TEXT,
      effect_text VARCHAR(100),
      cause_text VARCHAR(100),
      route_ids TEXT[] DEFAULT '{}',
      stop_ids TEXT[] DEFAULT '{}',
      updated_at BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_favorite_routes_user ON favorite_routes(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorite_stops_user ON favorite_stops(user_id);
    CREATE INDEX IF NOT EXISTS idx_service_alerts_updated ON service_alerts(updated_at DESC);
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