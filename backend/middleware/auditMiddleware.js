import AuditLogService from '../services/AuditLogService.js';
import logger from '../utils/logger.js';

/**
 * HTTP Audit Logging Middleware.
 *
 * Attaches to the response `finish` event so it runs after the handler
 * has sent its response — no latency impact on the request path.
 *
 * Skips: health/metrics endpoints, static file requests.
 *
 * Usage:
 *   app.use(auditMiddleware);
 *   // or selectively:
 *   router.post('/sensitive', protect, auditMiddleware, handler);
 */
export const auditMiddleware = (req, res, next) => {
  // Skip health, static, and preflight
  const skip = ['/api/health', '/api/metrics', '/uploads', '/favicon'];
  if (skip.some(p => req.path.startsWith(p)) || req.method === 'OPTIONS') {
    return next();
  }

  const startTime = Date.now();

  // Capture response body for audit (only for write operations)
  const isWriteOp = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;

      await AuditLogService.logAPIRequest({
        endpoint:     req.path,
        method:       req.method,
        userId:       req.user?.id || null,
        requestBody:  isWriteOp ? sanitizeBody(req.body) : undefined,
        responseBody: undefined, // avoid capturing full response
        statusCode:   res.statusCode,
        ipAddress:    req.ip || req.connection?.remoteAddress,
        userAgent:    req.headers['user-agent'],
        duration,
      });
    } catch (err) {
      // Never let audit logging break the app
      logger.warn(`Audit log write failed: ${err.message}`);
    }
  });

  next();
};

/**
 * Remove sensitive fields from request body before logging.
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const SENSITIVE = ['password', 'token', 'secret', 'apiKey', 'creditCard',
                     'cardNumber', 'cvv', 'ssn', 'twoFactorSecret'];
  const sanitised = { ...body };

  for (const field of SENSITIVE) {
    if (sanitised[field] !== undefined) {
      sanitised[field] = '[REDACTED]';
    }
  }

  return sanitised;
}

export default auditMiddleware;
