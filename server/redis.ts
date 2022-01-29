import Redis from 'ioredis';

export const redis = new Redis(6379, process.env.REDIS_URL, { password: 'ZEIFOzefRA240249dfgoj' });
