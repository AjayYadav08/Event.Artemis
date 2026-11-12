import { Request, Response } from 'express';
import { formatMessageForUser, messagesService } from '../services/messages.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getIO } from '../lib/socket';

export const messagesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await messagesService.listByTeam(
      String(req.params.teamId),
      req.user!.id,
      page,
      limit
    );
    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: result.items,
      pagination: result.pagination,
    });
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const teamId = String(req.params.teamId);
    const rawMsg = await messagesService.send(teamId, req.user!.id, req.body);
    const formattedForSender = formatMessageForUser(rawMsg, req.user!.id);

    // Emit real-time Socket.IO event to team room
    const io = getIO();
    if (io) {
      io.to(`team:${teamId}`).emit('message:new', {
        ...formattedForSender,
        isMe: false, // receivers compute isMe relative to their own userId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: formattedForSender,
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const messageId = String(req.params.messageId);
    const result = await messagesService.deleteMessage(
      messageId,
      req.user!.id,
      req.body.deleteType
    );

    if (result.deleteType === 'forEveryone') {
      const io = getIO();
      if (io) {
        io.to(`team:${result.teamId}`).emit('message:deleted', {
          messageId,
          deleteType: 'forEveryone',
          message: result.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: result,
    });
  }),
};
