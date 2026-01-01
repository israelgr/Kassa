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
  `);
  return { db };
});

import { userRepository } from '../repositories/user.repository.js';
import { db } from '../db/connection.js';

describe('userRepository', () => {
  beforeEach(() => {
    db.exec('DELETE FROM users');
  });

  afterAll(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a new user with generated referral code', () => {
      const user = userRepository.create('testuser');

      expect(user).toBeDefined();
      expect(user.id).toBeGreaterThan(0);
      expect(user.username).toBe('testuser');
      expect(user.referralCode).toHaveLength(32);
      expect(user.referrerId).toBeNull();
    });

    it('should create a user with a referrer', () => {
      const referrer = userRepository.create('referrer');
      const referred = userRepository.create('referred', referrer.id);

      expect(referred.referrerId).toBe(referrer.id);
    });

    it('should normalize username to lowercase', () => {
      const user = userRepository.create('TestUser');

      expect(user.username).toBe('testuser');
    });
  });

  describe('findById', () => {
    it('should find user by id', () => {
      const created = userRepository.create('findbyid');
      const found = userRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.username).toBe('findbyid');
    });

    it('should return null for non-existent id', () => {
      const found = userRepository.findById(99999);

      expect(found).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username case-insensitively', () => {
      userRepository.create('searchuser');

      const found = userRepository.findByUsername('SEARCHUSER');

      expect(found).toBeDefined();
      expect(found?.username).toBe('searchuser');
    });

    it('should return null for non-existent username', () => {
      const found = userRepository.findByUsername('nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('findByReferralCode', () => {
    it('should find user by referral code', () => {
      const created = userRepository.create('refcodeuser');
      const found = userRepository.findByReferralCode(created.referralCode);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for invalid referral code', () => {
      const found = userRepository.findByReferralCode('invalidcode');

      expect(found).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing username', () => {
      userRepository.create('existsuser');

      expect(userRepository.exists('existsuser')).toBe(true);
      expect(userRepository.exists('EXISTSUSER')).toBe(true);
    });

    it('should return false for non-existent username', () => {
      expect(userRepository.exists('nonexistent')).toBe(false);
    });
  });

  describe('getReferrer', () => {
    it('should return referrer for referred user', () => {
      const referrer = userRepository.create('parentuser');
      const referred = userRepository.create('childuser', referrer.id);

      const result = userRepository.getReferrer(referred.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(referrer.id);
      expect(result?.username).toBe('parentuser');
    });

    it('should return null for user without referrer', () => {
      const user = userRepository.create('noreferrer');
      const result = userRepository.getReferrer(user.id);

      expect(result).toBeNull();
    });
  });
});
