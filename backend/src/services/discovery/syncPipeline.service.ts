import {
  DiscoveredEventStatus,
  ExtractionMethod,
  FieldOwnership,
  Prisma,
  SyncStatus,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { getIO } from '../../lib/socket';
import { fetchAndExtractPage } from './extractionOrchestrator';
import { normalizeAndValidateEvent } from './normalizer.service';
import { detectDuplicateEvent } from './deduplication.service';
import { NormalizedEventPayload } from './extraction.types';

const MONITORED_FIELDS: Array<keyof NormalizedEventPayload> = [
  'title',
  'date',
  'time',
  'eventDate',
  'registrationDeadline',
  'location',
  'participationMode',
  'registrationUrl',
  'prizePool',
  'eligibility',
  'venueDetails',
  'description',
  'registrationFee',
];

const IMPORTANT_NOTIFY_FIELDS = new Set([
  'eventDate',
  'registrationDeadline',
  'location',
  'venueDetails',
  'participationMode',
  'registrationUrl',
]);

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && typeof b === 'string') {
    return a.toISOString() === new Date(b).toISOString();
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Computes the adaptive next check time based on linked event urgency.
 */
export async function computeAdaptiveNextCheck(sourceId: string, baseHours: number, sourceType: string): Promise<Date> {
  const linkedPages = await prisma.eventSourcePage.findMany({
    where: { sourceId, eventId: { not: null } },
    include: { event: { select: { eventDate: true, registrationDeadline: true, type: true } } },
  });

  const now = Date.now();
  let intervalHours = sourceType === 'SINGLE_EVENT' ? baseHours : Math.max(baseHours, 12);

  if (linkedPages.length > 0) {
    let allPast = true;
    for (const p of linkedPages) {
      if (!p.event) continue;
      const evMs = p.event.eventDate.getTime();
      const hoursToEvent = (evMs - now) / (1000 * 60 * 60);
      if (hoursToEvent > -24) allPast = false;

      if (hoursToEvent >= 0 && hoursToEvent <= 48) {
        intervalHours = Math.min(intervalHours, env.worker.imminentEventIntervalHours);
      } else if (p.event.registrationDeadline) {
        const hoursToDeadline = (p.event.registrationDeadline.getTime() - now) / (1000 * 60 * 60);
        if (hoursToDeadline >= 0 && hoursToDeadline <= 72) {
          intervalHours = Math.min(intervalHours, env.worker.soonDeadlineIntervalHours);
        }
      }
    }
    if (allPast) {
      intervalHours = 168; // Stop frequent monitoring for past events (weekly check)
    }
  }

  return new Date(now + intervalHours * 60 * 60 * 1000);
}

async function createAdminAlert(data: {
  sourceId?: string;
  eventId?: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const notification = await prisma.adminNotification.create({
    data: {
      sourceId: data.sourceId,
      eventId: data.eventId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  try {
    getIO()?.emit('admin:notification', notification);
  } catch {
    // Socket.IO may not be initialized in standalone worker process
  }
}

async function applySafeEventUpdates(
  eventId: string,
  sourceId: string,
  sourcePageId: string,
  payload: NormalizedEventPayload,
  confidence: number
): Promise<{ fieldsUpdated: number; needsReviewCount: number }> {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return { fieldsUpdated: 0, needsReviewCount: 0 };

  const fieldSources = await prisma.eventFieldSource.findMany({ where: { eventId } });
  const ownershipMap = new Map(fieldSources.map((fs) => [fs.fieldName, fs]));

  const updateData: Record<string, unknown> = {};
  const changedImportant: string[] = [];
  let fieldsUpdated = 0;
  let needsReviewCount = 0;

  for (const field of MONITORED_FIELDS) {
    const newVal = payload[field];
    // Never clear a valid existing field simply because a later extraction missed it
    if (newVal === null || newVal === undefined || newVal === '' || newVal === 'Location TBA') {
      continue;
    }

    const prevVal = (existing as Record<string, unknown>)[field];
    if (valuesEqual(prevVal, newVal)) {
      continue;
    }

    const fieldSource = ownershipMap.get(field);
    const isProtected =
      fieldSource?.isManuallyOverridden ||
      fieldSource?.ownership === FieldOwnership.MANUAL ||
      fieldSource?.ownership === FieldOwnership.VERIFIED;

    const trustworthy = confidence >= 0.65 && !isProtected;

    await prisma.eventFieldChangeHistory.create({
      data: {
        eventId,
        fieldName: field,
        previousValue: (prevVal ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        newValue: newVal as Prisma.InputJsonValue,
        sourcePageId,
        confidence,
        applied: trustworthy,
        requiresReview: !trustworthy,
      },
    });

    if (trustworthy) {
      if (field === 'eventDate' || field === 'registrationDeadline') {
        updateData[field] = new Date(String(newVal));
      } else {
        updateData[field] = newVal;
      }
      if (field === 'eventDate') {
        updateData.dayOfMonth = payload.dayOfMonth;
      }

      await prisma.eventFieldHistory.create({
        data: {
          eventId,
          fieldName: field,
          previousValue: (prevVal ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          newValue: newVal as Prisma.InputJsonValue,
          provenance: 'AUTOMATED',
          confidence,
        },
      });

      await prisma.eventFieldSource.upsert({
        where: { eventId_fieldName: { eventId, fieldName: field } },
        create: {
          eventId,
          fieldName: field,
          sourcePageId,
          extractedValue: newVal as Prisma.InputJsonValue,
          confidence,
          ownership: FieldOwnership.AUTO,
        },
        update: {
          sourcePageId,
          extractedValue: newVal as Prisma.InputJsonValue,
          confidence,
        },
      });

      fieldsUpdated++;
      if (IMPORTANT_NOTIFY_FIELDS.has(field)) {
        changedImportant.push(field);
      }
    } else {
      needsReviewCount++;
    }
  }

  if (fieldsUpdated > 0) {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        ...updateData,
        lastSyncedAt: new Date(),
        lastCheckedAt: new Date(),
        extractionConfidence: confidence,
      },
    });
  } else {
    await prisma.event.update({
      where: { id: eventId },
      data: { lastCheckedAt: new Date() },
    });
  }

  if (changedImportant.length > 0) {
    await createAdminAlert({
      sourceId,
      eventId,
      type: 'EVENT_UPDATED',
      title: `Event updated: ${existing.title}`,
      message: `Detected changes in ${changedImportant.join(', ')} from monitored source.`,
      metadata: { changedFields: changedImportant },
    });
  }

  return { fieldsUpdated, needsReviewCount };
}

async function upsertDiscoveredCandidate(params: {
  sourceId: string;
  sourcePageId: string;
  sourcePageUrl: string;
  method: ExtractionMethod;
  payload: NormalizedEventPayload;
  rawExtracted: unknown;
  fieldProvenance: Record<string, string>;
  extractedFields: string[];
  missingFields: string[];
  validationWarnings: string[];
  confidence: number;
}): Promise<{ discoveredNew: boolean }> {
  const dup = await detectDuplicateEvent(params.payload);
  const status: DiscoveredEventStatus =
    dup.matchType === 'EXACT'
      ? DiscoveredEventStatus.MERGED_DUPLICATE
      : dup.matchType === 'UNCERTAIN' || params.validationWarnings.length > 0
        ? DiscoveredEventStatus.NEEDS_REVIEW
        : DiscoveredEventStatus.PENDING_REVIEW;

  const existingCandidate = await prisma.discoveredEvent.findFirst({
    where: {
      sourceId: params.sourceId,
      sourcePageUrl: params.sourcePageUrl,
      status: { in: [DiscoveredEventStatus.PENDING_REVIEW, DiscoveredEventStatus.NEEDS_REVIEW] },
    },
  });

  if (existingCandidate) {
    await prisma.discoveredEvent.update({
      where: { id: existingCandidate.id },
      data: {
        title: params.payload.title,
        extractionMethod: params.method,
        confidence: params.confidence,
        normalizedPayload: params.payload as unknown as Prisma.InputJsonValue,
        rawExtracted: params.rawExtracted as Prisma.InputJsonValue,
        fieldProvenance: params.fieldProvenance as Prisma.InputJsonValue,
        extractedFields: params.extractedFields,
        missingFields: params.missingFields,
        validationWarnings: params.validationWarnings,
        duplicateOfEventId: dup.matchedEventId,
        duplicateConfidence: dup.confidence || null,
        duplicateSignals: dup.signals as Prisma.InputJsonValue,
      },
    });
    return { discoveredNew: false };
  }

  // Also avoid creating a new PENDING candidate if this sourcePageUrl was already approved for this source
  const alreadyApproved = await prisma.discoveredEvent.findFirst({
    where: {
      sourceId: params.sourceId,
      sourcePageUrl: params.sourcePageUrl,
      status: DiscoveredEventStatus.APPROVED,
    },
  });
  if (alreadyApproved) {
    return { discoveredNew: false };
  }

  await prisma.discoveredEvent.create({
    data: {
      sourceId: params.sourceId,
      sourcePageId: params.sourcePageId,
      duplicateOfEventId: dup.matchedEventId,
      duplicateConfidence: dup.confidence || null,
      duplicateSignals: dup.signals as Prisma.InputJsonValue,
      status,
      extractionMethod: params.method,
      confidence: params.confidence,
      title: params.payload.title,
      sourcePageUrl: params.sourcePageUrl,
      normalizedPayload: params.payload as unknown as Prisma.InputJsonValue,
      rawExtracted: params.rawExtracted as Prisma.InputJsonValue,
      fieldProvenance: params.fieldProvenance as Prisma.InputJsonValue,
      extractedFields: params.extractedFields,
      missingFields: params.missingFields,
      validationWarnings: params.validationWarnings,
    },
  });

  return { discoveredNew: true };
}

/**
 * Executes a full discovery or synchronization cycle for an EventSource.
 */
export async function runSourceSyncCycle(
  sourceId: string,
  onProgress?: (pct: number, msg: string) => Promise<void>
) {
  const source = await prisma.eventSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    throw new Error(`EventSource ${sourceId} not found`);
  }

  const syncRecord = await prisma.eventSyncHistory.create({
    data: {
      sourceId: source.id,
      status: SyncStatus.PROCESSING,
    },
  });

  let pagesScanned = 0;
  let eventsDiscovered = 0;
  let eventsUpdated = 0;
  let fieldsUpdated = 0;
  let aiCallsUsed = 0;
  let pageErrors = 0;
  let lastPageError: string | null = null;
  let anyChanged = false;

  try {
    await onProgress?.(10, `Fetching ${source.sourceUrl}`);
    const allowAi = (source.extractionOptions as any)?.allowAiFallback !== false;

    const rootPageRecord = await prisma.eventSourcePage.upsert({
      where: { sourceId_pageUrl: { sourceId: source.id, pageUrl: source.sourceUrl } },
      create: {
        sourceId: source.id,
        pageUrl: source.sourceUrl,
        pageType: source.sourceType === 'SINGLE_EVENT' ? 'DETAIL' : 'LISTING',
      },
      update: {},
    });

    const rootRes = await fetchAndExtractPage(source.sourceUrl, {
      etag: source.etag,
      lastModified: source.lastModified,
      previousHash: source.contentHash,
      allowAiFallback: allowAi,
    });
    pagesScanned++;

    if (rootRes.notModified) {
      // Even if listing page didn't change, still check any linked approved detail pages if Scenario B
      if (source.sourceType === 'SINGLE_EVENT') {
        const nextCheckAt = await computeAdaptiveNextCheck(source.id, source.syncIntervalHours, source.sourceType);
        await prisma.eventSource.update({
          where: { id: source.id },
          data: {
            lastCheckedAt: new Date(),
            lastSuccessfulAt: new Date(),
            nextCheckAt,
            lastSyncStatus: SyncStatus.NO_CHANGES,
            lastError: null,
          },
        });
        await prisma.eventSyncHistory.update({
          where: { id: syncRecord.id },
          data: {
            completedAt: new Date(),
            status: SyncStatus.NO_CHANGES,
            pagesScanned,
          },
        });
        return { status: SyncStatus.NO_CHANGES, pagesScanned, eventsDiscovered, eventsUpdated, fieldsUpdated };
      }
    } else if (rootRes.extraction) {
      anyChanged = true;
      aiCallsUsed += rootRes.extraction.aiCallsUsed;

      await prisma.eventSourcePage.update({
        where: { id: rootPageRecord.id },
        data: {
          contentHash: rootRes.contentHash,
          etag: rootRes.etag,
          lastModified: rootRes.lastModified,
          lastCheckedAt: new Date(),
          lastSuccessfulAt: new Date(),
          extractionMethod: rootRes.extraction.method,
          extractionStatus: SyncStatus.COMPLETED,
          lastError: null,
        },
      });

      if (source.sourceType === 'SINGLE_EVENT' || rootRes.extraction.events.length > 1) {
        for (const rawEv of rootRes.extraction.events) {
          const norm = normalizeAndValidateEvent(rawEv, rootRes.finalUrl, rootRes.extraction.confidence);
          if (rootPageRecord.eventId && source.sourceType === 'SINGLE_EVENT') {
            const upd = await applySafeEventUpdates(
              rootPageRecord.eventId,
              source.id,
              rootPageRecord.id,
              norm.payload,
              norm.confidence
            );
            if (upd.fieldsUpdated > 0) {
              eventsUpdated++;
              fieldsUpdated += upd.fieldsUpdated;
            }
          } else {
            const res = await upsertDiscoveredCandidate({
              sourceId: source.id,
              sourcePageId: rootPageRecord.id,
              sourcePageUrl:
                rootRes.extraction.events.length > 1 && rawEv.eventWebsiteUrl
                  ? rawEv.eventWebsiteUrl
                  : rootRes.finalUrl,
              method: rootRes.extraction.method,
              payload: norm.payload,
              rawExtracted: rawEv,
              fieldProvenance: rootRes.extraction.fieldProvenance,
              extractedFields: norm.extractedFields,
              missingFields: norm.missingFields,
              validationWarnings: [...rootRes.extraction.warnings, ...norm.validationWarnings],
              confidence: norm.confidence,
            });
            if (res.discoveredNew) eventsDiscovered++;
          }
        }
      }

      // Scenario B: crawl discovered event links (up to maxPagesPerCycle & concurrency limit)
      if (source.sourceType !== 'SINGLE_EVENT' && rootRes.extraction.discoveredLinks.length > 0) {
        const limit = Math.min(source.maxPagesPerCycle, env.discovery.defaultMaxPagesPerCycle);
        const candidates = rootRes.extraction.discoveredLinks.slice(0, limit);
        const concurrency = Math.max(1, env.discovery.crawlConcurrencyPerSource);

        for (let i = 0; i < candidates.length; i += concurrency) {
          const batch = candidates.slice(i, i + concurrency);
          const pct = Math.min(90, 20 + Math.round(((i + batch.length) / candidates.length) * 70));
          await onProgress?.(pct, `Processing ${i + batch.length}/${candidates.length} discovered pages`);

          await Promise.all(
            batch.map(async (link) => {
              const pageRec = await prisma.eventSourcePage.upsert({
                where: { sourceId_pageUrl: { sourceId: source.id, pageUrl: link.url } },
                create: {
                  sourceId: source.id,
                  pageUrl: link.url,
                  pageType: link.isPdf ? 'PDF' : 'DETAIL',
                },
                update: {},
              });

              try {
                const subRes = await fetchAndExtractPage(link.url, {
                  etag: pageRec.etag,
                  lastModified: pageRec.lastModified,
                  previousHash: pageRec.contentHash,
                  allowAiFallback: allowAi,
                });
                pagesScanned++;

                if (subRes.notModified || !subRes.extraction) {
                  await prisma.eventSourcePage.update({
                    where: { id: pageRec.id },
                    data: { lastCheckedAt: new Date(), extractionStatus: SyncStatus.NO_CHANGES },
                  });
                  return;
                }

                aiCallsUsed += subRes.extraction.aiCallsUsed;
                await prisma.eventSourcePage.update({
                  where: { id: pageRec.id },
                  data: {
                    contentHash: subRes.contentHash,
                    etag: subRes.etag,
                    lastModified: subRes.lastModified,
                    lastCheckedAt: new Date(),
                    lastSuccessfulAt: new Date(),
                    extractionMethod: subRes.extraction.method,
                    extractionStatus: SyncStatus.COMPLETED,
                    lastError: null,
                  },
                });

                for (const rawEv of subRes.extraction.events) {
                  const norm = normalizeAndValidateEvent(rawEv, subRes.finalUrl, subRes.extraction.confidence);
                  if (pageRec.eventId) {
                    const upd = await applySafeEventUpdates(
                      pageRec.eventId,
                      source.id,
                      pageRec.id,
                      norm.payload,
                      norm.confidence
                    );
                    if (upd.fieldsUpdated > 0) {
                      eventsUpdated++;
                      fieldsUpdated += upd.fieldsUpdated;
                    }
                  } else {
                    const res = await upsertDiscoveredCandidate({
                      sourceId: source.id,
                      sourcePageId: pageRec.id,
                      sourcePageUrl: subRes.finalUrl,
                      method: subRes.extraction.method,
                      payload: norm.payload,
                      rawExtracted: rawEv,
                      fieldProvenance: subRes.extraction.fieldProvenance,
                      extractedFields: norm.extractedFields,
                      missingFields: norm.missingFields,
                      validationWarnings: [...subRes.extraction.warnings, ...norm.validationWarnings],
                      confidence: norm.confidence,
                    });
                    if (res.discoveredNew) eventsDiscovered++;
                  }
                }
              } catch (err) {
                pageErrors++;
                lastPageError = (err as Error).message;
                await prisma.eventSourcePage.update({
                  where: { id: pageRec.id },
                  data: {
                    lastCheckedAt: new Date(),
                    extractionStatus: SyncStatus.FAILED,
                    lastError: lastPageError,
                  },
                });
              }
            })
          );
        }
      }
    }

    const finalStatus: SyncStatus =
      pageErrors > 0 && (eventsDiscovered > 0 || eventsUpdated > 0)
        ? SyncStatus.PARTIALLY_SUCCESSFUL
        : fieldsUpdated > 0
          ? SyncStatus.UPDATED
          : !anyChanged && eventsDiscovered === 0
            ? SyncStatus.NO_CHANGES
            : SyncStatus.COMPLETED;

    const nextCheckAt = await computeAdaptiveNextCheck(source.id, source.syncIntervalHours, source.sourceType);

    await prisma.eventSource.update({
      where: { id: source.id },
      data: {
        etag: rootRes.etag ?? source.etag,
        lastModified: rootRes.lastModified ?? source.lastModified,
        contentHash: rootRes.contentHash ?? source.contentHash,
        lastCheckedAt: new Date(),
        lastSuccessfulAt: new Date(),
        nextCheckAt,
        lastSyncStatus: finalStatus,
        lastError: lastPageError,
        aiRequestsUsed: { increment: aiCallsUsed },
      },
    });

    await prisma.eventSyncHistory.update({
      where: { id: syncRecord.id },
      data: {
        completedAt: new Date(),
        status: finalStatus,
        pagesScanned,
        eventsDiscovered,
        eventsUpdated,
        fieldsUpdated,
        aiCallsUsed,
        errorMessage: lastPageError,
        summary: {
          pageErrors,
          nextCheckAt: nextCheckAt.toISOString(),
        },
      },
    });

    await onProgress?.(100, `Sync finished (${finalStatus})`);
    return { status: finalStatus, pagesScanned, eventsDiscovered, eventsUpdated, fieldsUpdated, aiCallsUsed };
  } catch (err) {
    const errMsg = (err as Error).message;
    await prisma.eventSource.update({
      where: { id: source.id },
      data: {
        lastCheckedAt: new Date(),
        lastSyncStatus: SyncStatus.FAILED,
        lastError: errMsg,
      },
    });
    await prisma.eventSyncHistory.update({
      where: { id: syncRecord.id },
      data: {
        completedAt: new Date(),
        status: SyncStatus.FAILED,
        pagesScanned,
        eventsDiscovered,
        eventsUpdated,
        fieldsUpdated,
        aiCallsUsed,
        errorMessage: errMsg,
      },
    });
    await createAdminAlert({
      sourceId: source.id,
      type: 'SYNC_FAILED',
      title: `Sync failed for ${source.name}`,
      message: errMsg,
    });
    throw err;
  }
}

