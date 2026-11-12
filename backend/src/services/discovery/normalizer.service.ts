import { EventCategory, LocationType, ParticipationMode, TeamMode } from '@prisma/client';
import { NormalizedEventPayload, RawExtractedEvent } from './extraction.types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function stripHtmlTags(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

export interface ParsedDateResult {
  date: Date | null;
  ambiguous: boolean;
  warning?: string;
}

/**
 * Parses diverse date strings ("15 December 2026", "Dec 15, 2026", "2026-12-15", ISO 8601).
 * Flags dates without a 4-digit year as ambiguous rather than assuming current year.
 */
export function parseFlexibleDate(raw?: string | null): ParsedDateResult {
  if (!raw || !raw.trim()) return { date: null, ambiguous: false };
  const trimmed = raw.trim();

  if (!/\b20\d{2}\b/.test(trimmed)) {
    return {
      date: null,
      ambiguous: true,
      warning: `Date "${trimmed}" is missing a 4-digit year and requires administrator review`,
    };
  }

  // ISO format YYYY-MM-DD or full ISO
  const isoMatch = trimmed.match(/\b(20\d{2})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const hour = isoMatch[4] ? Number(isoMatch[4]) : 10;
    const min = isoMatch[5] ? Number(isoMatch[5]) : 0;
    const d = new Date(Date.UTC(year, month, day, hour, min));
    if (!Number.isNaN(d.getTime()) && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return { date: d, ambiguous: false };
    }
    return { date: null, ambiguous: true, warning: `Invalid calendar date "${trimmed}"` };
  }

  // Named month formats: "15 December 2026" or "Dec 15, 2026" (parsed in UTC to avoid timezone day-shift)
  const monthLookup: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };
  const dmyMatch = trimmed.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/);
  if (dmyMatch && monthLookup[dmyMatch[2].toLowerCase()] !== undefined) {
    const day = Number(dmyMatch[1]);
    const month = monthLookup[dmyMatch[2].toLowerCase()];
    const year = Number(dmyMatch[3]);
    const d = new Date(Date.UTC(year, month, day, 10, 0));
    if (!Number.isNaN(d.getTime()) && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return { date: d, ambiguous: false };
    }
  }
  const mdyMatch = trimmed.match(/\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(20\d{2})\b/);
  if (mdyMatch && monthLookup[mdyMatch[1].toLowerCase()] !== undefined) {
    const month = monthLookup[mdyMatch[1].toLowerCase()];
    const day = Number(mdyMatch[2]);
    const year = Number(mdyMatch[3]);
    const d = new Date(Date.UTC(year, month, day, 10, 0));
    if (!Number.isNaN(d.getTime()) && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return { date: d, ambiguous: false };
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() >= 2020 && parsed.getUTCFullYear() <= 2035) {
    return { date: parsed, ambiguous: false };
  }

  return {
    date: null,
    ambiguous: true,
    warning: `Could not reliably parse date "${trimmed}"`,
  };
}

function normalizeCategory(raw?: string | null, title = '', desc = ''): EventCategory {
  const combined = `${raw || ''} ${title} ${desc}`.toLowerCase();
  if (/\bfest\b|\bcarnival\b|\bcultural\b/.test(combined)) return 'Fest';
  if (/\bworkshop\b|\bbootcamp\b|\bhands-on\b|\btraining\b/.test(combined)) return 'Workshop';
  if (/\bseminar\b|\btalk\b|\bwebinar\b|\bsymposium\b|\bconference\b/.test(combined)) return 'Seminar';
  return 'Competition';
}

function normalizeParticipationMode(raw?: string | null, location = ''): ParticipationMode {
  const combined = `${raw || ''} ${location}`.toLowerCase();
  if (/\bhybrid\b/.test(combined)) return 'Hybrid';
  if (/\bonline\b|\bvirtual\b|\bremote\b/.test(combined)) return 'Online';
  return 'Offline';
}

function normalizeTeamMode(raw?: string | null, teamSize = ''): TeamMode {
  const combined = `${raw || ''} ${teamSize}`.toLowerCase();
  if (/\bsolo\b|\bindividual\b/.test(combined) && !/\bteam\b/.test(combined)) return 'Solo';
  if (/\bteam\b/.test(combined) && !/\bsolo\b|\bboth\b|\bindividual\b/.test(combined)) return 'Team';
  return 'Both';
}

