import { Request, Response } from 'express';
import { DiscoveredEventStatus, JobType } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { eventSourcesService } from '../services/discovery/eventSources.service';
import { jobQueueService } from '../worker/jobQueue.service';

export const eventSourcesController = {
  createSource: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventSourcesService.createSource(req.body, req.user!.id);
    res.status(201).json({
      success: true,
      message: 'Event source registered successfully',
      data: result,
    });
  }),

  listSources: asyncHandler(async (_req: Request, res: Response) => {
    const sources = await eventSourcesService.listSources();
    res.json({ success: true, message: 'Event sources retrieved', data: sources });
  }),

  getSourceById: asyncHandler(async (req: Request, res: Response) => {
    const source = await eventSourcesService.getSourceById(String(req.params.id));
    res.json({ success: true, message: 'Event source retrieved', data: source });
  }),

  updateSource: asyncHandler(async (req: Request, res: Response) => {
    const source = await eventSourcesService.updateSource(String(req.params.id), req.body);
    res.json({ success: true, message: 'Event source updated', data: source });
  }),

  deleteSource: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventSourcesService.deleteSource(String(req.params.id));
    res.json({ success: true, message: 'Event source removed (approved events preserved)', data: result });
  }),

  discoverSource: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventSourcesService.triggerJob(String(req.params.id), JobType.DISCOVER, req.user!.id);
    res.status(202).json({
      success: true,
      message: result.deduplicated ? 'Discovery job already in progress' : 'Discovery job enqueued',
      data: result,
    });
  }),

  syncSource: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventSourcesService.triggerJob(String(req.params.id), JobType.SYNC, req.user!.id);
    res.status(202).json({
      success: true,
      message: result.deduplicated ? 'Sync job already in progress' : 'Sync job enqueued',
      data: result,
    });
  }),

  getJobStatus: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobQueueService.getJobById(String(req.params.jobId));
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.json({ success: true, message: 'Job status retrieved', data: job });
  }),

  getSourceDiscoveredEvents: asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as DiscoveredEventStatus | undefined;
    const items = await eventSourcesService.listDiscoveredEvents({
      sourceId: String(req.params.id),
      status,
    });
    res.json({ success: true, message: 'Discovered events retrieved', data: items });
  }),

  getSourceSyncHistory: asyncHandler(async (req: Request, res: Response) => {
    const history = await eventSourcesService.getSyncHistory(String(req.params.id));
    res.json({ success: true, message: 'Sync history retrieved', data: history });
  }),

  listNotifications: asyncHandler(async (_req: Request, res: Response) => {
    const items = await eventSourcesService.listNotifications();
    res.json({ success: true, message: 'Admin notifications retrieved', data: items });
  }),

  listDiscoveredEvents: asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as DiscoveredEventStatus | undefined;
    const sourceId = req.query.sourceId ? String(req.query.sourceId) : undefined;
    const items = await eventSourcesService.listDiscoveredEvents({ sourceId, status });
    res.json({ success: true, message: 'Discovered events retrieved', data: items });
  }),

  getDiscoveredEventById: asyncHandler(async (req: Request, res: Response) => {
    const item = await eventSourcesService.getDiscoveredEventById(String(req.params.id));
    res.json({ success: true, message: 'Discovered event retrieved', data: item });
  }),

  updateDiscoveredEvent: asyncHandler(async (req: Request, res: Response) => {
    const item = await eventSourcesService.updateDiscoveredEvent(String(req.params.id), req.body);
    res.json({ success: true, message: 'Discovered event updated', data: item });
  }),

  approveDiscoveredEvent: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventSourcesService.approveDiscoveredEvent(String(req.params.id), req.user!.id);
    res.json({ success: true, message: 'Discovered event approved and published', data: result });
  }),

  rejectDiscoveredEvent: asyncHandler(async (req: Request, res: Response) => {
    const item = await eventSourcesService.rejectDiscoveredEvent(
      String(req.params.id),
      req.user!.id,
      req.body?.reason
    );
    res.json({ success: true, message: 'Discovered event rejected', data: item });
  }),

  bulkApproveDiscoveredEvents: asyncHandler(async (req: Request, res: Response) => {
    const results = await eventSourcesService.bulkApproveDiscoveredEvents(req.body.ids, req.user!.id);
    res.json({ success: true, message: 'Bulk approval processed', data: results });
  }),

  getEventSources: asyncHandler(async (req: Request, res: Response) => {
    const data = await eventSourcesService.getEventSources(String(req.params.id));
    res.json({ success: true, message: 'Event sources retrieved', data });
  }),

  getEventChangeHistory: asyncHandler(async (req: Request, res: Response) => {
    const data = await eventSourcesService.getEventChangeHistory(String(req.params.id));
    res.json({ success: true, message: 'Event change history retrieved', data });
  }),
};

