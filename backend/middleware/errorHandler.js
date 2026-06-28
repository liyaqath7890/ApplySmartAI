import config from '../config/index.js';

// Custom error class for operational errors
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler for async functions
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Global error handler
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.nodeEnv === 'development') {
    // Send detailed error in development
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } else {
    // Send sanitized error in production
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    } else {
      // Programming or unknown errors
      console.error('ERROR 💥:', err);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  }
};

// Handle JWT errors
export const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

export const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

// Handle duplicate field errors
export const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle validation errors
export const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Sequelize unique constraint error
export const handleSequelizeUniqueError = (err) => {
  const fields = Object.keys(err.fields).join(', ');
  const message = `Duplicate value for field(s): ${fields}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle Sequelize validation error
export const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Sequelize foreign key error
export const handleSequelizeForeignKeyError = () =>
  new AppError('Referenced record not found.', 400);

// Handle cast errors (invalid ID format)
export const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Handle file upload errors
export const handleMulterError = (err) => {
  return new AppError(`File upload error: ${err.message}`, 400);
};

// Not found handler
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};