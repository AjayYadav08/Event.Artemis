import { JobStatus, JobType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

export const jobQueueService = {
  /**
   * Enqueues a DISCOVER or SYNC job for a source, preventing duplicate concurrent/queued jobs.
   */
  async enqueueSourceJob(params: {
    sourceId: string;
    jobType: JobType;
    triggeredById?: string;
    priority?: number;
  }) {
    const existing = await prisma.syncJob.findFirst({
      where: {
        sourceId: params.sourceId,
        status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return { job: existing, deduplicated: true };
    }

    const job = await prisma.syncJob.create({
      data: {
        sourceId: params.sourceId,
        jobType: params.jobType,
        status: JobStatus.QUEUED,
        priority: params.priority ?? 0,
        triggeredById: params.triggeredById,
        progressMessage: 'Queued for processing',
      },
    });

    return { job, deduplicated: false };
  },

  async getJobById(jobId: string) {
    return prisma.syncJob.findUnique({ where: { id: jobId } });
  },

  /**
   * Recovers jobs left in RUNNING state from an unexpected worker crash or deployment restart.
   */
  async recoverStaleJobs(): Promise<number> {
    const cutoff = new Date(Date.now() - env.worker.lockTimeoutMs);
    const res = await prisma.syncJob.updateMany({
      where: {
        status: JobStatus.RUNNING,
        lockedAt: { lt: cutoff },
      },
      data: {
        status: JobStatus.QUEUED,
        lockedAt: null,
        lockedBy: null,
        progressMessage: 'Recovered after worker restart',
      },
    });
    return res.count;
  },

  /**
   * Finds all active monitored sources whose nextCheckAt is due and enqueues SYNC jobs.
   */
  async enqueueDueSources(): Promise<number> {
    const now = new Date();
    const dueSources = await prisma.eventSource.findMany({
      where: {
        monitoringEnabled: true,
        OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: now } }],
      },
      select: { id: true },
      take: 50,
    });

    let enqueued = 0;
    for (const src of dueSources) {
      const res = await this.enqueueSourceJob({
        sourceId: src.id,
        jobType: JobType.SYNC,
      });
      if (!res.deduplicated) enqueued++;
    }
    return enqueued;
  },

  /**
   * Atomically claims the next due QUEUED job using an optimistic conditional update.
   */
  async claimNextJob(workerId: string) {
    const now = new Date();
    const candidate = await prisma.syncJob.findFirst({
      where: {
        status: JobStatus.QUEUED,
        runAt: { lte: now },
      },
      orderBy: [{ priority: 'desc' }, { runAt: 'asc' }, { createdAt: 'asc' }],
    });

    if (!candidate) return null;

    const claimed = await prisma.syncJob.updateMany({
      where: {
        id: candidate.id,
        status: JobStatus.QUEUED,
      },
      data: {
        status: JobStatus.RUNNING,
        lockedAt: now,
        lockedBy: workerId,
        startedAt: candidate.startedAt ?? now,
        attempts: { increment: 1 },
        progress: 5,
        progressMessage: 'Worker started processing',
      },
    });

    if (claimed.count === 0) return null;
    return prisma.syncJob.findUnique({ where: { id: candidate.id } });
  },

  async updateProgress(jobId: string, progress: number, progressMessage: string) {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: { progress, progressMessage },
    });
  },

  async markCompleted(jobId: string, result: unknown) {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        progress: 100,
        progressMessage: 'Completed',
        result: result as Prisma.InputJsonValue,
      },
    });
  },

  async markFailedOrRetry(job: { id: string; attempts: number; maxAttempts: number }, errorMessage: string) {
    if (job.attempts < job.maxAttempts) {
      const backoffMs = Math.pow(2, job.attempts) * 15_000;
      const nextRunAt = new Date(Date.now() + backoffMs);
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.QUEUED,
          runAt: nextRunAt,
          lockedAt: null,
          lockedBy: null,
          error: errorMessage,
          progressMessage: `Retry scheduled (${job.attempts}/${job.maxAttempts})`,
        },
      });
    } else {
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          completedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          error: errorMessage,
          progressMessage: 'Failed after maximum retries',
        },
      });
    }
  },
};

