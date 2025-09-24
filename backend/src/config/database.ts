import { Pool, QueryResult, QueryResultRow } from 'pg'; // 👈 必须引入 QueryResultRow
import { env } from './env';

const pool = new Pool({
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected Error on Idle Client', err);
  process.exit(-1);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`⚠️ Slow Query (${duration}ms): ${text}`);
    }
    
    return res;
  } catch (error) {
    console.error(`❌ Query Error: ${text}`, error);
    throw error;
  }
};

export default pool;