import crypto from 'crypto';
import { env } from '../config/env';
import { jobQueueService } from './jobQueue.service';
import { runSourceSyncCycle } from '../services/discovery/syncPipeline.service';

let workerTimer: NodeJS.Timeout | null = null;
let schedulerTimer: NodeJS.Timeout | null = null;
let isRunning = false;
const activeJobs = new Set<string>();
const workerId = `worker-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;

async function processTick() {
  if (!isRunning) return;
  if (activeJobs.size >= env.worker.concurrency) return;

  while (activeJobs.size < env.worker.concurrency && isRunning) {
    const job = await jobQueueService.claimNextJob(workerId);
    if (!job) break;

    activeJobs.add(job.id);
    // Execute asynchronously without blocking the loop for other concurrent slots
    void (async () => {
      try {
        const result = await runSourceSyncCycle(job.sourceId, async (pct, msg) => {
          await jobQueueService.updateProgress(job.id, pct, msg);
        });
        await jobQueueService.markCompleted(job.id, result);
      } catch (err) {
        await jobQueueService.markFailedOrRetry(job, (err as Error).message);
      } finally {
        activeJobs.delete(job.id);
      }
    })();
  }
}

async function schedulerTick() {
  if (!isRunning) return;
  try {
    const count = await jobQueueService.enqueueDueSources();
    if (count > 0) {
      console.log(`[Scheduler] Enqueued ${count} due source sync job(s)`);
    }
  } catch (err) {
    console.error('[Scheduler] Failed to enqueue due sources:', (err as Error).message);
  }
}

export async function startBackgroundWorker() {
  if (isRunning) return;
  isRunning = true;

  const recovered = await jobQueueService.recoverStaleJobs();
  if (recovered > 0) {
    console.log(`[Worker] Recovered ${recovered} stale job(s) on startup`);
  }

  // Initial immediate tick
  void schedulerTick();
  void processTick();

  workerTimer = setInterval(() => {
    void processTick();
  }, env.worker.pollIntervalMs);

  schedulerTimer = setInterval(() => {
    void schedulerTick();
  }, env.worker.schedulerIntervalMs);

  console.log(`[Worker] Started (${workerId}) with concurrency=${env.worker.concurrency}`);
}

export async function stopBackgroundWorker() {
  isRunning = false;
  if (workerTimer) clearInterval(workerTimer);
  if (schedulerTimer) clearInterval(schedulerTimer);
  workerTimer = null;
  schedulerTimer = null;
}

/**
 * Helper for tests & manual triggers: processes one available job immediately.
 */
export async function processNextJobOnce(): Promise<boolean> {
  const job = await jobQueueService.claimNextJob(workerId);
  if (!job) return false;
  try {
    const result = await runSourceSyncCycle(job.sourceId, async (pct, msg) => {
      await jobQueueService.updateProgress(job.id, pct, msg);
    });
    await jobQueueService.markCompleted(job.id, result);
    return true;
  } catch (err) {
    await jobQueueService.markFailedOrRetry(job, (err as Error).message);
    return true;
  }
}

