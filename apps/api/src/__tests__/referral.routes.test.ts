import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../config/index.js', () => ({
  config: {
    jwtSecret: 'test-secret-key',
    frontendUrl: 'http://localhost:5173',
    isProduction: false,
  },
}));

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
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL CHECK (amount >= 1.00),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return { db };
});

import { referralRoutes } from '../routes/referral.routes.js';
import { authRoutes } from '../routes/auth.routes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { db } from '../db/connection.js';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use(errorHandler);

describe('Referral Routes', () => {
  let authToken: string;
  let userId: number;
  let referralCode: string;

  beforeEach(async () => {
    db.exec('DELETE FROM donations');
    db.exec('DELETE FROM users');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser' });

    authToken = response.body.token;
    userId = response.body.user.id;
    referralCode = response.body.user.referralCode;
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /api/v1/referrals/link', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/referrals/link').expect(401);

      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return referral code and URL for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/referrals/link')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.referralCode).toBe(referralCode);
      expect(response.body.referralUrl).toBe(`http://localhost:5173?ref=${referralCode}`);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/referrals/link')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('INVALID_TOKEN');
    });
  });

  describe('GET /api/v1/referrals/stats', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/referrals/stats').expect(401);

      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should return stats for user with no referrals', async () => {
      const response = await request(app)
        .get('/api/v1/referrals/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.referrer).toBeNull();
      expect(response.body.totalDescendants).toBe(0);
      expect(response.body.totalDescendantDonations).toBe(0);
      expect(response.body.levelBreakdown).toEqual([]);
    });

    it('should return correct stats for user with direct referrals', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'referred1', referralCode });
      await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'referred2', referralCode });

      const response = await request(app)
        .get('/api/v1/referrals/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalDescendants).toBe(2);
      expect(response.body.levelBreakdown).toHaveLength(1);
      expect(response.body.levelBreakdown[0].level).toBe(1);
      expect(response.body.levelBreakdown[0].userCount).toBe(2);
    });

    it('should include referrer info when user was referred', async () => {
      const referredResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'referred', referralCode });

      const response = await request(app)
        .get('/api/v1/referrals/stats')
        .set('Authorization', `Bearer ${referredResponse.body.token}`)
        .expect(200);

      expect(response.body.referrer).toEqual({ id: userId, username: 'testuser' });
    });
  });
});
