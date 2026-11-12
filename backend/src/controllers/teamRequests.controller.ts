import { Request, Response } from 'express';
import { teamRequestsService } from '../services/teamRequests.service';
import { asyncHandler } from '../utils/asyncHandler';

export const teamRequestsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const request = await teamRequestsService.createRequest(
      req.user!.id,
      req.body.teamId,
      req.body.message
    );
    res.status(201).json({
      success: true,
      message: 'Join request submitted successfully',
      data: request,
    });
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const requests = await teamRequestsService.listMyRequests(req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Previous join requests retrieved successfully',
      data: requests,
    });
  }),

  listByTeam: asyncHandler(async (req: Request, res: Response) => {
    const requests = await teamRequestsService.listTeamRequests(
      String(req.params.teamId),
      req.user!.id
    );
    res.status(200).json({
      success: true,
      message: 'Team join requests retrieved successfully',
      data: requests,
    });
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const updated = await teamRequestsService.acceptRequest(
      String(req.params.id),
      req.user!.id
    );
    res.status(200).json({
      success: true,
      message: 'Join request accepted',
      data: updated,
    });
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const updated = await teamRequestsService.rejectRequest(
      String(req.params.id),
      req.user!.id
    );
    res.status(200).json({
      success: true,
      message: 'Join request rejected',
      data: updated,
    });
  }),
};
