import dotenv from 'dotenv';
import { z } from 'zod';

// 1. 加载 .env 文件
dotenv.config();

// 2. 定义校验规则 (Schema)
const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // 数据库配置
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string().transform((val) => parseInt(val, 10)), 
  
  //Redis 配置校验
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
});

// 解析并导出
const envProcess = envSchema.safeParse(process.env);

if (!envProcess.success) {
  console.error('❌ 致命错误: 环境变量校验失败!', envProcess.error.format());
  process.exit(1);
}

export const env = envProcess.data;