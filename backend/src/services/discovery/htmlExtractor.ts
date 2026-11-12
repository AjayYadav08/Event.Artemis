import * as cheerio from 'cheerio';
import { ExtractionMethod } from '@prisma/client';
import { ExtractionResult, RawExtractedEvent } from './extraction.types';

const EVENT_KEYWORDS = [
  'hackathon', 'event', 'workshop', 'seminar', 'fest', 'symposium',
  'competition', 'contest', 'conference', 'summit', 'bootcamp', 'ideathon',
  'coding', 'robotics', 'datathon', 'challenge', 'register', 'apply',
];

const IGNORE_LINK_PATTERNS = [
  /\/login/i, /\/signin/i, /\/signup/i, /\/logout/i, /\/auth/i,
  /\/privacy/i, /\/terms/i, /\/cookie/i, /\/contact-us/i, /\/about-us/i,
  /\/careers/i, /\/alumni/i, /\/admissions/i, /\/archive\/\d{4}\/\d{2}/i,
  /mailto:/i, /tel:/i, /javascript:/i,
];

function scoreEventLink(urlStr: string, anchorText: string, contextText: string): number {
  const lowerUrl = urlStr.toLowerCase();
  const lowerText = `${anchorText} ${contextText}`.toLowerCase();

  for (const pat of IGNORE_LINK_PATTERNS) {
    if (pat.test(lowerUrl)) return -100;
  }

  let score = 0;
  for (const kw of EVENT_KEYWORDS) {
    if (lowerUrl.includes(kw)) score += 3;
    if (lowerText.includes(kw)) score += 2;
  }
  if (lowerUrl.endsWith('.pdf') && (lowerText.includes('brochure') || lowerText.includes('event') || lowerText.includes('schedule') || lowerText.includes('rule'))) {
    score += 4;
  }
  if (/\b202[5-9]\b/.test(lowerUrl) || /\b202[5-9]\b/.test(lowerText)) {
    score += 2;
  }
  return score;
}

/**
 * Discovers relevant event detail links and PDF links from a listing or institution page.
 */
export function discoverEventLinks(
  html: string,
  baseUrl: string
): Array<{ url: string; title: string; score: number; isPdf: boolean }> {
  const $ = cheerio.load(html);
  const baseOrigin = new URL(baseUrl).origin;
  const seen = new Set<string>();
  const links: Array<{ url: string; title: string; score: number; isPdf: boolean }> = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#')) return;

    let resolved: URL;
    try {
      resolved = new URL(href, baseUrl);
    } catch {
      return;
    }

    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return;
    resolved.hash = '';
    const cleanUrl = resolved.toString();
    if (cleanUrl === baseUrl || seen.has(cleanUrl)) return;

    const anchorText = $(el).text().replace(/\s+/g, ' ').trim();
    const contextText = $(el).closest('article, section, li, div, tr').text().replace(/\s+/g, ' ').trim().slice(0, 240);
    const score = scoreEventLink(cleanUrl, anchorText, contextText);

    // Stay on same origin unless it's a known event/registration platform or high-scoring event link
    const isSameOrigin = resolved.origin === baseOrigin;
    const isPdf = cleanUrl.toLowerCase().endsWith('.pdf');

    if (score >= 3 && (isSameOrigin || score >= 6)) {
      seen.add(cleanUrl);
      links.push({
        url: cleanUrl,
        title: anchorText || resolved.pathname,
        score,
        isPdf,
      });
    }
  });

  return links.sort((a, b) => b.score - a.score);
}

