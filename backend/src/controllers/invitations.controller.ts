import { Request, Response } from 'express';
import { invitationsService } from '../services/invitations.service';
import { asyncHandler } from '../utils/asyncHandler';

export const invitationsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const invitation = await invitationsService.sendInvitation(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation,
    });
  }),

  listReceived: asyncHandler(async (req: Request, res: Response) => {
    const invitations = await invitationsService.listReceived(req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Invitations retrieved successfully',
      data: invitations,
    });
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const updated = await invitationsService.acceptInvitation(
      String(req.params.id),
      req.user!.id
    );
    res.status(200).json({
      success: true,
      message: 'Invitation accepted',
      data: updated,
    });
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const updated = await invitationsService.rejectInvitation(
      String(req.params.id),
      req.user!.id
    );
    res.status(200).json({
      success: true,
      message: 'Invitation rejected',
      data: updated,
    });
  }),
};
