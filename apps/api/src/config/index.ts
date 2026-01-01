export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};

// Warn if using default JWT secret in production
if (config.isProduction && config.jwtSecret === 'development-secret-change-in-production') {
  console.warn('WARNING: Using default JWT secret in production. Set JWT_SECRET environment variable!');
}
