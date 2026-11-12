import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

const REFRESH_COOKIE_NAME = 'artemis_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    const result = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please sign in again.',
      data: null,
    });
  }),
};