function normalizeDomain(raw?: string | null, title = '', desc = ''): string {
  if (raw && raw.trim()) return raw.trim();
  const combined = `${title} ${desc}`.toLowerCase();
  if (/\bai\b|\bmachine learning\b|\bml\b|\bllm\b|\bdata science\b/.test(combined)) return 'AI & ML';
  if (/\bweb3\b|\bblockchain\b|\bcrypto\b/.test(combined)) return 'Web3 & Blockchain';
  if (/\bcyber\b|\bsecurity\b|\bctf\b/.test(combined)) return 'Cybersecurity';
  if (/\brobotics\b|\biot\b|\bhardware\b/.test(combined)) return 'Robotics & IoT';
  if (/\bdesign\b|\bui\/ux\b|\bfigma\b/.test(combined)) return 'Design & UI/UX';
  if (/\bhackathon\b|\bcoding\b|\bsoftware\b|\bapp\b/.test(combined)) return 'Software & Web';
  return 'General Technology';
}

function normalizeUrl(raw?: string | null, fallbackUrl = ''): string | null {
  const candidate = raw?.trim() || fallbackUrl;
  if (!candidate) return null;
  try {
    const u = new URL(candidate);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
    return null;
  } catch {
    return null;
  }
}

export interface NormalizationOutput {
  payload: NormalizedEventPayload;
  extractedFields: string[];
  missingFields: string[];
  validationWarnings: string[];
  confidence: number;
}

/**
 * Normalizes and validates raw extracted event fields into Event Artemis's Event schema.
 */
