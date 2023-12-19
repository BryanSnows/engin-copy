import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
      port: parseInt(process.env.REDIS_PORT),
    });

    this.client.on('error', (err) => {
      console.error('Error connecting to Redis:', err);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.client.get(key);
      return result;
    } catch (error) {
      throw new Error('Error fetching value from Redis: ' + error);
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (error) {
      throw new Error('Error setting value in Redis: ' + error);
    }
  }

  async del(key: string): Promise<number> {
    try {
      const result = await this.client.del(key);
      return result;
    } catch (error) {
      throw new Error('Error deleting key from Redis: ' + error);
    }
  }

  async hget(hash: string, field: string): Promise<string | null> {
    try {
      const result = await this.client.hget(hash, field);
      return result;
    } catch (error) {
      throw new Error('Error fetching value from Redis hash: ' + error);
    }
  }

  async hgetall(hash: string): Promise<{ [field: string]: string }> {
    try {
      const result = await this.client.hgetall(hash);
      return result;
    } catch (error) {
      throw new Error('Error fetching values from Redis hash: ' + error);
    }
  }
  async hkeys(hash: string): Promise<string[]> {
    try {
      const result = await this.client.hkeys(hash);
      return result;
    } catch (error) {
      throw new Error('Error fetching hash keys from Redis: ' + error);
    }
  }
}
