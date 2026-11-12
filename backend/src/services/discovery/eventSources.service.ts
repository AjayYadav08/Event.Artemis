import {
  DiscoveredEventStatus,
  FieldOwnership,
  JobType,
  MonitoringStatus,
  Prisma,
  SyncStatus,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { eventsService } from '../events.service';
import { validateExternalUrl } from './ssrf.service';
import { recognizeWebsiteSource } from './platformRecognizer.service';
import { jobQueueService } from '../../worker/jobQueue.service';

export const eventSourcesService = {
  async createSource(input: {
    sourceUrl: string;
    name?: string;
    sourceType?: 'SINGLE_EVENT' | 'COLLEGE_WEBSITE' | 'EVENT_LISTING' | 'OTHER';
    description?: string;
    syncIntervalHours?: number;
    maxCrawlDepth?: number;
    maxPagesPerCycle?: number;
    monitoringEnabled?: boolean;
    extractionOptions?: Record<string, unknown>;
    autoDiscover?: boolean;
  }, userId: string) {
    // Validate URL & SSRF safety before storing
    const { url } = await validateExternalUrl(input.sourceUrl);
    const normalizedUrl = url.toString();

    const existing = await prisma.eventSource.findFirst({
      where: { sourceUrl: normalizedUrl },
    });
    if (existing) {
      throw new ApiError(409, 'A source with this URL is already registered');
    }

    const autoConfig = recognizeWebsiteSource(normalizedUrl);
    const monitoringEnabled = input.monitoringEnabled ?? true;
    const syncIntervalHours = input.syncIntervalHours ?? autoConfig.syncIntervalHours;

    const nextCheckAt = monitoringEnabled
      ? new Date(Date.now() + syncIntervalHours * 60 * 60 * 1000)
      : null;

    const source = await prisma.eventSource.create({
      data: {
        name: input.name?.trim() || autoConfig.name,
        sourceUrl: normalizedUrl,
        sourceType: input.sourceType ?? autoConfig.sourceType,
        description: input.description ?? autoConfig.description,
        monitoringEnabled,
        monitoringStatus: monitoringEnabled ? MonitoringStatus.ACTIVE : MonitoringStatus.PAUSED,
        syncIntervalHours,
        maxCrawlDepth: input.maxCrawlDepth ?? autoConfig.maxCrawlDepth,
        maxPagesPerCycle: input.maxPagesPerCycle ?? autoConfig.maxPagesPerCycle,
        extractionOptions: {
          ...autoConfig.extractionOptions,
          ...(input.extractionOptions ?? {}),
        } as Prisma.InputJsonValue,
        nextCheckAt,
        lastSyncStatus: SyncStatus.PENDING,
        createdById: userId,
      },
    });

    let job = null;
    if (input.autoDiscover !== false) {
      const enqueued = await jobQueueService.enqueueSourceJob({
        sourceId: source.id,
        jobType: JobType.DISCOVER,
        triggeredById: userId,
        priority: 10,
      });
      job = enqueued.job;
    }

    return { source, job };
  },

  async listSources() {
    const sources = await prisma.eventSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            discoveredEvents: true,
            pages: true,
            syncHistory: true,
          },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const activeLinks = await prisma.eventSourcePage.groupBy({
      by: ['sourceId'],
      where: { eventId: { not: null } },
      _count: { eventId: true },
    });
    const activeMap = new Map(activeLinks.map((a) => [a.sourceId, a._count.eventId]));

    return sources.map((s) => ({
      ...s,
      discoveredEventsCount: s._count.discoveredEvents,
      activeEventsCount: activeMap.get(s.id) ?? 0,
      pagesCount: s._count.pages,
      latestJob: s.jobs[0] ?? null,
    }));
  },

  async getSourceById(id: string) {
    const source = await prisma.eventSource.findUnique({
      where: { id },
      include: {
        pages: { orderBy: { updatedAt: 'desc' }, take: 50 },
        syncHistory: { orderBy: { startedAt: 'desc' }, take: 25 },
        jobs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!source) {
      throw new ApiError(404, 'Event source not found');
    }
    return source;
  },

  async updateSource(id: string, input: {
    name?: string;
    description?: string | null;
    sourceType?: 'SINGLE_EVENT' | 'COLLEGE_WEBSITE' | 'EVENT_LISTING' | 'OTHER';
    monitoringEnabled?: boolean;
    syncIntervalHours?: number;
    maxCrawlDepth?: number;
    maxPagesPerCycle?: number;
    extractionOptions?: Record<string, unknown>;
  }) {
    const existing = await prisma.eventSource.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Event source not found');

    const data: Prisma.EventSourceUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.sourceType !== undefined) data.sourceType = input.sourceType;
    if (input.syncIntervalHours !== undefined) data.syncIntervalHours = input.syncIntervalHours;
    if (input.maxCrawlDepth !== undefined) data.maxCrawlDepth = input.maxCrawlDepth;
    if (input.maxPagesPerCycle !== undefined) data.maxPagesPerCycle = input.maxPagesPerCycle;
    if (input.extractionOptions !== undefined) {
      data.extractionOptions = input.extractionOptions as Prisma.InputJsonValue;
    }

    if (input.monitoringEnabled !== undefined) {
      data.monitoringEnabled = input.monitoringEnabled;
      data.monitoringStatus = input.monitoringEnabled ? MonitoringStatus.ACTIVE : MonitoringStatus.PAUSED;
      if (!input.monitoringEnabled) {
        data.lastSyncStatus = SyncStatus.PAUSED;
      } else {
        const hours = input.syncIntervalHours ?? existing.syncIntervalHours;
        data.nextCheckAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        if (existing.lastSyncStatus === SyncStatus.PAUSED) {
          data.lastSyncStatus = SyncStatus.PENDING;
        }
      }
    }

    return prisma.eventSource.update({ where: { id }, data });
  },

  async deleteSource(id: string) {
    const existing = await prisma.eventSource.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Event source not found');

    // Deleting EventSource cascades to pages/discoveredEvents/syncHistory,
    // while previously approved Event rows remain intact!
    await prisma.eventSource.delete({ where: { id } });
    return { deleted: true, id };
  },

  async triggerJob(sourceId: string, jobType: JobType, userId: string) {
    const source = await prisma.eventSource.findUnique({ where: { id: sourceId } });
    if (!source) throw new ApiError(404, 'Event source not found');

    const { job, deduplicated } = await jobQueueService.enqueueSourceJob({
      sourceId,
      jobType,
      triggeredById: userId,
      priority: 10,
    });
    return { job, deduplicated };
  },

  async getSyncHistory(sourceId: string) {
    const source = await prisma.eventSource.findUnique({ where: { id: sourceId } });
    if (!source) throw new ApiError(404, 'Event source not found');

    return prisma.eventSyncHistory.findMany({
      where: { sourceId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  },

  async listDiscoveredEvents(filters: { sourceId?: string; status?: DiscoveredEventStatus }) {
    return prisma.discoveredEvent.findMany({
      where: {
        ...(filters.sourceId ? { sourceId: filters.sourceId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: {
        source: { select: { id: true, name: true, sourceType: true, sourceUrl: true } },
        duplicateOfEvent: { select: { id: true, title: true, date: true, location: true } },
        approvedEvent: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  },

  async getDiscoveredEventById(id: string) {
    const item = await prisma.discoveredEvent.findUnique({
      where: { id },
      include: {
        source: true,
        sourcePage: true,
        duplicateOfEvent: true,
        approvedEvent: true,
      },
    });
    if (!item) throw new ApiError(404, 'Discovered event not found');
    return item;
  },

  async updateDiscoveredEvent(id: string, input: { title?: string; normalizedPayload?: Record<string, unknown> }) {
    const existing = await prisma.discoveredEvent.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Discovered event not found');
    if (existing.status === DiscoveredEventStatus.APPROVED) {
      throw new ApiError(400, 'Approved discovered events cannot be modified here; edit the published event instead');
    }

    const mergedPayload = {
      ...(existing.normalizedPayload as Record<string, unknown>),
      ...(input.normalizedPayload ?? {}),
      ...(input.title ? { title: input.title } : {}),
    };

    return prisma.discoveredEvent.update({
      where: { id },
      data: {
        title: input.title ?? existing.title,
        normalizedPayload: mergedPayload as Prisma.InputJsonValue,
      },
    });
  },

  async approveDiscoveredEvent(id: string, reviewerId: string) {
    const candidate = await prisma.discoveredEvent.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!candidate) throw new ApiError(404, 'Discovered event not found');
    if (candidate.status === DiscoveredEventStatus.APPROVED && candidate.approvedEventId) {
      return { discoveredEvent: candidate, eventId: candidate.approvedEventId, alreadyApproved: true };
    }

    const payload = candidate.normalizedPayload as Record<string, any>;

    // Reuse existing eventsService.create to persist into the Event table!
    const createdEvent = await eventsService.create(
      {
        ...payload,
        sourceUrl: candidate.sourcePageUrl,
        sourceType: candidate.source.sourceType,
        externalSourceId: payload.externalSourceId ?? null,
      },
      reviewerId
    );

    await prisma.event.update({
      where: { id: createdEvent.id },
      data: {
        dataProvenance: 'AUTOMATED',
        extractionStatus: 'SYNCED',
        extractionConfidence: candidate.confidence,
        lastSyncedAt: new Date(),
        lastCheckedAt: new Date(),
        sourceMetadata: (payload.sourceMetadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Link EventSourcePage to the approved Event for ongoing automatic monitoring
    if (candidate.sourcePageId) {
      await prisma.eventSourcePage.update({
        where: { id: candidate.sourcePageId },
        data: { eventId: createdEvent.id },
      });
    }

    // Record field-level provenance
    for (const field of candidate.extractedFields) {
      await prisma.eventFieldSource.upsert({
        where: { eventId_fieldName: { eventId: createdEvent.id, fieldName: field } },
        create: {
          eventId: createdEvent.id,
          fieldName: field,
          sourcePageId: candidate.sourcePageId,
          extractedValue: (payload[field] ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          confidence: candidate.confidence,
          ownership: FieldOwnership.AUTO,
        },
        update: {
          sourcePageId: candidate.sourcePageId,
          extractedValue: (payload[field] ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          confidence: candidate.confidence,
        },
      });
    }

    const updatedCandidate = await prisma.discoveredEvent.update({
      where: { id },
      data: {
        status: DiscoveredEventStatus.APPROVED,
        approvedEventId: createdEvent.id,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    return { discoveredEvent: updatedCandidate, event: createdEvent, alreadyApproved: false };
  },

  async rejectDiscoveredEvent(id: string, reviewerId: string, reason?: string) {
    const candidate = await prisma.discoveredEvent.findUnique({ where: { id } });
    if (!candidate) throw new ApiError(404, 'Discovered event not found');

    return prisma.discoveredEvent.update({
      where: { id },
      data: {
        status: DiscoveredEventStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason || 'Rejected by administrator',
      },
    });
  },

  async bulkApproveDiscoveredEvents(ids: string[], reviewerId: string) {
    const results: Array<{ id: string; success: boolean; eventId?: string; error?: string }> = [];
    for (const id of ids) {
      try {
        const res = await this.approveDiscoveredEvent(id, reviewerId);
        results.push({ id, success: true, eventId: res.event?.id || res.eventId });
      } catch (err) {
        results.push({ id, success: false, error: (err as Error).message });
      }
    }
    return results;
  },

  async getEventSources(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, 'Event not found');

    const [pages, fieldSources] = await Promise.all([
      prisma.eventSourcePage.findMany({
        where: { eventId },
        include: { source: { select: { id: true, name: true, sourceType: true, monitoringEnabled: true } } },
      }),
      prisma.eventFieldSource.findMany({
        where: { eventId },
        orderBy: { fieldName: 'asc' },
      }),
    ]);

    return { eventId, pages, fieldSources };
  },

  async getEventChangeHistory(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, 'Event not found');

    return prisma.eventFieldChangeHistory.findMany({
      where: { eventId },
      include: { sourcePage: { select: { pageUrl: true } } },
      orderBy: { changedAt: 'desc' },
      take: 100,
    });
  },

  async listNotifications() {
    return prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },
};

