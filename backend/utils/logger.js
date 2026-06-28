import winston from 'winston';
import config from '../config/index.js';

/**
 * Winston Logger Configuration
 * Provides structured logging for the application
 */
const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, service, ...meta }) => {
  const serviceTag = service ? `[${service}] ` : '';
  return `${timestamp} ${level}: ${serviceTag}${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

// Custom format for file output (JSON)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging?.level || 'info',
  format: fileFormat,
  defaultMeta: { service: 'ai-job-agent' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Don't exit on handled exceptions
  exitOnError: false
});

// Create a stream object for Morgan (HTTP request logging)
const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

/**
 * Log levels:
 * - error: Application errors, exceptions
 * - warn: Warning conditions, deprecated features
 * - info: General information, startup, shutdown
 * - http: HTTP requests
 * - verbose: Detailed debugging information
 * - debug: Debug-level messages
 * - silly: Very detailed debugging
 */

// Add HTTP logging helper
logger.httpRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
};

// Add job aggregation logging helper
logger.jobAggregation = (provider, count, duration) => {
  logger.info(`Job Aggregation: ${provider} - ${count} jobs fetched in ${duration}ms`);
};

// Add security event logging
logger.securityEvent = (event, details) => {
  logger.warn(`Security Event: ${event}`, details);
};

export { stream };
export default logger;