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

    CREATE TABLE IF NOT EXISTS vehicle_metrics_snapshots (
      snapshot_ts BIGINT NOT NULL,
      route_id VARCHAR(50) NOT NULL,
      vehicle_count INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (snapshot_ts, route_id)
    );

    CREATE INDEX IF NOT EXISTS idx_vehicle_metrics_route_ts
      ON vehicle_metrics_snapshots(route_id, snapshot_ts DESC);

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

    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT TRUE;

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alert_id VARCHAR(255) NOT NULL REFERENCES service_alerts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT,
      effect_text VARCHAR(100),
      is_read BOOLEAN DEFAULT FALSE,
      email_sent BOOLEAN DEFAULT FALSE,
      webpush_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      read_at TIMESTAMP,
      UNIQUE (user_id, alert_id)
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_alert ON notifications(alert_id);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
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