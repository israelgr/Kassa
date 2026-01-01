import { Router } from 'express';
import { loginSchema } from '@kassa/shared';
import { validateBody } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';
import { userRepository } from '../repositories/user.repository.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Login or create user. If username exists, logs in. If not, creates new user.
 */
router.post('/login', validateBody(loginSchema), (req, res) => {
  const { username, referralCode } = req.body;

  // Check if user exists
  const existingUser = userRepository.findByUsername(username);

  if (existingUser) {
    // User exists - log them in (ignore referral code for existing users)
    const token = generateToken(existingUser);
    res.json({
      user: existingUser,
      token,
      isNewUser: false,
    });
    return;
  }

  // New user - handle referral code if provided
  let referrerId: number | null = null;

  if (referralCode) {
    const referrer = userRepository.findByReferralCode(referralCode);
    if (!referrer) {
      throw new AppError(400, 'REFERRAL_CODE_NOT_FOUND', 'Invalid referral code');
    }
    referrerId = referrer.id;
  }

  // Create new user
  const newUser = userRepository.create(username, referrerId);
  const token = generateToken(newUser);

  res.status(201).json({
    user: newUser,
    token,
    isNewUser: true,
  });
});

/**
 * POST /api/v1/auth/logout
 * Logout (client-side token invalidation)
 */
router.post('/logout', authMiddleware, (_req, res) => {
  // In a production app, we'd invalidate the token server-side
  // For this simple implementation, logout is handled client-side
  res.json({ success: true });
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

export const authRoutes = router;
