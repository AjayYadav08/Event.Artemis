import { Request, Response } from 'express';
import { eventsService } from '../services/events.service';
import { asyncHandler } from '../utils/asyncHandler';

export const eventsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventsService.list(req.query as any, req.user?.id);
    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: result.items,
      pagination: result.pagination,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.getById(String(req.params.id), req.user?.id);
    res.status(200).json({
      success: true,
      message: 'Event retrieved successfully',
      data: event,
    });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.create(req.body, req.user!.id);
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.update(String(req.params.id), req.body, req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await eventsService.remove(String(req.params.id));
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: null,
    });
  }),

  addInterest: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventsService.addInterest(String(req.params.id), req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Event marked as interested',
      data: result,
    });
  }),

  removeInterest: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventsService.removeInterest(String(req.params.id), req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Event interest removed',
      data: result,
    });
  }),

  getMyInterested: asyncHandler(async (req: Request, res: Response) => {
    const events = await eventsService.getUserInterestedEvents(req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Interested events retrieved successfully',
      data: events,
    });
  }),

  registerForEvent: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventsService.registerForEvent(String(req.params.id), req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Registered for event successfully',
      data: result,
    });
  }),

  getMyRegistered: asyncHandler(async (req: Request, res: Response) => {
    const eventIds = await eventsService.getUserRegisteredEvents(req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Registered event IDs retrieved successfully',
      data: eventIds,
    });
  }),
};
