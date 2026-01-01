import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateBody, validateQuery } from '../middleware/validation.js';

describe('Validation Middleware', () => {
  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string().min(3, 'Name must be at least 3 characters'),
      age: z.number().positive('Age must be positive'),
    });

    const app = express();
    app.use(express.json());
    app.post('/test', validateBody(testSchema), (req, res) => {
      res.json({ received: req.body });
    });

    it('should pass valid body to next middleware', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'John', age: 25 })
        .expect(200);

      expect(response.body.received).toEqual({ name: 'John', age: 25 });
    });

    it('should parse and transform body according to schema', async () => {
      const numericSchema = z.object({
        value: z.coerce.number(),
      });

      const transformApp = express();
      transformApp.use(express.json());
      transformApp.post('/transform', validateBody(numericSchema), (req, res) => {
        res.json({ value: req.body.value, type: typeof req.body.value });
      });

      const response = await request(transformApp)
        .post('/transform')
        .send({ value: '42' })
        .expect(200);

      expect(response.body.value).toBe(42);
      expect(response.body.type).toBe('number');
    });

    it('should return 400 for invalid body', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Jo', age: -5 })
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.message).toBe('Invalid request body');
    });

    it('should include field-level error details', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Jo', age: -5 })
        .expect(400);

      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);

      const nameError = response.body.details.find((d: { field: string }) => d.field === 'name');
      const ageError = response.body.details.find((d: { field: string }) => d.field === 'age');

      expect(nameError?.message).toBe('Name must be at least 3 characters');
      expect(ageError?.message).toBe('Age must be positive');
    });

    it('should handle nested validation errors', async () => {
      const nestedSchema = z.object({
        user: z.object({
          email: z.string().email('Invalid email'),
        }),
      });

      const nestedApp = express();
      nestedApp.use(express.json());
      nestedApp.post('/nested', validateBody(nestedSchema), (req, res) => {
        res.json(req.body);
      });

      const response = await request(nestedApp)
        .post('/nested')
        .send({ user: { email: 'invalid' } })
        .expect(400);

      const emailError = response.body.details.find(
        (d: { field: string }) => d.field === 'user.email'
      );
      expect(emailError).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app).post('/test').send({}).expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.length).toBeGreaterThan(0);
    });
  });

  describe('validateQuery', () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    });

    const app = express();
    app.get('/items', validateQuery(querySchema), (req, res) => {
      res.json({ page: req.query.page, limit: req.query.limit });
    });

    it('should pass valid query params to next middleware', async () => {
      const response = await request(app).get('/items?page=2&limit=50').expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(50);
    });

    it('should parse and transform query according to schema', async () => {
      const response = await request(app).get('/items?page=3&limit=25').expect(200);

      expect(typeof response.body.page).toBe('number');
      expect(typeof response.body.limit).toBe('number');
    });

    it('should return 400 for invalid query params', async () => {
      const response = await request(app).get('/items?page=-1&limit=200').expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.message).toBe('Invalid query parameters');
    });

    it('should include field-level error details for query', async () => {
      const response = await request(app).get('/items?page=0&limit=200').expect(400);

      expect(response.body.details).toBeDefined();
      const pageError = response.body.details.find((d: { field: string }) => d.field === 'page');
      const limitError = response.body.details.find((d: { field: string }) => d.field === 'limit');

      expect(pageError || limitError).toBeTruthy();
    });

    it('should use default values when params not provided', async () => {
      const response = await request(app).get('/items').expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(20);
    });
  });
});
