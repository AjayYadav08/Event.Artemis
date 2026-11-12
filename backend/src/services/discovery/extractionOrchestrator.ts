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
import { refineRawEventWithSectionClassification } from './contentClassifier.service';

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

function mapUnstopOpportunity(item: any, fallbackUrl: string): RawExtractedEvent | null {
  const title = item?.title || item?.name;
  if (!title) return null;
  const publicUrl = item?.public_url
    ? `https://unstop.com/${String(item.public_url).replace(/^\/+/, '')}`
    : item?.seo_url || fallbackUrl;

  const prizes = Array.isArray(item?.prizes) ? item.prizes : [];
  const totalCash = prizes.reduce((sum: number, p: any) => sum + (Number(p?.cash) || 0), 0);
  const prizePool = totalCash > 0 ? `INR ${totalCash.toLocaleString('en-IN')}` : null;

  const rawMapped: RawExtractedEvent = {
    title,
    description: item?.details || item?.seo_details?.[0]?.description || null,
    posterUrl: item?.banner_mobile?.image_url || item?.logoUrl2 || null,
    category: item?.type || item?.subtype || null,
    eventStartDate: item?.start_date || null,
    eventEndDate: item?.end_date || null,
    registrationStart: item?.regnRequirements?.start_regn_dt || null,
    registrationDeadline: item?.regnRequirements?.end_regn_dt || null,
    location: item?.region === 'online' ? 'Online' : item?.jobDetail?.locations?.[0] || item?.organisation?.name || null,
    participationMode: item?.region === 'online' ? 'Online' : 'Offline',
    conductingAgency: item?.organisation?.name || null,
    prizePool,
    teamSize:
      item?.regnRequirements?.min_team_size && item?.regnRequirements?.max_team_size
        ? `${item.regnRequirements.min_team_size}-${item.regnRequirements.max_team_size} Members`
        : null,
    registrationUrl: publicUrl,
    eventWebsiteUrl: publicUrl,
    externalEventId: item?.id ? String(item.id) : null,
  };
  return refineRawEventWithSectionClassification(rawMapped, item?.details || undefined);
}

async function tryUnstopPublicApi(targetUrl: string): Promise<PageExtractionResponse | null> {
  try {
    const u = new URL(targetUrl);
    if (!u.hostname.toLowerCase().endsWith('unstop.com')) return null;

    const idMatch = u.pathname.match(/-(\d{4,10})\/?$/);
    if (idMatch?.[1]) {
      const apiUrl = `https://unstop.com/api/public/competition/${idMatch[1]}`;
      const res = await safeFetch(apiUrl, { accept: 'application/json', timeoutMs: 8000 });
      const json = JSON.parse(res.text) as any;
      const comp = json?.data?.competition;
      const mapped = mapUnstopOpportunity(comp, targetUrl);
      if (mapped) {
        return {
          notModified: false,
          finalUrl: targetUrl,
          etag: res.etag,
          lastModified: res.lastModified,
          contentHash: res.contentHash,
          isPdf: false,
          extraction: {
            method: ExtractionMethod.STRUCTURED_DATA,
            confidence: 0.94,
            events: [mapped],
            discoveredLinks: [],
            rawTextSnippet: JSON.stringify(comp).slice(0, 1500),
            fieldProvenance: { title: 'EXPLICIT', eventStartDate: 'EXPLICIT', registrationDeadline: 'EXPLICIT' },
            aiCallsUsed: 0,
            warnings: [],
          },
        };
      }
    }

    // Listing page
    const seg = u.pathname.split('/').filter(Boolean)[0] || 'hackathons';
    const oppType = ['hackathons', 'competitions', 'workshops', 'quizzes'].includes(seg) ? seg : 'hackathons';
    const listApiUrl = `https://unstop.com/api/public/opportunity/search-result?opportunity=${oppType}&per_page=15&oppstatus=open`;
    const res = await safeFetch(listApiUrl, { accept: 'application/json', timeoutMs: 8000 });
    const json = JSON.parse(res.text) as any;
    const rows = Array.isArray(json?.data?.data) ? json.data.data : [];
    const events = rows
      .map((r: any) => mapUnstopOpportunity(r, targetUrl))
      .filter((e: RawExtractedEvent | null): e is RawExtractedEvent => Boolean(e));

    if (events.length > 0) {
      return {
        notModified: false,
        finalUrl: targetUrl,
        etag: res.etag,
        lastModified: res.lastModified,
        contentHash: res.contentHash,
        isPdf: false,
        extraction: {
          method: ExtractionMethod.STRUCTURED_DATA,
          confidence: 0.92,
          events,
          discoveredLinks: [],
          rawTextSnippet: res.text.slice(0, 1500),
          fieldProvenance: { title: 'EXPLICIT', eventStartDate: 'EXPLICIT' },
          aiCallsUsed: 0,
          warnings: [],
        },
      };
    }
  } catch {
    // Fall back gracefully to standard HTML/JSON-LD/Playwright extraction
  }
  return null;
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

  const unstopApiResult = await tryUnstopPublicApi(targetUrl);
  if (unstopApiResult) {
    return unstopApiResult;
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
    combinedEvents = structured.events.map((ev, idx) => {
      const refined = refineRawEventWithSectionClassification(ev);
      return idx === 0 && staticRes?.events[0] ? mergeRawEvents(refined, staticRes.events[0]) : refined;
    });
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

