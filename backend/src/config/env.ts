import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const normalizeOrigin = (url: string) => url.trim().replace(/\/+$/, '');

const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const rawCorsOrigins = process.env.CORS_ORIGINS || '';
const parsedCorsOrigins = Array.from(
  new Set(
    [
      rawFrontendUrl,
      ...rawCorsOrigins.split(',').map((s) => s.trim()).filter(Boolean),
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : []),
    ]
      .filter(Boolean)
      .map(normalizeOrigin)
  )
);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: normalizeOrigin(rawFrontendUrl),
  corsOrigins: parsedCorsOrigins,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-prod',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  storageProvider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024,
  s3: {
    bucket: process.env.S3_BUCKET || '',
    region: process.env.S3_REGION || '',
    endpoint: process.env.S3_ENDPOINT || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    publicUrl: process.env.S3_PUBLIC_URL || '',
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'none') as 'none' | 'openai' | 'gemini',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    maxInputChars: parseInt(process.env.AI_MAX_INPUT_CHARS || '12000', 10),
  },
  discovery: {
    enablePlaywright: process.env.ENABLE_PLAYWRIGHT === 'true',
    browserTimeoutMs: parseInt(process.env.BROWSER_TIMEOUT_MS || '20000', 10),
    fetchTimeoutMs: parseInt(process.env.FETCH_TIMEOUT_MS || '15000', 10),
    maxPageSizeBytes: parseInt(process.env.MAX_PAGE_SIZE_BYTES || String(2 * 1024 * 1024), 10),
    maxPdfSizeBytes: parseInt(process.env.MAX_PDF_SIZE_BYTES || String(10 * 1024 * 1024), 10),
    defaultMaxCrawlDepth: parseInt(process.env.DEFAULT_MAX_CRAWL_DEPTH || '2', 10),
    defaultMaxPagesPerCycle: parseInt(process.env.DEFAULT_MAX_PAGES_PER_CYCLE || '50', 10),
    crawlConcurrencyPerSource: parseInt(process.env.CRAWL_CONCURRENCY_PER_SOURCE || '2', 10),
    allowLocalTestUrls: process.env.ALLOW_LOCAL_TEST_URLS === 'true',
    userAgent: process.env.CRAWLER_USER_AGENT || 'EventArtemisBot/1.0 (+https://event-artemis.local)',
  },
  worker: {
    enableInProcess: process.env.ENABLE_IN_PROCESS_WORKER !== 'false',
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
    pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL_MS || '3000', 10),
    schedulerIntervalMs: parseInt(process.env.SCHEDULER_POLL_INTERVAL_MS || '30000', 10),
    lockTimeoutMs: parseInt(process.env.JOB_LOCK_TIMEOUT_MS || '300000', 10),
    defaultSyncIntervalHours: parseInt(process.env.DEFAULT_SYNC_INTERVAL_HOURS || '12', 10),
    soonDeadlineIntervalHours: parseInt(process.env.SOON_DEADLINE_INTERVAL_HOURS || '4', 10),
    imminentEventIntervalHours: parseInt(process.env.IMMINENT_EVENT_INTERVAL_HOURS || '2', 10),
    redisUrl: process.env.REDIS_URL || '',
  },
};

