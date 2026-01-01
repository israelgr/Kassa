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

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL CHECK(amount >= 1),
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
import { donationRoutes } from '../routes/donation.routes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { db } from '../db/connection.js';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use(errorHandler);

describe('Donation Routes', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    db.exec('DELETE FROM donations');
    db.exec('DELETE FROM users');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser' });

    authToken = response.body.token;
    userId = response.body.user.id;
  });

  afterAll(() => {
    db.close();
  });

  describe('POST /api/v1/donations', () => {
    it('should create a donation', async () => {
      const response = await request(app)
        .post('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 50 })
        .expect(201);

      expect(response.body.amount).toBe(50);
      expect(response.body.userId).toBe(userId);
    });

    it('should reject donation below minimum', async () => {
      const response = await request(app)
        .post('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 0.5 })
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      await request(app).post('/api/v1/donations').send({ amount: 50 }).expect(401);
    });
  });

  describe('GET /api/v1/donations', () => {
    it('should return user donations with pagination', async () => {
      await request(app)
        .post('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 10 });

      await request(app)
        .post('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 20 });

      const response = await request(app)
        .get('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.donations).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should return empty list for new user', async () => {
      const response = await request(app)
        .get('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.donations).toHaveLength(0);
    });
  });

  describe('GET /api/v1/donations/summary', () => {
    it('should return donation summary', async () => {
      await request(app)
        .post('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 25 });

      await request(app)
        .post('/api/v1/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 75 });

      const response = await request(app)
        .get('/api/v1/donations/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalDonated).toBe(100);
      expect(response.body.donationCount).toBe(2);
    });
  });
});
