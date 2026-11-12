import { CampusEvent, ImportantLink } from '../types';

const PLACEHOLDER_VALUES = new Set([
  'n/a',
  'na',
  'tba',
  'location tba',
  'none',
  'null',
  'undefined',
  'not specified',
]);

export const hasValue = (val?: string | null): val is string => {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_VALUES.has(trimmed.toLowerCase());
};

export const getSafeHttpUrl = (raw?: string | null): string | null => {
  if (!hasValue(raw)) return null;
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    return new URL(trimmed).toString();
  } catch {
    return null;
  }
};

export const getEventMode = (event: CampusEvent): 'Online' | 'Offline' | 'Hybrid' => {
  if (event.format?.type) return event.format.type;
  const loc = (event.location || '').toLowerCase();
  if (loc.includes('online') || loc.includes('virtual') || loc.includes('meet') || loc.includes('zoom')) {
    return 'Online';
  }
  return 'Offline';
};

export const formatIsoDate = (iso?: string | null): string | null => {
  if (!hasValue(iso)) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const getUnifiedEventDate = (event: CampusEvent): string => {
  return event.date || `${event.dayOfMonth} May 2026`;
};

export const getUnifiedEventTime = (event: CampusEvent, isPast = false): string => {
  if (isPast) return 'Concluded';
  return event.time || '10:00 AM';
};

export const getRegistrationDeadline = (event: CampusEvent, isPast: boolean): string => {
  if (isPast) return 'Registration Closed';
  const isoFormatted = formatIsoDate(event.registrationDeadline);
  if (isoFormatted) return isoFormatted;

  if (event.registrationWindow) {
    const win = event.registrationWindow.replace(/^closes\s+/i, '').trim();
    if (win.includes('-')) return win.split('-')[1].trim();
    return win;
  }

  const day = event.dayOfMonth;
  const month = event.date ? event.date.split(' ')[1] || 'May' : 'May';
  const year = event.date ? event.date.split(' ')[2] || '2026' : '2026';
  const deadlineDay = Math.max(1, day - 1);
  return `${deadlineDay} ${month} ${year}`;
};

export const getOfficialUrl = (event: CampusEvent): string | null => {
  return getSafeHttpUrl(event.registrationUrl) || getSafeHttpUrl(event.sourceUrl);
};

export const buildImportantLinks = (event: CampusEvent): ImportantLink[] => {
  const links: ImportantLink[] = [];
  const seen = new Set<string>();

  const pushLink = (label: string, rawUrl?: string | null) => {
    const safeUrl = getSafeHttpUrl(rawUrl);
    if (!safeUrl || seen.has(safeUrl)) return;
    seen.add(safeUrl);
    links.push({ label: label.trim() || 'Official Link', url: safeUrl });
  };

  pushLink('Official Registration Link', event.registrationUrl);
  if (Array.isArray(event.importantLinks)) {
    for (const item of event.importantLinks) {
      if (item?.url) {
        pushLink(item.label || 'Event Resource', item.url);
      }
    }
  }
  if (Array.isArray(event.pdfUrls)) {
    for (const pdf of event.pdfUrls) {
      pushLink('Event Brochure / PDF', pdf);
    }
  }
  pushLink('Official Event Page', event.sourceUrl);

  return links.slice(0, 8);
};

