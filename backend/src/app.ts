import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import apiV1Routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { prisma } from './lib/prisma';

export const createApp = () => {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS
  app.use(
    cors({
      origin: [env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === 'test' ? 10000 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
    },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === 'test' ? 1000 : 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
    },
  });

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        success: true,
        message: 'Event Artemis API is healthy',
        data: {
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
      });
    }
  });

  // Swagger API Docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Rate-limited API routes
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1', apiLimiter, apiV1Routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

