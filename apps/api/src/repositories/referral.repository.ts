import { db } from '../db/connection.js';
import type { LevelBreakdown, ReferralStats } from '@kassa/shared';

export const referralRepository = {
  /**
   * Get referral statistics broken down by level using recursive CTE
   */
  getLevelBreakdown(userId: number): LevelBreakdown[] {
    const rows = db
      .prepare(
        `WITH RECURSIVE descendants AS (
           -- Base case: direct referrals (level 1)
           SELECT u.id, 1 as level
           FROM users u
           WHERE u.referrer_id = ?

           UNION ALL

           -- Recursive case: referrals of referrals
           SELECT u.id, d.level + 1 as level
           FROM users u
           INNER JOIN descendants d ON u.referrer_id = d.id
           WHERE d.level < 100  -- Safety limit
         )
         SELECT
           d.level,
           COUNT(DISTINCT d.id) as user_count,
           COALESCE(SUM(don.amount), 0) as total_donated
         FROM descendants d
         LEFT JOIN donations don ON d.id = don.user_id
         GROUP BY d.level
         ORDER BY d.level`
      )
      .all(userId) as Array<{
      level: number;
      user_count: number;
      total_donated: number;
    }>;

    return rows.map((row) => ({
      level: row.level,
      userCount: row.user_count,
      totalDonated: row.total_donated,
    }));
  },

  /**
   * Get aggregate statistics for all descendants
   */
  getTotalStats(userId: number): { totalDescendants: number; totalDonations: number } {
    const row = db
      .prepare(
        `WITH RECURSIVE descendants AS (
           SELECT u.id
           FROM users u
           WHERE u.referrer_id = ?

           UNION ALL

           SELECT u.id
           FROM users u
           INNER JOIN descendants d ON u.referrer_id = d.id
         )
         SELECT
           COUNT(DISTINCT d.id) as total_descendants,
           COALESCE(SUM(don.amount), 0) as total_donations
         FROM descendants d
         LEFT JOIN donations don ON d.id = don.user_id`
      )
      .get(userId) as { total_descendants: number; total_donations: number };

    return {
      totalDescendants: row.total_descendants,
      totalDonations: row.total_donations,
    };
  },

  /**
   * Get full referral stats including referrer info
   */
  getStats(userId: number): ReferralStats {
    // Get referrer
    const referrerRow = db
      .prepare(
        `SELECT u.id, u.username
         FROM users u
         INNER JOIN users referred ON referred.referrer_id = u.id
         WHERE referred.id = ?`
      )
      .get(userId) as { id: number; username: string } | undefined;

    // Get level breakdown
    const levelBreakdown = this.getLevelBreakdown(userId);

    // Calculate totals from breakdown
    const totalDescendants = levelBreakdown.reduce((sum, level) => sum + level.userCount, 0);
    const totalDescendantDonations = levelBreakdown.reduce(
      (sum, level) => sum + level.totalDonated,
      0
    );

    return {
      referrer: referrerRow || null,
      totalDescendants,
      totalDescendantDonations,
      levelBreakdown,
    };
  },

  /**
   * Get direct referrals count (level 1 only)
   */
  getDirectReferralsCount(userId: number): number {
    const row = db
      .prepare('SELECT COUNT(*) as count FROM users WHERE referrer_id = ?')
      .get(userId) as { count: number };
    return row.count;
  },

  /**
   * Check if adding a referrer would create a cycle
   * (user is already an ancestor of potential referrer)
   */
  wouldCreateCycle(userId: number, potentialReferrerId: number): boolean {
    // Check if userId is an ancestor of potentialReferrerId
    const row = db
      .prepare(
        `WITH RECURSIVE ancestors AS (
           SELECT referrer_id as id
           FROM users
           WHERE id = ?

           UNION ALL

           SELECT u.referrer_id
           FROM users u
           INNER JOIN ancestors a ON u.id = a.id
           WHERE u.referrer_id IS NOT NULL
         )
         SELECT 1 FROM ancestors WHERE id = ? LIMIT 1`
      )
      .get(potentialReferrerId, userId);

    return !!row;
  },
};
