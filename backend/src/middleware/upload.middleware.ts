import multer from 'multer';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'audio/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'text/plain',
]);

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new ApiError(
          400,
          `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, PDF, audio, TXT.`
        )
      );
    }
    cb(null, true);
  },
});

