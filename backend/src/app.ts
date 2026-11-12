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

export const isCorsOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Non-browser / server-to-server / curl
  const normalized = origin.trim().replace(/\/+$/, '');
  return env.corsOrigins.includes(normalized);
};

export const createApp = () => {
  const app = express();

  // Required behind Render / Railway / reverse proxies for rate-limiting & secure cookies
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS (strict origin list, no wildcard with credentials)
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (isCorsOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

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

