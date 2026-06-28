import sequelize from '../config/database.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import os from 'os';

/**
 * Comprehensive Health Check Middleware
 * Provides detailed system health information
 */

// Cache health status to avoid overwhelming checks
let healthCache = null;
let lastHealthCheck = 0;
const CACHE_TTL = 10000; // 10 seconds

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    await sequelize.authenticate();
    return { status: 'healthy', responseTime: null };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
  try {
    // Simple Redis check using native module
    const redis = await import('redis');
    const client = redis.createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
      password: config.redis.password || undefined
    });
    
    await client.connect();
    const start = Date.now();
    await client.ping();
    const responseTime = Date.now() - start;
    await client.quit();
    
    return { status: 'healthy', responseTime };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

/**
 * Check memory usage
 */
function checkMemory() {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  return {
    status: heapUsedPercent < 90 ? 'healthy' : 'warning',
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    heapUsedPercent: Math.round(heapUsedPercent * 100) / 100
  };
}

/**
 * Check uptime
 */
function checkUptime() {
  return {
    status: 'healthy',
    processUptime: process.uptime(),
    systemUptime: os.uptime()
  };
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  const required = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER'];
  const missing = required.filter(key => !process.env[key]);
  
  return {
    status: missing.length === 0 ? 'healthy' : 'warning',
    nodeEnv: config.nodeEnv,
    missingEnvVars: missing,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasEmailConfig: !!(config.email?.host && config.email?.user),
    hasRedis: !!(config.redis?.host)
  };
}

/**
 * Get comprehensive health status
 */
export async function getHealthStatus(force = false) {
  const now = Date.now();
  
  // Return cached result if available and not expired
  if (!force && healthCache && (now - lastHealthCheck) < CACHE_TTL) {
    return healthCache;
  }
  
  const startTime = Date.now();
  
  // Run all health checks in parallel
  const [db, redis, memory, uptime, env] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkUptime()),
    Promise.resolve(checkEnvironment())
  ]);
  
  // Determine overall status
  const checks = {
    database: db.status === 'fulfilled' ? db.value : { status: 'error', error: 'Check failed' },
    redis: redis.status === 'fulfilled' ? redis.value : { status: 'error', error: 'Check failed' },
    memory: memory.status === 'fulfilled' ? memory.value : { status: 'error' },
    uptime: uptime.status === 'fulfilled' ? uptime.value : { status: 'error' },
    environment: env.status === 'fulfilled' ? env.value : { status: 'error' }
  };
  
  const overallStatus = Object.values(checks).every(c => c.status === 'healthy') 
    ? 'healthy' 
    : Object.values(checks).some(c => c.status === 'unhealthy') 
      ? 'unhealthy' 
      : 'degraded';
  
  const healthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks,
    responseTime: Date.now() - startTime
  };
  
  // Update cache
  healthCache = healthStatus;
  lastHealthCheck = now;
  
  return healthStatus;
}

/**
 * Health check middleware
 */
export const healthCheck = async (req, res) => {
  try {
    const force = req.query.detailed === 'true';
    const health = await getHealthStatus(force);
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};

/**
 * Readiness check (for Kubernetes)
 */
export const readinessCheck = async (req, res) => {
  try {
    const health = await getHealthStatus();
    
    // Service is ready if database is healthy
    const isReady = health.checks.database?.status === 'healthy';
    
    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'Database not available' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
};

/**
 * Liveness check (for Kubernetes)
 */
export const livenessCheck = (req, res) => {
  // Simple check - if the process is running, it's alive
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
};

/**
 * Startup check - verify all critical services before starting
 */
export async function startupCheck() {
  logger.info('Running startup health checks...');
  
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkEnvironment()
  ]);
  
  const results = {
    database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error' },
    environment: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error' }
  };
  
  const criticalFailures = Object.values(results).filter(r => r.status === 'unhealthy');
  
  if (criticalFailures.length > 0) {
    logger.error('Critical startup checks failed:', results);
    return false;
  }
  
  logger.info('Startup health checks passed');
  return true;
}

export default {
  healthCheck,
  readinessCheck,
  livenessCheck,
  getHealthStatus,
  startupCheck
};