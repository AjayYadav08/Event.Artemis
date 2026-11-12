import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
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
};

