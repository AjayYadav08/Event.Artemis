import * as cheerio from 'cheerio';
import { ExtractionMethod } from '@prisma/client';
import { ExtractionResult, RawExtractedEvent } from './extraction.types';

function mapSchemaOrgEvent(node: Record<string, any>, pageUrl: string): RawExtractedEvent | null {
  const typeVal = node['@type'];
  const types = Array.isArray(typeVal) ? typeVal : [typeVal];
  const isEvent = types.some(
    (t) =>
      typeof t === 'string' &&
      ['event', 'hackathon', 'educationevent', 'socialevent', 'festival', 'businessevent'].includes(
        t.toLowerCase()
      )
  );
  if (!isEvent && !node.startDate && !node.name) return null;

  const locationObj = node.location;
  let venue: string | null = null;
  let city: string | null = null;
  let state: string | null = null;
  let country: string | null = null;
  let participationMode: string | null = null;

  if (typeof node.eventAttendanceMode === 'string') {
    const mode = node.eventAttendanceMode.toLowerCase();
    if (mode.includes('online')) participationMode = 'Online';
    else if (mode.includes('mixed')) participationMode = 'Hybrid';
    else if (mode.includes('offline')) participationMode = 'Offline';
  }

  if (typeof locationObj === 'string') {
    venue = locationObj;
  } else if (locationObj && typeof locationObj === 'object') {
    const loc = Array.isArray(locationObj) ? locationObj[0] : locationObj;
    if (loc?.['@type'] === 'VirtualLocation') {
      participationMode = participationMode || 'Online';
      venue = loc.url || 'Online';
    } else if (loc) {
      venue = loc.name || null;
      const addr = loc.address;
      if (typeof addr === 'string') {
        venue = venue ? `${venue}, ${addr}` : addr;
      } else if (addr && typeof addr === 'object') {
        city = addr.addressLocality || null;
        state = addr.addressRegion || null;
        country = addr.addressCountry || null;
        if (!venue && addr.streetAddress) venue = addr.streetAddress;
      }
    }
  }

  const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
  const price = offers?.price !== undefined ? String(offers.price) : null;
  const currency = offers?.priceCurrency || '';
  const entryFee = price ? (price === '0' ? 'Free' : `${currency} ${price}`.trim()) : null;
  const registrationUrl = offers?.url || node.url || pageUrl;

  const organizer = Array.isArray(node.organizer) ? node.organizer[0] : node.organizer;
  const conductingAgency =
    typeof organizer === 'string' ? organizer : organizer?.name || null;

  const image = Array.isArray(node.image) ? node.image[0] : node.image;
  const posterUrl = typeof image === 'string' ? image : image?.url || null;

  return {
    title: node.name || null,
    description: node.description || null,
    posterUrl,
    eventStartDate: node.startDate || null,
    eventEndDate: node.endDate || null,
    registrationDeadline: node.validThrough || offers?.validThrough || null,
    venue,
    city,
    state,
    country,
    location: [venue, city, state, country].filter(Boolean).join(', ') || null,
    participationMode,
    conductingAgency,
    entryFee,
    isPaid: price ? price !== '0' && price !== '0.00' : null,
    registrationUrl,
    eventWebsiteUrl: node.url || pageUrl,
    externalEventId: node.identifier ? String(node.identifier) : null,
  };
}

function collectJsonLdNodes(data: unknown, out: Record<string, any>[]): void {
  if (!data || typeof data !== 'object') return;
  if (Array.isArray(data)) {
    for (const item of data) collectJsonLdNodes(item, out);
    return;
  }
  const obj = data as Record<string, any>;
  if (obj['@graph']) {
    collectJsonLdNodes(obj['@graph'], out);
  }
  if (obj['@type'] === 'ItemList' && Array.isArray(obj.itemListElement)) {
    for (const el of obj.itemListElement) {
      collectJsonLdNodes(el.item || el, out);
    }
  }
  if (obj['@type']) {
    out.push(obj);
  }
}

/**
 * Method 1: Extracts event data from JSON APIs, JSON-LD Schema.org metadata,
 * Open Graph tags, and embedded structured JSON blocks.
 */