function extractLabeledField(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const regex = new RegExp(`(?:^|\\n)\\s*${label}\\s*[:\\-–]\\s*([^\\n]{2,160})`, 'i');
    const match = text.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractDateCandidate(text: string, contextRegex: RegExp): string | null {
  const match = text.match(contextRegex);
  if (match?.[1]) return match[1].trim();
  return null;
}

/**
 * Method 2: Static HTML extraction using Cheerio (headings, metadata, tables, lists, text patterns).
 */
export function extractFromStaticHtml(html: string, pageUrl: string): ExtractionResult {
  const $ = cheerio.load(html);

  const discoveredLinks = discoverEventLinks(html, pageUrl);
  const pdfUrls = discoveredLinks.filter((l) => l.isPdf).map((l) => l.url);

  // Extract key-value pairs from tables & definition lists before stripping
  const structuredPairs: string[] = [];
  $('table tr').each((_, tr) => {
    const cells = $(tr).find('th, td').map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim()).get();
    if (cells.length >= 2 && cells[0] && cells[1]) {
      structuredPairs.push(`${cells[0]}: ${cells[1]}`);
    }
  });
  $('dl').each((_, dl) => {
    $(dl).find('dt').each((__, dt) => {
      const dd = $(dt).next('dd');
      if (dd.length) {
        structuredPairs.push(`${$(dt).text().trim()}: ${dd.text().trim()}`);
      }
    });
  });

  // Remove noisy boilerplate elements
  $('script, style, noscript, svg, iframe').remove();

  const metaTitle =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').text().replace(/\s+/g, ' ').trim();
  const h1Title = $('h1').first().text().replace(/\s+/g, ' ').trim();
  const title = h1Title || metaTitle || null;

  const ogDesc =
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    null;

  const ogImage =
    $('meta[property="og:image"]').attr('content')?.trim() ||
    $('main img, article img, .hero img').first().attr('src')?.trim() ||
    null;

  let posterUrl: string | null = null;
  if (ogImage) {
    try {
      posterUrl = new URL(ogImage, pageUrl).toString();
    } catch {
      posterUrl = null;
    }
  }

  const bodyLines = $('main, article, body')
    .first()
    .text()
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  const fullCleanText = [...structuredPairs, ...bodyLines].join('\n');
  const paragraphs = $('main p, article p, p')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter((p) => p.length > 25);

  const description = ogDesc || paragraphs.slice(0, 3).join('\n\n') || null;

  // Date patterns
  const datePattern = '((?:\\d{1,2}\\s+[A-Za-z]{3,9}\\s+20\\d{2})|(?:[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+20\\d{2})|(?:20\\d{2}-\\d{2}-\\d{2}))';
  const eventStartDate =
    extractLabeledField(fullCleanText, ['Event Date', 'Start Date', 'Date', 'When']) ||
    extractDateCandidate(fullCleanText, new RegExp(`(?:event\\s+date|starts?\\s+on|held\\s+on|date)\\s*[:\\-]?\\s*${datePattern}`, 'i')) ||
    extractDateCandidate(fullCleanText, new RegExp(datePattern, 'i'));

  const registrationDeadline =
    extractLabeledField(fullCleanText, ['Registration Deadline', 'Last Date to Register', 'Apply By', 'Deadline', 'Closing Date']) ||
    extractDateCandidate(fullCleanText, new RegExp(`(?:registration\\s+deadline|apply\\s+by|last\\s+date|closes?\\s+on|deadline)\\s*[:\\-]?\\s*${datePattern}`, 'i'));

  const venue = extractLabeledField(fullCleanText, ['Venue', 'Location', 'Address', 'Where', 'Campus']);
  const prizePool =
    extractLabeledField(fullCleanText, ['Prize Pool', 'Prizes', 'Total Prize', 'Reward', 'Cash Prize']) ||
    (fullCleanText.match(/(?:prize\s+pool|prizes?\s+worth)\s*[:\-]?\s*([₹$€£]\s?[\d,]+(?:\s*(?:lakhs?|k|crore))?|(?:INR|USD)\s*[\d,]+)/i)?.[1] ?? null);
  const eligibility = extractLabeledField(fullCleanText, ['Eligibility', 'Who Can Participate', 'Open To', 'Participants']);
  const teamSize = extractLabeledField(fullCleanText, ['Team Size', 'Group Size', 'Members']);
  const entryFee = extractLabeledField(fullCleanText, ['Entry Fee', 'Registration Fee', 'Fee', 'Ticket Price']);
  const conductingAgency =
    extractLabeledField(fullCleanText, ['Organizer', 'Organized By', 'Conducted By', 'Hosted By', 'Institution']) ||
    $('meta[property="og:site_name"]').attr('content')?.trim() ||
    null;

  let participationMode: string | null = extractLabeledField(fullCleanText, ['Mode', 'Participation Mode', 'Format']);
  if (!participationMode) {
    if (/\bhybrid\b/i.test(fullCleanText)) participationMode = 'Hybrid';
    else if (/\bonline\b|\bvirtual\b/i.test(fullCleanText)) participationMode = 'Online';
    else if (/\boffline\b|\bin[- ]person\b|\bon[- ]campus\b/i.test(fullCleanText)) participationMode = 'Offline';
  }

  // Registration URL
  let registrationUrl: string | null = null;
  $('a[href]').each((_, el) => {
    if (registrationUrl) return;
    const text = $(el).text().trim().toLowerCase();
    const href = $(el).attr('href')?.trim();
    if (!href) return;
    if (/(register|apply\s*now|participate|join\s*now|rsvp)/i.test(text) || /devfolio|unstop|lu\.ma|forms\.gle|eventbrite/i.test(href)) {
      try {
        registrationUrl = new URL(href, pageUrl).toString();
      } catch {
        // ignore invalid link
      }
    }
  });

  // Rules & FAQs
  const rules: string[] = [];
  $('h2, h3, h4').each((_, heading) => {
    const hText = $(heading).text().toLowerCase();
    if (hText.includes('rule') || hText.includes('guideline') || hText.includes('instruction')) {
      $(heading).nextAll('ul, ol').first().find('li').each((__, li) => {
        const txt = $(li).text().replace(/\s+/g, ' ').trim();
        if (txt) rules.push(txt);
      });
    }
  });

  const emailMatch = fullCleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = fullCleanText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);

  const rawEvent: RawExtractedEvent = {
    title,
    description,
    posterUrl,
    eventStartDate,
    registrationDeadline,
    venue,
    location: venue,
    participationMode,
    prizePool,
    eligibility,
    teamSize,
    entryFee,
    isPaid: entryFee ? !/free|0|none/i.test(entryFee) : null,
    conductingAgency,
    registrationUrl: registrationUrl || pageUrl,
    eventWebsiteUrl: pageUrl,
    organizerContact: emailMatch || phoneMatch ? { email: emailMatch?.[0], phone: phoneMatch?.[0] } : null,
    rules: rules.length > 0 ? rules : null,
    pdfUrls: pdfUrls.length > 0 ? pdfUrls : null,
  };

  const provenance: Record<string, 'EXPLICIT' | 'INFERRED' | 'MISSING'> = {};
  let populatedCount = 0;
  for (const [k, v] of Object.entries(rawEvent)) {
    if (v !== null && v !== undefined && v !== '') {
      provenance[k] = 'EXPLICIT';
      populatedCount++;
    } else {
      provenance[k] = 'MISSING';
    }
  }

  const confidence = Math.min(0.88, Math.max(0.25, populatedCount / 12));

  return {
    method: ExtractionMethod.STATIC_HTML,
    confidence: Number(confidence.toFixed(2)),
    events: title ? [rawEvent] : [],
    discoveredLinks,
    rawTextSnippet: fullCleanText.slice(0, 6000),
    fieldProvenance: provenance,
    aiCallsUsed: 0,
    warnings: [],
  };
}

