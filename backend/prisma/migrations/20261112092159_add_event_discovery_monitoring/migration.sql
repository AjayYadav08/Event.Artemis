-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('SINGLE_EVENT', 'COLLEGE_WEBSITE', 'EVENT_LISTING', 'OTHER');

-- CreateEnum
CREATE TYPE "MonitoringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'UPDATED', 'NO_CHANGES', 'NEEDS_REVIEW', 'PARTIALLY_SUCCESSFUL', 'FAILED', 'PAUSED');

-- CreateEnum
CREATE TYPE "ExtractionMethod" AS ENUM ('STRUCTURED_DATA', 'STATIC_HTML', 'DYNAMIC_BROWSER', 'AI_EXTRACTION', 'PDF_DOCUMENT');

-- CreateEnum
CREATE TYPE "DiscoveredEventStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'MERGED_DUPLICATE', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "FieldOwnership" AS ENUM ('AUTO', 'MANUAL', 'VERIFIED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('DISCOVER', 'SYNC');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "EventSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'SINGLE_EVENT',
    "description" TEXT,
    "monitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "monitoringStatus" "MonitoringStatus" NOT NULL DEFAULT 'ACTIVE',
    "syncIntervalHours" INTEGER NOT NULL DEFAULT 12,
    "maxCrawlDepth" INTEGER NOT NULL DEFAULT 2,
    "maxPagesPerCycle" INTEGER NOT NULL DEFAULT 50,
    "extractionOptions" JSONB NOT NULL DEFAULT '{}',
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "lastSyncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "etag" TEXT,
    "lastModified" TEXT,
    "contentHash" TEXT,
    "aiRequestsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSourcePage" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "eventId" TEXT,
    "pageUrl" TEXT NOT NULL,
    "pageType" TEXT NOT NULL DEFAULT 'DETAIL',
    "externalEventId" TEXT,
    "contentHash" TEXT,
    "etag" TEXT,
    "lastModified" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "extractionMethod" "ExtractionMethod",
    "extractionStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSourcePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveredEvent" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourcePageId" TEXT,
    "approvedEventId" TEXT,
    "duplicateOfEventId" TEXT,
    "duplicateConfidence" DOUBLE PRECISION,
    "duplicateSignals" JSONB NOT NULL DEFAULT '[]',
    "status" "DiscoveredEventStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "extractionMethod" "ExtractionMethod" NOT NULL DEFAULT 'STATIC_HTML',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "title" TEXT NOT NULL,
    "sourcePageUrl" TEXT NOT NULL,
    "normalizedPayload" JSONB NOT NULL,
    "rawExtracted" JSONB NOT NULL DEFAULT '{}',
    "fieldProvenance" JSONB NOT NULL DEFAULT '{}',
    "extractedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missingFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validationWarnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveredEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFieldSource" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "sourcePageId" TEXT,
    "extractedValue" JSONB,
    "rawValue" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "ownership" "FieldOwnership" NOT NULL DEFAULT 'AUTO',
    "isManuallyOverridden" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFieldSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSyncHistory" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "eventId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'PROCESSING',
    "pagesScanned" INTEGER NOT NULL DEFAULT 0,
    "eventsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "eventsUpdated" INTEGER NOT NULL DEFAULT 0,
    "fieldsUpdated" INTEGER NOT NULL DEFAULT 0,
    "aiCallsUsed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "summary" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "EventSyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFieldChangeHistory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "sourcePageId" TEXT,
    "confidence" DOUBLE PRECISION,
    "applied" BOOLEAN NOT NULL DEFAULT true,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFieldChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL DEFAULT 'SYNC',
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "progressMessage" TEXT,
    "result" JSONB,
    "error" TEXT,
    "triggeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "eventId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "readByUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSource_monitoringEnabled_nextCheckAt_idx" ON "EventSource"("monitoringEnabled", "nextCheckAt");

-- CreateIndex
CREATE INDEX "EventSource_sourceUrl_idx" ON "EventSource"("sourceUrl");

-- CreateIndex
CREATE INDEX "EventSourcePage_eventId_idx" ON "EventSourcePage"("eventId");

-- CreateIndex
CREATE INDEX "EventSourcePage_nextCheckAt_idx" ON "EventSourcePage"("nextCheckAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventSourcePage_sourceId_pageUrl_key" ON "EventSourcePage"("sourceId", "pageUrl");

-- CreateIndex
CREATE INDEX "DiscoveredEvent_sourceId_status_idx" ON "DiscoveredEvent"("sourceId", "status");

-- CreateIndex
CREATE INDEX "DiscoveredEvent_status_idx" ON "DiscoveredEvent"("status");

-- CreateIndex
CREATE INDEX "DiscoveredEvent_sourcePageUrl_idx" ON "DiscoveredEvent"("sourcePageUrl");

-- CreateIndex
CREATE INDEX "EventFieldSource_sourcePageId_idx" ON "EventFieldSource"("sourcePageId");

-- CreateIndex
CREATE UNIQUE INDEX "EventFieldSource_eventId_fieldName_key" ON "EventFieldSource"("eventId", "fieldName");

-- CreateIndex
CREATE INDEX "EventSyncHistory_sourceId_startedAt_idx" ON "EventSyncHistory"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "EventSyncHistory_eventId_idx" ON "EventSyncHistory"("eventId");

-- CreateIndex
CREATE INDEX "EventFieldChangeHistory_eventId_changedAt_idx" ON "EventFieldChangeHistory"("eventId", "changedAt");

-- CreateIndex
CREATE INDEX "SyncJob_status_runAt_idx" ON "SyncJob"("status", "runAt");

-- CreateIndex
CREATE INDEX "SyncJob_sourceId_status_idx" ON "SyncJob"("sourceId", "status");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "EventSource" ADD CONSTRAINT "EventSource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSourcePage" ADD CONSTRAINT "EventSourcePage_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EventSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSourcePage" ADD CONSTRAINT "EventSourcePage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredEvent" ADD CONSTRAINT "DiscoveredEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EventSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredEvent" ADD CONSTRAINT "DiscoveredEvent_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "EventSourcePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredEvent" ADD CONSTRAINT "DiscoveredEvent_approvedEventId_fkey" FOREIGN KEY ("approvedEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredEvent" ADD CONSTRAINT "DiscoveredEvent_duplicateOfEventId_fkey" FOREIGN KEY ("duplicateOfEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredEvent" ADD CONSTRAINT "DiscoveredEvent_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFieldSource" ADD CONSTRAINT "EventFieldSource_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFieldSource" ADD CONSTRAINT "EventFieldSource_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "EventSourcePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSyncHistory" ADD CONSTRAINT "EventSyncHistory_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EventSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSyncHistory" ADD CONSTRAINT "EventSyncHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFieldChangeHistory" ADD CONSTRAINT "EventFieldChangeHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFieldChangeHistory" ADD CONSTRAINT "EventFieldChangeHistory_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "EventSourcePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EventSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EventSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
