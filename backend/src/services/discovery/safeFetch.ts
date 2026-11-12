import crypto from 'crypto';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { validateExternalUrl } from './ssrf.service';

export interface SafeFetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  etag?: string | null;
  lastModified?: string | null;
  accept?: string;
}

export interface SafeFetchResult {
  finalUrl: string;
  status: number;
  notModified: boolean;
  contentType: string;
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  buffer: Buffer;
  text: string;
}

const MAX_REDIRECTS = 5;

async function readBodyWithLimit(res: Response, maxBytes: number): Promise<Buffer> {
  const contentLength = res.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new ApiError(413, `Response size exceeds maximum allowed limit of ${maxBytes} bytes`);
  }

  if (!res.body) {
    return Buffer.alloc(0);
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new ApiError(413, `Response stream exceeded maximum allowed limit of ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
  }

  return Buffer.concat(chunks);
}

/**
 * Fetches an external URL safely with SSRF validation on initial URL and every redirect,
 * response size enforcement, timeout control, and conditional ETag/Last-Modified caching.
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxBytes = options.maxBytes ?? env.discovery.maxPageSizeBytes;
  const timeoutMs = options.timeoutMs ?? env.discovery.fetchTimeoutMs;

  let currentUrl = targetUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    await validateExternalUrl(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'User-Agent': env.discovery.userAgent,
        Accept: options.accept || 'text/html,application/xhtml+xml,application/json,application/pdf;q=0.9,*/*;q=0.8',
      };
      if (options.etag && redirectCount === 0) {
        headers['If-None-Match'] = options.etag;
      }
      if (options.lastModified && redirectCount === 0) {
        headers['If-Modified-Since'] = options.lastModified;
      }

      const res = await fetch(currentUrl, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });

      if (res.status === 304) {
        return {
          finalUrl: currentUrl,
          status: 304,
          notModified: true,
          contentType: res.headers.get('content-type') || '',
          etag: res.headers.get('etag') || options.etag || null,
          lastModified: res.headers.get('last-modified') || options.lastModified || null,
          contentHash: null,
          buffer: Buffer.alloc(0),
          text: '',
        };
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
          throw new ApiError(502, `Redirect (${res.status}) missing Location header`);
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (res.status >= 400) {
        throw new ApiError(res.status === 403 || res.status === 401 ? res.status : 502, `Upstream returned HTTP ${res.status}`);
      }

      const buffer = await readBodyWithLimit(res, maxBytes);
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const isBinaryPdf = contentType.includes('application/pdf') || currentUrl.toLowerCase().endsWith('.pdf');
      const text = isBinaryPdf ? '' : buffer.toString('utf8');

      return {
        finalUrl: currentUrl,
        status: res.status,
        notModified: false,
        contentType,
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
        contentHash,
        buffer,
        text,
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new ApiError(504, `Request timed out after ${timeoutMs}ms`);
      }
      throw new ApiError(502, `Network error fetching URL: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ApiError(502, `Exceeded maximum redirect limit (${MAX_REDIRECTS})`);
}

