/**
 * Error Handling Utilities
 * Standardizes error handling across all API endpoints
 * Replaces 7 different error handling patterns found in server.js
 */

/**
 * Custom application error class with HTTP status code
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper for Express routes
 * Automatically catches errors and passes to error middleware
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware
 * Provides consistent error responses across all endpoints
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorMiddleware(err, req, res, next) {
  // Determine status code
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log error details for debugging
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    message: err.message,
    stack: err.stack,
    statusCode
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Not Found handler
 * Use as a catch-all route handler
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

module.exports = {
  AppError,
  asyncHandler,
  errorMiddleware,
  notFoundHandler
};
