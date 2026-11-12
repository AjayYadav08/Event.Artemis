import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface StoredFileResult {
  storageKey: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface StorageProvider {
  saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string
  ): Promise<StoredFileResult>;
  getFileStream(storageKey: string): Promise<Readable>;
  deleteFile(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'audio/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'text/plain': '.txt',
};

/**
 * Validates file buffer magic bytes so we do not trust file extensions alone.
 */
export function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  if (buffer.length < 4) return false;

  if (declaredMime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (declaredMime === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (declaredMime === 'image/gif') {
    return buffer.subarray(0, 3).toString('ascii') === 'GIF';
  }
  if (declaredMime === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (declaredMime === 'application/pdf') {
    return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  }
  if (declaredMime === 'audio/webm') {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }
  if (declaredMime === 'audio/ogg') {
    return buffer.subarray(0, 4).toString('ascii') === 'OggS';
  }
  if (declaredMime === 'audio/wav') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  }
  if (declaredMime === 'audio/mpeg') {
    return (
      buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    );
  }
  if (declaredMime === 'text/plain') {
    return true;
  }
  return false;
}

class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(this.baseDir, normalized);
    if (!fullPath.startsWith(this.baseDir)) {
      throw new ApiError(400, 'Invalid storage key');
    }
    return fullPath;
  }

  async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'general'
  ): Promise<StoredFileResult> {
    const safeExt = MIME_TO_EXT[mimeType] || '';
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileId = uuidv4();
    const storageKey = `${safeFolder}/${fileId}${safeExt}`;
    const fullPath = this.resolveSafePath(storageKey);

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);

    const sanitizedName = path
      .basename(originalName)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 120);

    return {
      storageKey,
      fileUrl: `/api/v1/attachments/file/${encodeURIComponent(storageKey)}`,
      fileName: sanitizedName || `${fileId}${safeExt}`,
      fileType: mimeType,
      fileSize: buffer.length,
    };
  }

  async getFileStream(storageKey: string): Promise<Readable> {
    const fullPath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new ApiError(404, 'File not found in storage');
    }
    return fs.createReadStream(fullPath);
  }

  async deleteFile(storageKey: string): Promise<void> {
    const fullPath = this.resolveSafePath(storageKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(storageKey);
    return fs.existsSync(fullPath);
  }
}

/**
 * S3-compatible object storage adapter placeholder for production.
 * Configured via S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.
 */
class S3StorageProvider implements StorageProvider {
  async saveFile(): Promise<StoredFileResult> {
    if (!env.s3.bucket || !env.s3.accessKeyId || !env.s3.secretAccessKey) {
      throw new ApiError(500, 'S3 storage provider selected but S3 credentials are not configured');
    }
    throw new ApiError(501, 'Install @aws-sdk/client-s3 to enable direct S3 uploads');
  }

  async getFileStream(): Promise<Readable> {
    throw new ApiError(501, 'S3 stream retrieval requires @aws-sdk/client-s3');
  }

  async deleteFile(): Promise<void> {
    throw new ApiError(501, 'S3 delete requires @aws-sdk/client-s3');
  }

  async exists(): Promise<boolean> {
    return false;
  }
}

export const storageService: StorageProvider =
  env.storageProvider === 's3'
    ? new S3StorageProvider()
    : new LocalStorageProvider(env.uploadDir);

