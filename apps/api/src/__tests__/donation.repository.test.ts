import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

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

import { donationRepository } from '../repositories/donation.repository.js';
import { db } from '../db/connection.js';

describe('donationRepository', () => {
  let testUserId: number;

  beforeEach(() => {
    db.exec('DELETE FROM donations');
    db.exec('DELETE FROM users');

    const result = db
      .prepare(
        `INSERT INTO users (username, referral_code)
         VALUES (?, ?)
         RETURNING id`
      )
      .get('testuser', 'abc123') as { id: number };
    testUserId = result.id;
  });

  afterAll(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a donation', () => {
      const donation = donationRepository.create(testUserId, 50);

      expect(donation).toBeDefined();
      expect(donation.id).toBeGreaterThan(0);
      expect(donation.userId).toBe(testUserId);
      expect(donation.amount).toBe(50);
      expect(donation.createdAt).toBeDefined();
    });

    it('should create multiple donations', () => {
      donationRepository.create(testUserId, 10);
      donationRepository.create(testUserId, 20);
      donationRepository.create(testUserId, 30);

      const { donations, total } = donationRepository.findByUserId(testUserId);

      expect(total).toBe(3);
      expect(donations).toHaveLength(3);
    });
  });

  describe('findByUserId', () => {
    it('should return paginated donations', () => {
      donationRepository.create(testUserId, 10);
      donationRepository.create(testUserId, 20);
      donationRepository.create(testUserId, 30);

      const { donations, total } = donationRepository.findByUserId(testUserId, 1, 2);

      expect(total).toBe(3);
      expect(donations).toHaveLength(2);
    });

    it('should return empty array for user with no donations', () => {
      const { donations, total } = donationRepository.findByUserId(testUserId);

      expect(total).toBe(0);
      expect(donations).toHaveLength(0);
    });

    it('should handle pagination correctly', () => {
      for (let i = 1; i <= 5; i++) {
        donationRepository.create(testUserId, i * 10);
      }

      const page1 = donationRepository.findByUserId(testUserId, 1, 2);
      const page2 = donationRepository.findByUserId(testUserId, 2, 2);
      const page3 = donationRepository.findByUserId(testUserId, 3, 2);

      expect(page1.donations).toHaveLength(2);
      expect(page2.donations).toHaveLength(2);
      expect(page3.donations).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    it('should return correct summary for donations', () => {
      donationRepository.create(testUserId, 10);
      donationRepository.create(testUserId, 20);
      donationRepository.create(testUserId, 30);

      const summary = donationRepository.getSummary(testUserId);

      expect(summary.totalDonated).toBe(60);
      expect(summary.donationCount).toBe(3);
      expect(summary.firstDonation).toBeDefined();
      expect(summary.lastDonation).toBeDefined();
    });

    it('should return zero summary for user with no donations', () => {
      const summary = donationRepository.getSummary(testUserId);

      expect(summary.totalDonated).toBe(0);
      expect(summary.donationCount).toBe(0);
    });
  });

  describe('getTotalByUserId', () => {
    it('should return total amount donated', () => {
      donationRepository.create(testUserId, 25);
      donationRepository.create(testUserId, 75);

      const total = donationRepository.getTotalByUserId(testUserId);

      expect(total).toBe(100);
    });

    it('should return 0 for user with no donations', () => {
      const total = donationRepository.getTotalByUserId(testUserId);

      expect(total).toBe(0);
    });
  });
});
