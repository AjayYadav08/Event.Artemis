import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired access token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      throw new ApiError(401, 'User account no longer exists');
    }

    req.user = user;
    next();
  }
);

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (token) {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, name: true },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };
};