export function normalizeAndValidateEvent(
  raw: RawExtractedEvent,
  sourcePageUrl: string,
  baseConfidence = 0.6
): NormalizationOutput {
  const validationWarnings: string[] = [];
  const title = stripHtmlTags(raw.title) || 'Untitled Discovered Event';
  if (!raw.title) {
    validationWarnings.push('Event title was missing and defaulted');
  }

  const description = stripHtmlTags(raw.description) || stripHtmlTags(raw.shortDescription);
  const startParsed = parseFlexibleDate(raw.eventStartDate);
  if (startParsed.warning) validationWarnings.push(startParsed.warning);

  const deadlineParsed = parseFlexibleDate(raw.registrationDeadline);
  if (deadlineParsed.warning) validationWarnings.push(deadlineParsed.warning);

  const regStartParsed = parseFlexibleDate(raw.registrationStart);
  const endParsed = parseFlexibleDate(raw.eventEndDate);

  // Use parsed eventDate or safe future placeholder flagged with warning
  let eventDateObj = startParsed.date;
  if (!eventDateObj) {
    eventDateObj = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    validationWarnings.push('Event start date could not be extracted; requires review before publishing');
  }

  let deadlineObj = deadlineParsed.date;
  if (deadlineObj && eventDateObj && deadlineObj.getTime() > eventDateObj.getTime()) {
    validationWarnings.push('Registration deadline appears to be after the event start date');
  }

  const dayOfMonth = eventDateObj.getUTCDate();
  const displayDate = `${dayOfMonth} ${MONTH_NAMES[eventDateObj.getUTCMonth()]} ${eventDateObj.getUTCFullYear()}`;
  const displayTime = eventDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });

  const location =
    stripHtmlTags(raw.location) ||
    [raw.venue, raw.city, raw.state, raw.country].filter(Boolean).join(', ') ||
    'Location TBA';
  if (location === 'Location TBA') {
    validationWarnings.push('Event location/venue could not be extracted');
  }

  const participationMode = normalizeParticipationMode(raw.participationMode, location);
  const locationType: LocationType =
    participationMode === 'Online' || /off[- ]?campus|hotel|convention/i.test(location)
      ? 'OffCampus'
      : 'OnCampus';

  const category = normalizeCategory(raw.category, title, description || '');
  const normalizedTracks = Array.isArray(raw.tracks) ? raw.tracks.filter(Boolean) : [];
  const domain = normalizeDomain(raw.domain || normalizedTracks[0], title, description || '');
  const teamSize =
    stripHtmlTags(raw.teamSize) ||
    (raw.minTeamSize && raw.maxTeamSize ? `${raw.minTeamSize}-${raw.maxTeamSize} Members` : '1-4 Members');
  const teamMode = normalizeTeamMode(raw.teamMode, teamSize);

  const registrationUrl = normalizeUrl(raw.registrationUrl || raw.applicationUrl, sourcePageUrl);
  const websiteUrl = normalizeUrl(raw.eventWebsiteUrl, sourcePageUrl);

  // Build deduplicated importantLinks list
  const importantLinks: Array<{ label: string; url: string }> = [];
  const seenImportantUrls = new Set<string>();
  const pushImportantLink = (label?: string | null, rawUrl?: string | null) => {
    const normalized = normalizeUrl(rawUrl, sourcePageUrl);
    if (!normalized || seenImportantUrls.has(normalized)) return;
    seenImportantUrls.add(normalized);
    importantLinks.push({
      label: stripHtmlTags(label) || 'Official Link',
      url: normalized,
    });
  };

  if (registrationUrl) pushImportantLink('Official Registration Link', registrationUrl);
  if (Array.isArray(raw.importantLinks)) {
    for (const item of raw.importantLinks) {
      if (item && typeof item.url === 'string') {
        pushImportantLink(item.label || 'Event Link', item.url);
      }
    }
  }
  if (Array.isArray(raw.pdfUrls)) {
    for (const pdf of raw.pdfUrls) {
      pushImportantLink('Event Brochure / PDF', pdf);
    }
  }
  if (websiteUrl && websiteUrl !== registrationUrl) {
    pushImportantLink('Official Event Page', websiteUrl);
  }

  const posterUrl =
    normalizeUrl(raw.posterUrl) ||
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';

  const entryFee = stripHtmlTags(raw.entryFee) || 'Free';
  const isPaid = raw.isPaid ?? !/free|^0$|none/i.test(entryFee);

  const payload: NormalizedEventPayload = {
    title,
    category,
    date: displayDate,
    dayOfMonth,
    time: displayTime,
    eventDate: eventDateObj.toISOString(),
    registrationStart: regStartParsed.date ? regStartParsed.date.toISOString() : null,
    registrationDeadline: deadlineObj ? deadlineObj.toISOString() : null,
    location,
    campus: stripHtmlTags(raw.campus),
    domain,
    conductingAgency: stripHtmlTags(raw.conductingAgency),
    locationType,
    participationMode,
    teamMode,
    registrationWindow: deadlineObj
      ? `Closes ${deadlineObj.getUTCDate()} ${MONTH_NAMES[deadlineObj.getUTCMonth()]} ${deadlineObj.getUTCFullYear()}`
      : null,
    registrationUrl,
    xp: category === 'Competition' ? 750 : 400,
    description,
    venueDetails: stripHtmlTags(raw.venue) || location,
    prizePool: stripHtmlTags(raw.prizePool),
    tracks: normalizedTracks,
    posterUrl,
    eligibility: stripHtmlTags(raw.eligibility) || 'All Students',
    teamSize,
    certification: raw.certification ?? true,
    prizesList: Array.isArray(raw.prizesList)
      ? raw.prizesList.map((p, idx) => ({
          title: p.title || p.position || `Prize ${idx + 1}`,
          amount: p.amount,
          desc: p.desc || p.description || '',
          color: p.color || 'from-amber-400 to-yellow-500',
        }))
      : [],
    rules: Array.isArray(raw.rules) ? raw.rules.filter(Boolean) : [],
    rounds: Array.isArray(raw.rounds) ? raw.rounds.filter(Boolean) : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
    organizerContact: raw.organizerContact ?? null,
    isPaid,
    registrationFee: entryFee,
    duration: stripHtmlTags(raw.duration),
    dos: Array.isArray(raw.dos) ? raw.dos.filter(Boolean) : [],
    donts: Array.isArray(raw.donts) ? raw.donts.filter(Boolean) : [],
    sourceUrl: sourcePageUrl,
    externalSourceId: raw.externalEventId ?? null,
    sourceMetadata: {
      shortDescription: stripHtmlTags(raw.shortDescription),
      timezone: raw.timezone || null,
      eventEndDate: endParsed.date ? endParsed.date.toISOString() : null,
      pdfUrls: raw.pdfUrls || [],
      importantLinks: importantLinks.slice(0, 12),
      requiredResources: raw.requiredResources || [],
      otherRewards: raw.otherRewards || [],
      additionalInformation: raw.additionalInformation || null,
    },
  };

  const trackableFields: Array<[string, unknown]> = [
    ['title', raw.title],
    ['description', description],
    ['eventDate', startParsed.date],
    ['registrationDeadline', deadlineObj],
    ['location', location !== 'Location TBA' ? location : null],
    ['conductingAgency', payload.conductingAgency],
    ['prizePool', payload.prizePool],
    ['eligibility', raw.eligibility],
    ['registrationUrl', registrationUrl],
    ['participationMode', raw.participationMode],
    ['teamSize', raw.teamSize],
    ['registrationFee', raw.entryFee],
    ['rules', payload.rules.length > 0 ? payload.rules : null],
    ['tracks', payload.tracks.length > 0 ? payload.tracks : null],
  ];

  const extractedFields = trackableFields.filter(([, v]) => Boolean(v)).map(([k]) => k);
  const missingFields = trackableFields.filter(([, v]) => !v).map(([k]) => k);

  const penalty = Math.min(0.35, validationWarnings.length * 0.08);
  const confidence = Number(Math.max(0.15, Math.min(0.98, baseConfidence - penalty)).toFixed(2));

  return {
    payload,
    extractedFields,
    missingFields,
    validationWarnings,
    confidence,
  };
}

