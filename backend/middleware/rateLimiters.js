/**
 * Rate Limiters
 *
 * Configures express-rate-limit instances for different API surfaces.
 * All limiters use memory store (default) — swap for Redis store in production
 * clusters using `rate-limit-redis`.
 */

import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const onLimitReached = (req, res) => {
  logger.warn(`Rate limit exceeded: ${req.ip} → ${req.path}`);
};

/**
 * Global API limiter — applied to /api/*
 * Configured from env vars (matches existing server.js setup).
 */
export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  handler: (req, res, next, options) => {
    onLimitReached(req, res);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Auth limiter — stricter limits for login / register / refresh.
 * Prevents brute-force password attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      20,               // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  handler: (req, res, next, options) => {
    logger.securityEvent('auth_rate_limit', { ip: req.ip, path: req.path });
    res.status(options.statusCode).json(options.message);
  },
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Job aggregation limiter — prevents API key exhaustion.
 * Aggregation can be expensive so limit to 10 req/min per user.
 */
export const aggregationLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip, // Per-user, not per-IP
  message: { success: false, message: 'Aggregation rate limit exceeded. Please wait 1 minute.' },
});

/**
 * File upload limiter — prevent upload spam.
 * 20 uploads per 10 minutes per user.
 */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max:      20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Upload rate limit exceeded. Please wait.' },
});

export default { globalLimiter, authLimiter, aggregationLimiter, uploadLimiter };
