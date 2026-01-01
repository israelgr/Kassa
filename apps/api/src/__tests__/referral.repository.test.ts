import { describe, it, expect, beforeEach, afterAll, vi, beforeAll } from 'vitest';
import Database from 'better-sqlite3';

let mockDb: ReturnType<typeof Database>;

beforeAll(() => {
  mockDb = new Database(':memory:');
  mockDb.pragma('foreign_keys = ON');
  mockDb.exec(`
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
});

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

import { referralRepository } from '../repositories/referral.repository.js';
import { db } from '../db/connection.js';

function createUser(username: string, referrerId: number | null = null): number {
  const result = db
    .prepare('INSERT INTO users (username, referral_code, referrer_id) VALUES (?, ?, ?) RETURNING id')
    .get(username, `code_${username}`, referrerId) as { id: number };
  return result.id;
}

function createDonation(userId: number, amount: number): void {
  db.prepare('INSERT INTO donations (user_id, amount) VALUES (?, ?)').run(userId, amount);
}

describe('referralRepository', () => {
  beforeEach(() => {
    db.exec('DELETE FROM donations');
    db.exec('DELETE FROM users');
  });

  afterAll(() => {
    db.close();
  });

  describe('getLevelBreakdown', () => {
    it('should return empty array for user with no referrals', () => {
      const userId = createUser('root');
      const breakdown = referralRepository.getLevelBreakdown(userId);
      expect(breakdown).toEqual([]);
    });

    it('should return level 1 breakdown for direct referrals only', () => {
      const rootId = createUser('root');
      createUser('child1', rootId);
      createUser('child2', rootId);

      const breakdown = referralRepository.getLevelBreakdown(rootId);
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0]).toEqual({ level: 1, userCount: 2, totalDonated: 0 });
    });

    it('should return multi-level breakdown for deep referral tree', () => {
      const rootId = createUser('root');
      const child1Id = createUser('child1', rootId);
      const child2Id = createUser('child2', rootId);
      createUser('grandchild1', child1Id);
      createUser('grandchild2', child1Id);
      createUser('grandchild3', child2Id);

      const breakdown = referralRepository.getLevelBreakdown(rootId);
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0]).toEqual({ level: 1, userCount: 2, totalDonated: 0 });
      expect(breakdown[1]).toEqual({ level: 2, userCount: 3, totalDonated: 0 });
    });

    it('should correctly sum donations at each level', () => {
      const rootId = createUser('root');
      const child1Id = createUser('child1', rootId);
      const child2Id = createUser('child2', rootId);
      const grandchildId = createUser('grandchild', child1Id);

      createDonation(child1Id, 50);
      createDonation(child2Id, 30);
      createDonation(grandchildId, 20);
      createDonation(grandchildId, 10);

      const breakdown = referralRepository.getLevelBreakdown(rootId);
      expect(breakdown[0]).toEqual({ level: 1, userCount: 2, totalDonated: 80 });
      expect(breakdown[1]).toEqual({ level: 2, userCount: 1, totalDonated: 30 });
    });

    it('should handle referral tree with no donations', () => {
      const rootId = createUser('root');
      const childId = createUser('child', rootId);
      createUser('grandchild', childId);

      const breakdown = referralRepository.getLevelBreakdown(rootId);
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].totalDonated).toBe(0);
      expect(breakdown[1].totalDonated).toBe(0);
    });

    it('should handle three levels deep', () => {
      const rootId = createUser('root');
      const level1Id = createUser('level1', rootId);
      const level2Id = createUser('level2', level1Id);
      createUser('level3', level2Id);

      const breakdown = referralRepository.getLevelBreakdown(rootId);
      expect(breakdown).toHaveLength(3);
      expect(breakdown.map((b) => b.level)).toEqual([1, 2, 3]);
    });
  });

  describe('getTotalStats', () => {
    it('should return zeros for user with no descendants', () => {
      const userId = createUser('lonely');
      const stats = referralRepository.getTotalStats(userId);
      expect(stats).toEqual({ totalDescendants: 0, totalDonations: 0 });
    });

    it('should count all descendants across all levels', () => {
      const rootId = createUser('root');
      const childId = createUser('child', rootId);
      createUser('grandchild1', childId);
      createUser('grandchild2', childId);

      const stats = referralRepository.getTotalStats(rootId);
      expect(stats.totalDescendants).toBe(3);
    });

    it('should sum all donations from all descendants', () => {
      const rootId = createUser('root');
      const childId = createUser('child', rootId);
      const grandchildId = createUser('grandchild', childId);

      createDonation(childId, 100);
      createDonation(grandchildId, 50);
      createDonation(grandchildId, 25);

      const stats = referralRepository.getTotalStats(rootId);
      expect(stats.totalDonations).toBe(175);
    });

    it('should not include the user own donations', () => {
      const rootId = createUser('root');
      const childId = createUser('child', rootId);

      createDonation(rootId, 1000);
      createDonation(childId, 50);

      const stats = referralRepository.getTotalStats(rootId);
      expect(stats.totalDonations).toBe(50);
    });
  });

  describe('getStats', () => {
    it('should return null referrer for user without referrer', () => {
      const userId = createUser('root');
      const stats = referralRepository.getStats(userId);
      expect(stats.referrer).toBeNull();
    });

    it('should return referrer info for referred user', () => {
      const referrerId = createUser('referrer');
      const userId = createUser('referred', referrerId);

      const stats = referralRepository.getStats(userId);
      expect(stats.referrer).toEqual({ id: referrerId, username: 'referrer' });
    });

    it('should combine referrer info with level breakdown', () => {
      const rootId = createUser('root');
      const childId = createUser('child', rootId);
      createUser('grandchild', childId);

      createDonation(childId, 100);

      const stats = referralRepository.getStats(rootId);
      expect(stats.referrer).toBeNull();
      expect(stats.levelBreakdown).toHaveLength(2);
      expect(stats.totalDescendants).toBe(2);
      expect(stats.totalDescendantDonations).toBe(100);
    });

    it('should calculate correct totals from breakdown', () => {
      const rootId = createUser('root');
      const child1 = createUser('child1', rootId);
      const child2 = createUser('child2', rootId);

      createDonation(child1, 50);
      createDonation(child2, 75);

      const stats = referralRepository.getStats(rootId);
      expect(stats.totalDescendants).toBe(2);
      expect(stats.totalDescendantDonations).toBe(125);
    });
  });

  describe('getDirectReferralsCount', () => {
    it('should return 0 for user with no referrals', () => {
      const userId = createUser('lonely');
      const count = referralRepository.getDirectReferralsCount(userId);
      expect(count).toBe(0);
    });

    it('should return correct count for direct referrals only', () => {
      const rootId = createUser('root');
      const childId = createUser('child', rootId);
      createUser('another_child', rootId);
      createUser('grandchild', childId);

      const count = referralRepository.getDirectReferralsCount(rootId);
      expect(count).toBe(2);
    });
  });

  describe('wouldCreateCycle', () => {
    it('should return false when no cycle would be created', () => {
      const user1 = createUser('user1');
      const user2 = createUser('user2');

      const wouldCycle = referralRepository.wouldCreateCycle(user1, user2);
      expect(wouldCycle).toBe(false);
    });

    it('should return true when potential referrer is a descendant', () => {
      const parent = createUser('parent');
      const child = createUser('child', parent);

      // Would parent referring child create cycle? Child is already referred by parent
      // So if child becomes referrer of parent: parent->child->parent = cycle
      // wouldCreateCycle(parent, child) checks if parent is ancestor of child
      const wouldCycle = referralRepository.wouldCreateCycle(parent, child);
      expect(wouldCycle).toBe(true);
    });

    it('should return true when potential referrer is an indirect descendant', () => {
      const grandparent = createUser('grandparent');
      const parent = createUser('parent', grandparent);
      const child = createUser('child', parent);

      // grandparent -> parent -> child
      // If child becomes referrer of grandparent: would create cycle
      const wouldCycle = referralRepository.wouldCreateCycle(grandparent, child);
      expect(wouldCycle).toBe(true);
    });

    it('should handle root user case with no ancestors', () => {
      const root = createUser('root');
      const unrelated = createUser('unrelated');

      const wouldCycle = referralRepository.wouldCreateCycle(root, unrelated);
      expect(wouldCycle).toBe(false);
    });

    it('should detect cycles in complex trees', () => {
      const level1 = createUser('level1');
      const level2 = createUser('level2', level1);
      const level3 = createUser('level3', level2);
      const level4 = createUser('level4', level3);

      // level1 -> level2 -> level3 -> level4
      // If level4 becomes referrer of level1: creates cycle
      expect(referralRepository.wouldCreateCycle(level1, level4)).toBe(true);
      expect(referralRepository.wouldCreateCycle(level1, level3)).toBe(true);
      expect(referralRepository.wouldCreateCycle(level1, level2)).toBe(true);
    });
  });
});
