import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { User } from '@kassa/shared';

export interface JWTPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwtSecret) as JWTPayload;
}
