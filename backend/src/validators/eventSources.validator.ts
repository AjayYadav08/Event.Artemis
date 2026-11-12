import { z } from 'zod';

export const createEventSourceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(160),
    sourceUrl: z.string().url(),
    sourceType: z.enum(['SINGLE_EVENT', 'COLLEGE_WEBSITE', 'EVENT_LISTING', 'OTHER']).default('SINGLE_EVENT'),
    description: z.string().max(1000).optional(),
    syncIntervalHours: z.coerce.number().int().min(1).max(168).default(12),
    maxCrawlDepth: z.coerce.number().int().min(1).max(3).default(2),
    maxPagesPerCycle: z.coerce.number().int().min(1).max(100).default(50),
    monitoringEnabled: z.boolean().default(true),
    extractionOptions: z
      .object({
        allowAiFallback: z.boolean().optional(),
        allowPdfExtraction: z.boolean().optional(),
      })
      .optional(),
    autoDiscover: z.boolean().default(true),
  }),
});

export const updateEventSourceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(160).optional(),
    description: z.string().max(1000).nullable().optional(),
    sourceType: z.enum(['SINGLE_EVENT', 'COLLEGE_WEBSITE', 'EVENT_LISTING', 'OTHER']).optional(),
    monitoringEnabled: z.boolean().optional(),
    syncIntervalHours: z.coerce.number().int().min(1).max(168).optional(),
    maxCrawlDepth: z.coerce.number().int().min(1).max(3).optional(),
    maxPagesPerCycle: z.coerce.number().int().min(1).max(100).optional(),
    extractionOptions: z
      .object({
        allowAiFallback: z.boolean().optional(),
        allowPdfExtraction: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const updateDiscoveredEventSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    normalizedPayload: z.record(z.unknown()).optional(),
  }),
});

export const rejectDiscoveredEventSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const bulkApproveDiscoveredEventsSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
  }),
});

