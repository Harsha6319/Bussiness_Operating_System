import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate record already exists';
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  const response = {
    success: false,
    message
  };

  if (error.details) response.details = error.details;
  if (process.env.NODE_ENV !== 'production') response.stack = error.stack;

  res.status(statusCode).json(response);
}
