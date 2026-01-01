const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'FRONTEND_URL'];

export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate FRONTEND_URL is a valid URL
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    try {
      new URL(frontendUrl);
    } catch {
      throw new Error(`FATAL: FRONTEND_URL is not a valid URL: ${frontendUrl}`);
    }
  }
}
