import { Request, Response } from 'express';
import { attachmentsService } from '../services/attachments.service';
import { storageService } from '../services/storage.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const attachmentsController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'File is required');
    }
    const teamId = typeof req.body.teamId === 'string' ? req.body.teamId : undefined;
    const attachment = await attachmentsService.uploadChatAttachment(
      req.file,
      req.user!.id,
      teamId
    );
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: attachment,
    });
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const { attachment, stream } = await attachmentsService.getAuthorizedAttachment(
      String(req.params.id),
      req.user!.id
    );
    res.setHeader('Content-Type', attachment.fileType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${attachment.fileName}"`
    );
    stream.pipe(res);
  }),

  getPublicAvatar: asyncHandler(async (req: Request, res: Response) => {
    const storageKey = decodeURIComponent(String(req.params.key));
    if (!storageKey.startsWith('avatars/')) {
      throw new ApiError(403, 'Access denied');
    }
    const exists = await storageService.exists(storageKey);
    if (!exists) {
      throw new ApiError(404, 'Avatar not found');
    }
    const stream = await storageService.getFileStream(storageKey);
    stream.pipe(res);
  }),
};
