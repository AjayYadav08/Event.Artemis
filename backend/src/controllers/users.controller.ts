import { Request, Response } from 'express';
import { usersService } from '../services/users.service';
import { attachmentsService } from '../services/attachments.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const usersController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getById(req.user!.id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user,
    });
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const updated = await usersService.updateProfile(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    });
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'Avatar image file is required');
    }
    const result = await attachmentsService.uploadProfileAvatar(req.file, req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: result,
    });
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const users = await usersService.searchUsers(q, req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    });
  }),
};

