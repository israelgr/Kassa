import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { referralRepository } from '../repositories/referral.repository.js';
import { config } from '../config/index.js';

const router = Router();

// All referral routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/referrals/link
 * Get user's referral link
 */
router.get('/link', (req, res) => {
  const { referralCode } = req.user!;

  // Build referral URL
  const referralUrl = `${config.frontendUrl}?ref=${referralCode}`;

  res.json({
    referralCode,
    referralUrl,
  });
});

/**
 * GET /api/v1/referrals/stats
 * Get referral tree statistics by level
 */
router.get('/stats', (req, res) => {
  const userId = req.user!.id;

  const stats = referralRepository.getStats(userId);

  res.json(stats);
});

export const referralRoutes = router;
