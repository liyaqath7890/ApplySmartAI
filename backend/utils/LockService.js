import IORedis from 'ioredis';
import config from '../config/index.js';
import logger from './logger.js';

class LockService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      const tempClient = new IORedis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
      });

      // Suppress unhandled error events during check
      tempClient.on('error', () => {});

      await tempClient.connect();
      await tempClient.ping();

      // Successful connection: configure for lock operations
      tempClient.options.maxRetriesPerRequest = null;
      this.client = tempClient;
      this.initialized = true;
      logger.info('LockService Redis connection initialized');
    } catch (err) {
      logger.warn(`LockService failed to initialize Redis: ${err.message}. Using in-memory locking fallback.`);
      this.client = null;
      this.initialized = true; // Mark initialized to prevent repeated connection attempts
    }
  }

  /**
   * Acquire a distributed lock.
   * @param {string} resource - Name of the resource/lock
   * @param {number} ttlMs - Time-to-live in milliseconds
   * @returns {Promise<boolean>} True if lock was successfully acquired
   */
  async acquire(resource, ttlMs = 30000) {
    if (!this.initialized) {
      await this.init();
    }
    if (!this.client) {
      return true; // Fallback: allow progress if Redis is not available
    }

    const lockKey = `lock:${resource}`;
    const value = Date.now() + ttlMs;

    try {
      // SET with PX and NX ensures atomicity
      const result = await this.client.set(lockKey, value, 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (err) {
      logger.error(`Error acquiring lock for "${resource}": ${err.message}`);
      return true; // Fallback
    }
  }

  /**
   * Release a distributed lock.
   * @param {string} resource - Name of the resource/lock
   */
  async release(resource) {
    if (!this.client) return;

    const lockKey = `lock:${resource}`;
    try {
      await this.client.del(lockKey);
    } catch (err) {
      logger.error(`Error releasing lock for "${resource}": ${err.message}`);
    }
  }
}

export default new LockService();
