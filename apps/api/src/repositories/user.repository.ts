import { db } from '../db/connection.js';
import { randomUUID } from 'crypto';
import type { User } from '@kassa/shared';

interface UserRow {
  id: number;
  username: string;
  referral_code: string;
  referrer_id: number | null;
  created_at: string;
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    referralCode: row.referral_code,
    referrerId: row.referrer_id,
    createdAt: row.created_at,
  };
}

export const userRepository = {
  findById(id: number): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? mapRowToUser(row) : null;
  },

  findByUsername(username: string): User | null {
    const row = db
      .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
      .get(username) as UserRow | undefined;
    return row ? mapRowToUser(row) : null;
  },

  findByReferralCode(referralCode: string): User | null {
    const row = db
      .prepare('SELECT * FROM users WHERE referral_code = ?')
      .get(referralCode.toLowerCase()) as UserRow | undefined;
    return row ? mapRowToUser(row) : null;
  },

  create(username: string, referrerId: number | null = null): User {
    // Generate UUID v4 without hyphens for referral code
    const referralCode = randomUUID().replace(/-/g, '');

    const result = db
      .prepare(
        `INSERT INTO users (username, referral_code, referrer_id)
         VALUES (?, ?, ?)
         RETURNING *`
      )
      .get(username.toLowerCase(), referralCode, referrerId) as UserRow;

    return mapRowToUser(result);
  },

  getReferrer(userId: number): { id: number; username: string } | null {
    const row = db
      .prepare(
        `SELECT u.id, u.username
         FROM users u
         INNER JOIN users referred ON referred.referrer_id = u.id
         WHERE referred.id = ?`
      )
      .get(userId) as { id: number; username: string } | undefined;
    return row || null;
  },

  exists(username: string): boolean {
    const row = db
      .prepare('SELECT 1 FROM users WHERE username = ? COLLATE NOCASE')
      .get(username);
    return !!row;
  },
};
