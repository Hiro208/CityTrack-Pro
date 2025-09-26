import { createClient } from 'redis';
import { env } from './env';

const redisClient = createClient({
    url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Connected!'));

// 立即连接
(async () => {
    await redisClient.connect();
})();

export default redisClient;