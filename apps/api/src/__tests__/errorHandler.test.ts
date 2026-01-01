import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../config/index.js', () => ({
  config: {
    isProduction: false,
  },
}));

import { AppError, errorHandler } from '../middleware/errorHandler.js';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create error with statusCode, code, and message', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });

    it('should set name to AppError', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input');
      expect(error.name).toBe('AppError');
    });

    it('should be instanceof Error', () => {
      const error = new AppError(500, 'ERROR', 'Something went wrong');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('errorHandler middleware', () => {
    let app: express.Application;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      app = express();
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should handle AppError with correct status and response', async () => {
      app.get('/app-error', () => {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      });
      app.use(errorHandler);

      const response = await request(app).get('/app-error').expect(404);

      expect(response.body.error).toBe('NOT_FOUND');
      expect(response.body.message).toBe('User not found');
    });

    it('should handle UNIQUE constraint failed as 409 Conflict', async () => {
      app.get('/unique-error', () => {
        throw new Error('UNIQUE constraint failed: users.username');
      });
      app.use(errorHandler);

      const response = await request(app).get('/unique-error').expect(409);

      expect(response.body.error).toBe('CONFLICT');
      expect(response.body.message).toBe('Resource already exists');
    });

    it('should handle FOREIGN KEY constraint failed as 400', async () => {
      app.get('/fk-error', () => {
        throw new Error('FOREIGN KEY constraint failed');
      });
      app.use(errorHandler);

      const response = await request(app).get('/fk-error').expect(400);

      expect(response.body.error).toBe('INVALID_REFERENCE');
      expect(response.body.message).toBe('Referenced resource does not exist');
    });

    it('should handle generic errors as 500 in development (show message)', async () => {
      app.get('/generic-error', () => {
        throw new Error('Something unexpected happened');
      });
      app.use(errorHandler);

      const response = await request(app).get('/generic-error').expect(500);

      expect(response.body.error).toBe('INTERNAL_ERROR');
      expect(response.body.message).toBe('Something unexpected happened');
    });

    it('should log errors to console', async () => {
      app.get('/log-error', () => {
        throw new Error('Test error for logging');
      });
      app.use(errorHandler);

      await request(app).get('/log-error');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle different AppError status codes', async () => {
      app.get('/bad-request', () => {
        throw new AppError(400, 'BAD_REQUEST', 'Invalid data');
      });
      app.get('/forbidden', () => {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      });
      app.use(errorHandler);

      const badRequestRes = await request(app).get('/bad-request').expect(400);
      expect(badRequestRes.body.error).toBe('BAD_REQUEST');

      const forbiddenRes = await request(app).get('/forbidden').expect(403);
      expect(forbiddenRes.body.error).toBe('FORBIDDEN');
    });
  });

  describe('errorHandler in production mode', () => {
    it('should hide error message in production', async () => {
      vi.resetModules();
      vi.doMock('../config/index.js', () => ({
        config: {
          isProduction: true,
        },
      }));

      const { errorHandler: prodErrorHandler } = await import('../middleware/errorHandler.js');

      const prodApp = express();
      vi.spyOn(console, 'error').mockImplementation(() => {});

      prodApp.get('/prod-error', () => {
        throw new Error('Sensitive internal error details');
      });
      prodApp.use(prodErrorHandler);

      const response = await request(prodApp).get('/prod-error').expect(500);

      expect(response.body.message).toBe('An unexpected error occurred');
    });
  });
});
