import { ExtractionMethod } from '@prisma/client';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { safeFetch } from './safeFetch';
import { isUrlAllowedByRobots } from './robots.service';
import { extractStructuredData } from './structuredExtractor';
import { extractFromStaticHtml, discoverEventLinks } from './htmlExtractor';
import { needsDynamicBrowserRendering, renderWithPlaywright } from './browserExtractor';
import { extractWithAi } from './aiExtractor';
import { extractFromPdfBuffer } from './pdfExtractor';
import { ExtractionResult, RawExtractedEvent } from './extraction.types';

export interface PageExtractionResponse {
  notModified: boolean;
  finalUrl: string;
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  isPdf: boolean;
  extraction: ExtractionResult | null;
}

function mergeRawEvents(primary: RawExtractedEvent, secondary: RawExtractedEvent): RawExtractedEvent {
  const merged: Record<string, any> = { ...primary };
  for (const [k, v] of Object.entries(secondary)) {
    if ((merged[k] === null || merged[k] === undefined || merged[k] === '') && v !== null && v !== undefined && v !== '') {
      merged[k] = v;
    }
  }
  return merged as RawExtractedEvent;
}

/**
 * Runs the 4-tier modular extraction pipeline on a single URL.
 * Priority: Structured Data -> Static HTML -> Playwright (if SPA) -> AI (if unstructured & configured).
 */
export async function fetchAndExtractPage(
  targetUrl: string,
  cacheHeaders: { etag?: string | null; lastModified?: string | null; previousHash?: string | null; allowAiFallback?: boolean } = {}
): Promise<PageExtractionResponse> {
  const allowed = await isUrlAllowedByRobots(targetUrl);
  if (!allowed) {
    throw new ApiError(403, `Crawling disallowed by robots.txt for ${targetUrl}`);
  }

  const isPdfUrl = targetUrl.toLowerCase().split('?')[0].endsWith('.pdf');
  const fetchRes = await safeFetch(targetUrl, {
    etag: cacheHeaders.etag,
    lastModified: cacheHeaders.lastModified,
    maxBytes: isPdfUrl ? env.discovery.maxPdfSizeBytes : env.discovery.maxPageSizeBytes,
  });

  if (fetchRes.notModified || (cacheHeaders.previousHash && fetchRes.contentHash === cacheHeaders.previousHash)) {
    return {
      notModified: true,
      finalUrl: fetchRes.finalUrl,
      etag: fetchRes.etag,
      lastModified: fetchRes.lastModified,
      contentHash: fetchRes.contentHash,
      isPdf: isPdfUrl,
      extraction: null,
    };
  }

  const isPdf = fetchRes.contentType.includes('application/pdf') || isPdfUrl;
  if (isPdf) {
    const pdfResult = await extractFromPdfBuffer(fetchRes.buffer, fetchRes.finalUrl);
    return {
      notModified: false,
      finalUrl: fetchRes.finalUrl,
      etag: fetchRes.etag,
      lastModified: fetchRes.lastModified,
      contentHash: fetchRes.contentHash,
      isPdf: true,
      extraction: pdfResult,
    };
  }

  let html = fetchRes.text;
  let methodUsed: ExtractionMethod = ExtractionMethod.STATIC_HTML;
  let warnings: string[] = [];

  // Tier 1: Official API / JSON-LD / Open Graph
  let structured = extractStructuredData(html, fetchRes.finalUrl, fetchRes.contentType);
  // Tier 2: Static HTML (Cheerio) + Link Discovery
  let staticRes = fetchRes.contentType.includes('application/json')
    ? null
    : extractFromStaticHtml(html, fetchRes.finalUrl);

  // Tier 3: Playwright dynamic rendering only when static HTML is an empty SPA shell
  if (
    !fetchRes.contentType.includes('application/json') &&
    needsDynamicBrowserRendering(html, staticRes?.rawTextSnippet.length ?? 0)
  ) {
    if (env.discovery.enablePlaywright) {
      try {
        const rendered = await renderWithPlaywright(fetchRes.finalUrl);
        html = rendered.html;
        warnings.push(...rendered.warnings);
        structured = extractStructuredData(html, rendered.finalUrl, 'text/html') ?? structured;
        staticRes = extractFromStaticHtml(html, rendered.finalUrl);
        methodUsed = ExtractionMethod.DYNAMIC_BROWSER;
      } catch (err) {
        warnings.push(`Dynamic browser extraction skipped: ${(err as Error).message}`);
      }
    } else if (!structured) {
      warnings.push('Page appears JavaScript-rendered, but Playwright is disabled');
    }
  }

  let combinedEvents: RawExtractedEvent[] = [];
  let confidence = 0.35;
  let fieldProvenance: Record<string, 'EXPLICIT' | 'INFERRED' | 'MISSING'> = {};
  const discoveredLinks = staticRes?.discoveredLinks ?? discoverEventLinks(html, fetchRes.finalUrl);

  if (structured && structured.events.length > 0) {
    methodUsed = structured.method;
    confidence = structured.confidence;
    fieldProvenance = structured.fieldProvenance;
    combinedEvents = structured.events.map((ev, idx) =>
      idx === 0 && staticRes?.events[0] ? mergeRawEvents(ev, staticRes.events[0]) : ev
    );
  } else if (staticRes && staticRes.events.length > 0) {
    confidence = staticRes.confidence;
    fieldProvenance = staticRes.fieldProvenance;
    combinedEvents = staticRes.events;
  }

  // Tier 4: AI fallback only if unstructured/missing critical fields & AI enabled
  let aiCallsUsed = 0;
  const primary = combinedEvents[0];
  const needsAi =
    cacheHeaders.allowAiFallback !== false &&
    env.ai.provider !== 'none' &&
    Boolean(env.ai.apiKey) &&
    (!primary || !primary.eventStartDate || !primary.venue || confidence < 0.6);

  if (needsAi && staticRes?.rawTextSnippet) {
    try {
      const aiRes = await extractWithAi(staticRes.rawTextSnippet, fetchRes.finalUrl);
      if (aiRes) {
        aiCallsUsed = aiRes.aiCallsUsed;
        warnings.push(...aiRes.warnings);
        if (aiRes.events.length > 0) {
          if (primary) {
            combinedEvents[0] = mergeRawEvents(primary, aiRes.events[0]);
          } else {
            combinedEvents = aiRes.events;
          }
          if (!structured) {
            methodUsed = ExtractionMethod.AI_EXTRACTION;
            confidence = Math.max(confidence, aiRes.confidence);
            fieldProvenance = { ...aiRes.fieldProvenance, ...fieldProvenance };
          }
        }
      }
    } catch (err) {
      warnings.push(`AI extraction failed safely: ${(err as Error).message}`);
    }
  }

  return {
    notModified: false,
    finalUrl: fetchRes.finalUrl,
    etag: fetchRes.etag,
    lastModified: fetchRes.lastModified,
    contentHash: fetchRes.contentHash,
    isPdf: false,
    extraction: {
      method: methodUsed,
      confidence,
      events: combinedEvents,
      discoveredLinks,
      rawTextSnippet: staticRes?.rawTextSnippet || '',
      fieldProvenance,
      aiCallsUsed,
      warnings,
    },
  };
}

