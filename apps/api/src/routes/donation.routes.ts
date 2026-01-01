import { Router } from 'express';
import { donationSchema, paginationSchema, type PaginationInput } from '@kassa/shared';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';
import { donationRepository } from '../repositories/donation.repository.js';

const router = Router();

// All donation routes require authentication
router.use(authMiddleware);

/**
 * POST /api/v1/donations
 * Create a new donation
 */
router.post('/', validateBody(donationSchema), (req, res) => {
  const { amount } = req.body;
  const userId = req.user!.id;

  const donation = donationRepository.create(userId, amount);

  res.status(201).json(donation);
});

/**
 * GET /api/v1/donations
 * Get current user's donations (paginated)
 */
router.get('/', validateQuery(paginationSchema), (req, res) => {
  const userId = req.user!.id;
  const { page, limit } = req.query as unknown as PaginationInput;

  const { donations, total } = donationRepository.findByUserId(userId, page, limit);

  res.json({
    donations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/v1/donations/summary
 * Get donation statistics for current user
 */
router.get('/summary', (req, res) => {
  const userId = req.user!.id;

  const summary = donationRepository.getSummary(userId);

  res.json(summary);
});

export const donationRoutes = router;
