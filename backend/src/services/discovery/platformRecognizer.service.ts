import { SourceType } from '@prisma/client';

export type RecognizedPlatform =
  | 'unstop'
  | 'luma'
  | 'devfolio'
  | 'eventbrite'
  | 'devpost'
  | 'mlh'
  | 'college'
  | 'generic';

export interface AutoConfiguredSource {
  platform: RecognizedPlatform;
  name: string;
  sourceType: SourceType;
  description: string;
  syncIntervalHours: number;
  maxCrawlDepth: number;
  maxPagesPerCycle: number;
  isListingPage: boolean;
  extractionOptions: {
    platform: RecognizedPlatform;
    isListingPage: boolean;
    allowAiFallback: boolean;
    allowPdfExtraction: boolean;
  };
}

function titleCaseSegment(seg: string): string {
  return seg
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function cleanHostnameLabel(hostname: string): string {
  const parts = hostname.replace(/^www\./i, '').split('.');
  const core = parts.length >= 2 ? parts[0] : hostname;
  return titleCaseSegment(core);
}

/**
 * Automatically recognizes the platform, source type, human-readable name,
 * and optimal extraction/crawling configuration from a submitted URL alone.
 */
export function recognizeWebsiteSource(rawUrl: string): AutoConfiguredSource {
  const url = new URL(rawUrl.trim());
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const path = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  // 1. Unstop
  if (host === 'unstop.com' || host.endsWith('.unstop.com')) {
    const isListing =
      path === '/' ||
      segments.length === 1 ||
      path.includes('all-opportunities') ||
      ['hackathons', 'competitions', 'workshops', 'quizzes', 'scholarships', 'festivals'].includes(
        segments[segments.length - 1] || ''
      );
    const label = segments[0] ? titleCaseSegment(segments[0]) : 'Opportunities';
    return {
      platform: 'unstop',
      name: isListing ? `Unstop · ${label}` : `Unstop · ${titleCaseSegment(segments[segments.length - 1] || 'Event')}`,
      sourceType: isListing ? SourceType.EVENT_LISTING : SourceType.SINGLE_EVENT,
      description: `Auto-configured Unstop ${isListing ? 'listing' : 'event'} source`,
      syncIntervalHours: isListing ? 12 : 6,
      maxCrawlDepth: isListing ? 2 : 1,
      maxPagesPerCycle: isListing ? 30 : 1,
      isListingPage: isListing,
      extractionOptions: {
        platform: 'unstop',
        isListingPage: isListing,
        allowAiFallback: true,
        allowPdfExtraction: true,
      },
    };
  }

  // 2. Luma (lu.ma / luma.com)
  if (host === 'lu.ma' || host === 'luma.com' || host.endsWith('.lu.ma')) {
    const knownListingSlugs = new Set(['discover', 'explore', 'calendar', 'ai', 'tech', 'nyc', 'sf', 'blr', 'london']);
    const firstSeg = segments[0] || '';
    const isListing =
      path === '/' ||
      knownListingSlugs.has(firstSeg) ||
      segments[0] === 'calendar' ||
      segments[0] === 'user';

    const label = firstSeg ? titleCaseSegment(firstSeg) : 'Discover';
    return {
      platform: 'luma',
      name: `Luma · ${label}`,
      sourceType: isListing ? SourceType.EVENT_LISTING : SourceType.SINGLE_EVENT,
      description: `Auto-configured Luma ${isListing ? 'calendar/listing' : 'event'} source`,
      syncIntervalHours: isListing ? 12 : 6,
      maxCrawlDepth: isListing ? 2 : 1,
      maxPagesPerCycle: isListing ? 30 : 1,
      isListingPage: isListing,
      extractionOptions: {
        platform: 'luma',
        isListingPage: isListing,
        allowAiFallback: true,
        allowPdfExtraction: false,
      },
    };
  }

  // 3. Devfolio
  if (host === 'devfolio.co' || host.endsWith('.devfolio.co')) {
    const isSubdomainEvent = host !== 'devfolio.co' && !host.startsWith('www.');
    const isListing = !isSubdomainEvent && (path === '/' || path === '/hackathons' || path.startsWith('/discover'));
    const label = isSubdomainEvent
      ? cleanHostnameLabel(host)
      : segments[segments.length - 1]
        ? titleCaseSegment(segments[segments.length - 1])
        : 'Hackathons';
    return {
      platform: 'devfolio',
      name: `Devfolio · ${label}`,
      sourceType: isListing ? SourceType.EVENT_LISTING : SourceType.SINGLE_EVENT,
      description: `Auto-configured Devfolio ${isListing ? 'listing' : 'hackathon'} source`,
      syncIntervalHours: 12,
      maxCrawlDepth: isListing ? 2 : 1,
      maxPagesPerCycle: isListing ? 30 : 1,
      isListingPage: isListing,
      extractionOptions: {
        platform: 'devfolio',
        isListingPage: isListing,
        allowAiFallback: true,
        allowPdfExtraction: false,
      },
    };
  }

  // 4. Eventbrite
  if (host.includes('eventbrite.')) {
    const isSingle = segments[0] === 'e';
    const isListing = !isSingle;
    return {
      platform: 'eventbrite',
      name: `Eventbrite · ${segments[segments.length - 1] ? titleCaseSegment(segments[segments.length - 1].replace(/-\d+$/, '')) : 'Events'}`,
      sourceType: isListing ? SourceType.EVENT_LISTING : SourceType.SINGLE_EVENT,
      description: `Auto-configured Eventbrite ${isListing ? 'listing' : 'event'} source`,
      syncIntervalHours: 12,
      maxCrawlDepth: isListing ? 2 : 1,
      maxPagesPerCycle: isListing ? 30 : 1,
      isListingPage: isListing,
      extractionOptions: {
        platform: 'eventbrite',
        isListingPage: isListing,
        allowAiFallback: true,
        allowPdfExtraction: false,
      },
    };
  }

  // 5. Devpost / MLH
  if (host.endsWith('devpost.com') || host.endsWith('mlh.io')) {
    const platform: RecognizedPlatform = host.endsWith('mlh.io') ? 'mlh' : 'devpost';
    const isListing =
      host === 'devpost.com' ||
      host === 'mlh.io' ||
      path.includes('/hackathons') ||
      path.includes('/events');
    return {
      platform,
      name: `${platform === 'mlh' ? 'MLH' : 'Devpost'} · ${cleanHostnameLabel(host)}`,
      sourceType: isListing ? SourceType.EVENT_LISTING : SourceType.SINGLE_EVENT,
      description: `Auto-configured ${platform.toUpperCase()} ${isListing ? 'listing' : 'event'} source`,
      syncIntervalHours: 12,
      maxCrawlDepth: isListing ? 2 : 1,
      maxPagesPerCycle: isListing ? 30 : 1,
      isListingPage: isListing,
      extractionOptions: {
        platform,
        isListingPage: isListing,
        allowAiFallback: true,
        allowPdfExtraction: false,
      },
    };
  }

  // 6. College / Institution Websites
  const isAcademicDomain =
    host.endsWith('.edu') ||
    host.endsWith('.ac.in') ||
    host.endsWith('.edu.in') ||
    host.includes('university') ||
    host.includes('college') ||
    host.includes('institute');

  const listingPathKeywords = ['events', 'calendar', 'fests', 'workshops', 'competitions', 'activities', 'announcements', 'upcoming'];
  const lastSeg = segments[segments.length - 1] || '';
  const looksLikeListing =
    path === '/' ||
    listingPathKeywords.includes(lastSeg) ||
    path.endsWith('/events') ||
    path.endsWith('/college-events');

  if (isAcademicDomain) {
    return {
      platform: 'college',
      name: `${cleanHostnameLabel(host)} · ${looksLikeListing ? 'Campus Events' : titleCaseSegment(lastSeg)}`,
      sourceType: looksLikeListing ? SourceType.COLLEGE_WEBSITE : SourceType.SINGLE_EVENT,
      description: `Auto-configured institution ${looksLikeListing ? 'event discovery' : 'event'} source`,
      syncIntervalHours: looksLikeListing ? 18 : 12,
      maxCrawlDepth: looksLikeListing ? 2 : 1,
      maxPagesPerCycle: looksLikeListing ? 50 : 1,
      isListingPage: looksLikeListing,
      extractionOptions: {
        platform: 'college',
        isListingPage: looksLikeListing,
        allowAiFallback: true,
        allowPdfExtraction: true,
      },
    };
  }

  // 7. Generic event or listing website
  const hostLabel = cleanHostnameLabel(host);
  const pathLabel = lastSeg ? titleCaseSegment(lastSeg) : 'Events';
  return {
    platform: 'generic',
    name: `${hostLabel} · ${pathLabel}`.slice(0, 120),
    sourceType: looksLikeListing ? SourceType.EVENT_LISTING : SourceType.SINGLE_EVENT,
    description: `Auto-configured ${looksLikeListing ? 'event listing' : 'event'} source`,
    syncIntervalHours: looksLikeListing ? 18 : 12,
    maxCrawlDepth: looksLikeListing ? 2 : 1,
    maxPagesPerCycle: looksLikeListing ? 40 : 1,
    isListingPage: looksLikeListing,
    extractionOptions: {
      platform: 'generic',
      isListingPage: looksLikeListing,
      allowAiFallback: true,
      allowPdfExtraction: true,
    },
  };
}

