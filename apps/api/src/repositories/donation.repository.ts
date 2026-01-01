import { db } from '../db/connection.js';
import type { Donation, DonationSummary } from '@kassa/shared';

interface DonationRow {
  id: number;
  user_id: number;
  amount: number;
  created_at: string;
}

function mapRowToDonation(row: DonationRow): Donation {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

export const donationRepository = {
  create(userId: number, amount: number): Donation {
    const result = db
      .prepare(
        `INSERT INTO donations (user_id, amount)
         VALUES (?, ?)
         RETURNING *`
      )
      .get(userId, amount) as DonationRow;

    return mapRowToDonation(result);
  },

  findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): { donations: Donation[]; total: number } {
    const offset = (page - 1) * limit;

    // Get total count
    const countRow = db
      .prepare('SELECT COUNT(*) as count FROM donations WHERE user_id = ?')
      .get(userId) as { count: number };

    // Get paginated donations
    const rows = db
      .prepare(
        `SELECT * FROM donations
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(userId, limit, offset) as DonationRow[];

    return {
      donations: rows.map(mapRowToDonation),
      total: countRow.count,
    };
  },

  getSummary(userId: number): DonationSummary {
    const row = db
      .prepare(
        `SELECT
           COALESCE(SUM(amount), 0) as total_donated,
           COUNT(*) as donation_count,
           MIN(created_at) as first_donation,
           MAX(created_at) as last_donation
         FROM donations
         WHERE user_id = ?`
      )
      .get(userId) as {
      total_donated: number;
      donation_count: number;
      first_donation: string | null;
      last_donation: string | null;
    };

    return {
      totalDonated: row.total_donated,
      donationCount: row.donation_count,
      firstDonation: row.first_donation,
      lastDonation: row.last_donation,
    };
  },

  getTotalByUserId(userId: number): number {
    const row = db
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE user_id = ?')
      .get(userId) as { total: number };
    return row.total;
  },
};