export function extractStructuredData(
  bodyText: string,
  pageUrl: string,
  contentType = ''
): ExtractionResult | null {
  // 1A. Direct JSON API payload
  if (contentType.includes('application/json') || bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
    try {
      const json = JSON.parse(bodyText);
      const items = Array.isArray(json)
        ? json
        : Array.isArray(json.events)
          ? json.events
          : Array.isArray(json.data)
            ? json.data
            : [json];

      const events: RawExtractedEvent[] = [];
      for (const item of items) {
        if (item && typeof item === 'object' && (item.title || item.name)) {
          events.push({
            title: item.title || item.name,
            description: item.description || item.summary || null,
            eventStartDate: item.eventDate || item.startDate || item.date || null,
            eventEndDate: item.endDate || null,
            registrationDeadline: item.registrationDeadline || item.deadline || null,
            location: item.location || item.venue || null,
            campus: item.campus || null,
            category: item.category || null,
            domain: item.domain || null,
            conductingAgency: item.organizer || item.conductingAgency || null,
            participationMode: item.participationMode || item.mode || null,
            prizePool: item.prizePool || item.prize || null,
            eligibility: item.eligibility || null,
            registrationUrl: item.registrationUrl || item.url || pageUrl,
            posterUrl: item.posterUrl || item.image || null,
            externalEventId: item.id ? String(item.id) : null,
          });
        }
      }
      if (events.length > 0) {
        return {
          method: ExtractionMethod.STRUCTURED_DATA,
          confidence: 0.95,
          events,
          discoveredLinks: [],
          rawTextSnippet: bodyText.slice(0, 1000),
          fieldProvenance: { title: 'EXPLICIT', eventStartDate: 'EXPLICIT' },
          aiCallsUsed: 0,
          warnings: [],
        };
      }
    } catch {
      // Not valid JSON, continue to HTML structured parsing
    }
  }

  const $ = cheerio.load(bodyText);
  const jsonLdNodes: Record<string, any>[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      collectJsonLdNodes(parsed, jsonLdNodes);
    } catch {
      // Ignore malformed JSON-LD block
    }
  });

  const events: RawExtractedEvent[] = [];
  for (const node of jsonLdNodes) {
    const mapped = mapSchemaOrgEvent(node, pageUrl);
    if (mapped && mapped.title) {
      events.push(mapped);
    }
  }

  if (events.length > 0) {
    const provenance: Record<string, 'EXPLICIT' | 'INFERRED' | 'MISSING'> = {};
    const first = events[0];
    for (const [k, v] of Object.entries(first)) {
      if (v !== null && v !== undefined && v !== '') provenance[k] = 'EXPLICIT';
    }
    return {
      method: ExtractionMethod.STRUCTURED_DATA,
      confidence: 0.92,
      events,
      discoveredLinks: [],
      rawTextSnippet: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1500),
      fieldProvenance: provenance,
      aiCallsUsed: 0,
      warnings: [],
    };
  }

  // 1B. Open Graph fallback only if og:type is event-like or has event meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim() || $('meta[name="description"]').attr('content')?.trim();
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim();
  const ogType = $('meta[property="og:type"]').attr('content')?.toLowerCase() || '';
  const eventStart = $('meta[property="event:start_time"]').attr('content')?.trim();

  if (ogTitle && (ogType.includes('event') || Boolean(eventStart))) {
    return {
      method: ExtractionMethod.STRUCTURED_DATA,
      confidence: 0.78,
      events: [
        {
          title: ogTitle,
          description: ogDesc || null,
          posterUrl: ogImage || null,
          eventStartDate: eventStart || null,
          eventEndDate: $('meta[property="event:end_time"]').attr('content')?.trim() || null,
          eventWebsiteUrl: pageUrl,
          registrationUrl: pageUrl,
        },
      ],
      discoveredLinks: [],
      rawTextSnippet: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1500),
      fieldProvenance: { title: 'EXPLICIT', description: ogDesc ? 'EXPLICIT' : 'MISSING' },
      aiCallsUsed: 0,
      warnings: [],
    };
  }

  return null;
}

