import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../config/index.js', () => ({
  config: {
    jwtSecret: 'test-secret-key-for-testing',
  },
}));

import { generateToken, verifyToken, type JWTPayload } from '../utils/jwt.js';

describe('JWT Utilities', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    referralCode: 'abc123def456abc123def456abc12345',
    referrerId: null,
    createdAt: '2024-01-01T00:00:00Z',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT string', () => {
      const token = generateToken(mockUser);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId in payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.userId).toBe(mockUser.id);
    });

    it('should include username in payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.username).toBe(mockUser.username);
    });

    it('should include iat (issued at) timestamp', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });

    it('should include exp (expiration) timestamp', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });

    it('should set 24h expiration', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = generateToken(mockUser);
      const after = Math.floor(Date.now() / 1000);
      const decoded = jwt.decode(token) as JWTPayload;

      const expectedMin = before + 24 * 60 * 60 - 1;
      const expectedMax = after + 24 * 60 * 60 + 1;

      expect(decoded.exp).toBeGreaterThanOrEqual(expectedMin);
      expect(decoded.exp).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.username).toBe(mockUser.username);
    });

    it('should throw for invalid token format', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw for token with wrong signature', () => {
      const wrongToken = jwt.sign(
        { userId: 1, username: 'test' },
        'wrong-secret-key',
        { expiresIn: '24h' }
      );

      expect(() => verifyToken(wrongToken)).toThrow();
    });

    it('should throw for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: 1, username: 'test' },
        'test-secret-key-for-testing',
        { expiresIn: '-1h' }
      );

      expect(() => verifyToken(expiredToken)).toThrow();
    });

    it('should throw for malformed JWT', () => {
      expect(() => verifyToken('not.a.valid.jwt.token')).toThrow();
    });

    it('should return correct payload structure', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('username');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });
  });
});
