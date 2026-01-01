import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { donationRoutes } from './donation.routes.js';
import { referralRoutes } from './referral.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/donations', donationRoutes);
router.use('/referrals', referralRoutes);

export const apiRoutes = router;
