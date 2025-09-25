import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { query } from './config/database';
import { MtaService } from './services/mtaService'; // 👈 引入 Service

const app = express();

// --- 中间件配置 ---
app.use(helmet()); // 安全头
app.use(cors());   // 跨域
app.use(express.json()); // 解析 JSON
app.use(morgan('dev'));  // 日志

// --- 测试路由 ---
app.get('/health', async (req, res) => {
  try {
    // 尝试查询数据库时间，验证连接
    const result = await query('SELECT NOW() as now');
    res.json({ 
      status: 'UP', 
      db_time: result.rows[0].now,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'DOWN', error: 'Database connection failed' });
  }
});



// --- 启动服务器 ---
const startServer = async () => {
  try {
    await query('SELECT 1');
    console.log('✅ 数据库连接成功!');

    app.listen(env.PORT, () => {
      console.log(`\n🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    //启动定时抓取任务 (每 10 秒一次)
    console.log('⏱️ 初始化定时抓取任务...');
    setInterval(() => {
        MtaService.fetchAndSaveAllFeeds();
    }, 10000); 
    
    // 立即执行一次
    MtaService.fetchAndSaveAllFeeds();

  } catch (error) {
    // ...
  }
};

startServer();