import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  // Handle SQLite constraint errors
  if (err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({
      error: 'CONFLICT',
      message: 'Resource already exists',
    });
    return;
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    res.status(400).json({
      error: 'INVALID_REFERENCE',
      message: 'Referenced resource does not exist',
    });
    return;
  }

  // Generic error response
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: config.isProduction ? 'An unexpected error occurred' : err.message,
  });
}
