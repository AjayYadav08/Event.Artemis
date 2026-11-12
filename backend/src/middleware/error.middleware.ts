import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
    });
  }

  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatted,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File size exceeds the allowed limit',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with these unique details already exists',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Requested record was not found',
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to related resource',
      });
    }
  }

  if (env.nodeEnv !== 'test') {
    console.error('[UnhandledError]', err);
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

