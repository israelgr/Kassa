import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { apiRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { db } from './db/connection.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Only apply rate limiting in production
if (config.isProduction) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  });
  app.use(limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'RATE_LIMITED', message: 'Too many login attempts, please try again later' },
  });
  app.use('/api/v1/auth', authLimiter);
}

app.use(express.json({ limit: '10kb' }));
app.use('/api/v1', apiRoutes);

// Health check endpoint for load balancers and monitoring
app.get('/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
});

app.use(errorHandler);

export { app };
