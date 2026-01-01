const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

// CRITICAL: Fail fast if JWT_SECRET is missing in production
if (isProduction && !jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: jwtSecret || 'development-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isProduction,
};
