import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../config/index.js', () => ({
  config: {
    jwtSecret: 'test-secret-key',
  },
}));

vi.mock('../repositories/user.repository.js', () => ({
  userRepository: {
    findById: vi.fn(),
  },
}));

import { authMiddleware } from '../middleware/auth.js';
import { userRepository } from '../repositories/user.repository.js';

const app = express();
app.use(express.json());
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ userId: req.user?.id, username: req.user?.username });
});

function createValidToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, 'test-secret-key', { expiresIn: '24h' });
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject request without Authorization header', async () => {
    const response = await request(app).get('/protected').expect(401);

    expect(response.body.error).toBe('UNAUTHORIZED');
    expect(response.body.message).toBe('Missing or invalid authorization header');
  });

  it('should reject request with non-Bearer token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Basic sometoken')
      .expect(401);

    expect(response.body.error).toBe('UNAUTHORIZED');
  });

  it('should reject request with empty Bearer token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ')
      .expect(401);

    expect(response.body.error).toBe('UNAUTHORIZED');
  });

  it('should reject request with invalid JWT', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .expect(401);

    expect(response.body.error).toBe('INVALID_TOKEN');
    expect(response.body.message).toBe('Token is invalid or expired');
  });

  it('should reject request with expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: 1, username: 'test' },
      'test-secret-key',
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject request when user no longer exists', async () => {
    vi.mocked(userRepository.findById).mockReturnValue(null);
    const token = createValidToken(1, 'deleteduser');

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(response.body.error).toBe('USER_NOT_FOUND');
    expect(response.body.message).toBe('User no longer exists');
  });

  it('should attach user to request on valid token', async () => {
    const mockUser = { id: 1, username: 'testuser', referralCode: 'abc123', referrerId: null };
    vi.mocked(userRepository.findById).mockReturnValue(mockUser);
    const token = createValidToken(1, 'testuser');

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.userId).toBe(1);
    expect(response.body.username).toBe('testuser');
  });

  it('should call findById with correct userId from token', async () => {
    const mockUser = { id: 42, username: 'specificuser', referralCode: 'xyz789', referrerId: null };
    vi.mocked(userRepository.findById).mockReturnValue(mockUser);
    const token = createValidToken(42, 'specificuser');

    await request(app).get('/protected').set('Authorization', `Bearer ${token}`).expect(200);

    expect(userRepository.findById).toHaveBeenCalledWith(42);
  });
});
