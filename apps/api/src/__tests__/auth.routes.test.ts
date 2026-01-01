import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../db/connection.js', () => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      referral_code TEXT NOT NULL UNIQUE,
      referrer_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return { db };
});

vi.mock('../config/index.js', () => ({
  config: {
    jwtSecret: 'test-secret-key',
    frontendUrl: 'http://localhost:5173',
    isProduction: false,
  },
}));

import { authRoutes } from '../routes/auth.routes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { db } from '../db/connection.js';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {
  beforeEach(() => {
    db.exec('DELETE FROM users');
  });

  afterAll(() => {
    db.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should create a new user and return token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'newuser' })
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.token).toBeDefined();
      expect(response.body.isNewUser).toBe(true);
    });

    it('should login existing user', async () => {
      await request(app).post('/api/v1/auth/login').send({ username: 'existinguser' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'existinguser' })
        .expect(200);

      expect(response.body.user.username).toBe('existinguser');
      expect(response.body.isNewUser).toBe(false);
    });

    it('should reject invalid username', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'ab' })
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle referral code for new users', async () => {
      const referrer = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'referrer' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'referred',
          referralCode: referrer.body.user.referralCode,
        })
        .expect(201);

      expect(response.body.user.referrerId).toBe(referrer.body.user.id);
    });

    it('should reject non-existent referral code', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'newuser',
          referralCode: 'abcdef12345678901234567890abcdef',
        })
        .expect(400);

      expect(response.body.error).toBe('REFERRAL_CODE_NOT_FOUND');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(401);

      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return current user with valid token', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'authuser' });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(response.body.username).toBe('authuser');
    });
  });
});
