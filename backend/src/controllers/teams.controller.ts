import { Request, Response } from 'express';
import { teamsService } from '../services/teams.service';
import { asyncHandler } from '../utils/asyncHandler';

export const teamsController = {
  listAvailable: asyncHandler(async (req: Request, res: Response) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const teams = await teamsService.listAvailableTeams(req.user!.id, search);
    res.status(200).json({
      success: true,
      message: 'Available teams retrieved successfully',
      data: teams,
    });
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const teams = await teamsService.listMyTeams(req.user!.id);
    res.status(200).json({
      success: true,
      message: 'My teams retrieved successfully',
      data: teams,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamsService.getById(String(req.params.id), req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Team retrieved successfully',
      data: team,
    });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamsService.create(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamsService.update(String(req.params.id), req.user!.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team,
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await teamsService.remove(String(req.params.id), req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
      data: null,
    });
  }),

  leave: asyncHandler(async (req: Request, res: Response) => {
    await teamsService.leaveTeam(String(req.params.id), req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Left team successfully',
      data: null,
    });
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    await teamsService.removeMember(String(req.params.id), req.user!.id, String(req.params.userId));
    res.status(200).json({
      success: true,
      message: 'Member removed from team',
      data: null,
    });
  }),

  updateMemberRole: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamsService.updateMemberRole(
      String(req.params.id),
      req.user!.id,
      String(req.params.userId),
      req.body.role,
      req.body.memberRoleTitle
    );
    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: team,
    });
  }),

  rateMember: asyncHandler(async (req: Request, res: Response) => {
    const rating = await teamsService.rateMember(
      String(req.params.id),
      req.user!.id,
      String(req.params.userId),
      req.body.stars,
      req.body.feedback
    );
    res.status(200).json({
      success: true,
      message: 'Member rated successfully',
      data: rating,
    });
  }),
};
