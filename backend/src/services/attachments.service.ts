import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { storageService, validateMagicBytes } from './storage.service';
import { teamsService } from './teams.service';

export const attachmentsService = {
  async uploadChatAttachment(
    file: Express.Multer.File,
    uploaderId: string,
    teamId?: string
  ) {
    if (teamId) {
      await teamsService.assertTeamMember(teamId, uploaderId);
    }

    if (!validateMagicBytes(file.buffer, file.mimetype)) {
      throw new ApiError(
        400,
        'File content does not match declared file type'
      );
    }

    const stored = await storageService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'chat'
    );

    const attachment = await prisma.chatAttachment.create({
      data: {
        uploaderId,
        teamId: teamId ?? null,
        fileName: stored.fileName,
        fileType: stored.fileType,
        fileSize: stored.fileSize,
        storageKey: stored.storageKey,
        fileUrl: stored.fileUrl,
      },
    });

    return {
      id: attachment.id,
      name: attachment.fileName,
      url: `/api/v1/attachments/${attachment.id}/download`,
      size: attachment.fileSize,
      type: attachment.fileType,
    };
  },

  async uploadProfileAvatar(file: Express.Multer.File, userId: string) {
    if (!file.mimetype.startsWith('image/')) {
      throw new ApiError(400, 'Profile image must be an image file');
    }
    if (!validateMagicBytes(file.buffer, file.mimetype)) {
      throw new ApiError(400, 'Image content does not match declared type');
    }

    const stored = await storageService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'avatars'
    );

    const publicPath = `/api/v1/attachments/public/${encodeURIComponent(stored.storageKey)}`;
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: publicPath },
    });

    return { profileImage: publicPath };
  },

  async getAuthorizedAttachment(attachmentId: string, userId: string) {
    const attachment = await prisma.chatAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment) {
      throw new ApiError(404, 'Attachment not found');
    }

    if (attachment.teamId) {
      await teamsService.assertTeamMember(attachment.teamId, userId);
    } else if (attachment.uploaderId !== userId) {
      throw new ApiError(403, 'You do not have permission to access this attachment');
    }

    const exists = await storageService.exists(attachment.storageKey);
    if (!exists) {
      throw new ApiError(404, 'Stored file is missing or has been deleted');
    }

    const stream = await storageService.getFileStream(attachment.storageKey);
    return { attachment, stream };
  },
};

