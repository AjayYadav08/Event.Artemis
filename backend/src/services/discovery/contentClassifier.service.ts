import * as cheerio from 'cheerio';
import { RawExtractedEvent } from './extraction.types';

export interface ClassifiedSections {
  overview: string | null;
  shortDescription: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  registrationStart: string | null;
  registrationDeadline: string | null;
  duration: string | null;
  venue: string | null;
  campus: string | null;
  eligibility: string | null;
  teamSize: string | null;
  entryFee: string | null;
  prizePool: string | null;
  prizesList: Array<{ title: string; amount: string; desc: string; color: string }>;
  certification: boolean | null;
  tracks: string[];
  rules: string[];
  rounds: string[];
  timeline: Array<{ time: string; title: string; desc: string }>;
  faqs: Array<{ q: string; a: string }>;
  dos: string[];
  donts: string[];
  organizerContact: { phone?: string; email?: string } | null;
  registrationProcess: string | null;
  extraSections: Record<string, string>;
}

type SectionBucket =
  | 'overview'
  | 'dates'
  | 'eligibility'
  | 'prizes'
  | 'rules'
  | 'tracks'
  | 'rounds'
  | 'faqs'
  | 'dos'
  | 'donts'
  | 'venue'
  | 'contact'
  | 'registration'
  | 'other';

function classifyHeading(heading: string): SectionBucket {
  const h = heading.toLowerCase().trim();
  if (/^(about|overview|introduction|description|summary|what is|theme overview)/.test(h) || /\babout\b|\boverview\b/.test(h)) {
    return 'overview';
  }
  if (/date|timeline|schedule|agenda|itinerary|calendar|deadline/.test(h)) return 'dates';
  if (/eligib|who can|participant|criteria|qualification/.test(h)) return 'eligibility';
  if (/prize|reward|award|perk|bounty|cash|winning/.test(h)) return 'prizes';
  if (/rule|regulation|guideline|terms|code of conduct|instruction/.test(h)) return 'rules';
  if (/track|domain|theme|problem statement|category|topic/.test(h)) return 'tracks';
  if (/round|stage|phase|format/.test(h)) return 'rounds';
  if (/faq|frequently asked|question/.test(h)) return 'faqs';
  if (/^do'?s\b/.test(h)) return 'dos';
  if (/don'?ts\b/.test(h)) return 'donts';
  if (/venue|location|campus|address|where|direction/.test(h)) return 'venue';
  if (/contact|help|support|reach out|organizer/.test(h)) return 'contact';
  if (/registr|how to apply|application process/.test(h)) return 'registration';
  return 'other';
}

function splitItems(text: string): string[] {
  return text
    .split(/\n+|•|▪|◦/)
    .map((s) => s.replace(/^[\s\-*\d.)]+/, '').trim())
    .filter((s) => s.length >= 3 && s.length <= 280);
}

const DATE_PATTERN =
  '((?:\\d{1,2}\\s+[A-Za-z]{3,9}\\s+20\\d{2})|(?:[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+20\\d{2})|(?:20\\d{2}-\\d{2}-\\d{2}))';

function matchFirst(text: string, regex: RegExp): string | null {
  const m = text.match(regex);
  return m?.[1]?.trim() || null;
}

/**
 * Parses HTML or multi-section text into distinct semantic sections and extracts
 * structured Event fields so unrelated sections never collapse into `description`.
 */
export function classifyContentIntoSections(htmlOrText: string): ClassifiedSections {
  const isHtml = /<[a-z][\s\S]*>/i.test(htmlOrText);
  const sectionMap: Record<SectionBucket, string[]> = {
    overview: [],
    dates: [],
    eligibility: [],
    prizes: [],
    rules: [],
    tracks: [],
    rounds: [],
    faqs: [],
    dos: [],
    donts: [],
    venue: [],
    contact: [],
    registration: [],
    other: [],
  };
  const extraSections: Record<string, string> = {};
  const listItemsByBucket: Record<SectionBucket, string[]> = {
    overview: [],
    dates: [],
    eligibility: [],
    prizes: [],
    rules: [],
    tracks: [],
    rounds: [],
    faqs: [],
    dos: [],
    donts: [],
    venue: [],
    contact: [],
    registration: [],
    other: [],
  };

  if (isHtml) {
    const $ = cheerio.load(htmlOrText);
    $('script, style, noscript, nav, footer, header, svg, iframe').remove();

    let currentBucket: SectionBucket = 'overview';
    let currentHeading = 'Overview';

    const root = $('main, article').first().length ? $('main, article').first() : $('body').first();
    const blocks = root.find('h1, h2, h3, h4, h5, p, ul, ol, table, dl');

    blocks.each((_, el) => {
      const tag = el.tagName?.toLowerCase() || '';
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;

      if (/^h[1-5]$/.test(tag)) {
        // Avoid nested heading duplication
        currentHeading = text;
        currentBucket = classifyHeading(text);
        return;
      }

      // Skip paragraphs that are inside another already-processed list/table
      if (tag === 'p' && $(el).parents('li, td, th').length > 0) return;

      if (tag === 'ul' || tag === 'ol') {
        $(el)
          .find('li')
          .each((__, li) => {
            const liText = $(li).text().replace(/\s+/g, ' ').trim();
            if (liText) {
              listItemsByBucket[currentBucket].push(liText);
            }
          });
        return;
      }

      if (tag === 'table') {
        $(el)
          .find('tr')
          .each((__, tr) => {
            const cells = $(tr)
              .find('th, td')
              .map((___, c) => $(c).text().replace(/\s+/g, ' ').trim())
              .get();
            if (cells.length >= 2) {
              sectionMap[currentBucket].push(`${cells[0]}: ${cells.slice(1).join(' - ')}`);
            }
          });
        return;
      }

      if (currentBucket === 'other') {
        extraSections[currentHeading] = [extraSections[currentHeading], text].filter(Boolean).join('\n');
      } else {
        sectionMap[currentBucket].push(text);
      }
    });

    // Fallback if page had no semantic headings/p blocks
    if (sectionMap.overview.length === 0 && Object.values(sectionMap).every((arr) => arr.length === 0)) {
      const fallbackText = root.text().replace(/\r\n/g, '\n').trim();
      if (fallbackText) {
        return classifyPlainTextSections(fallbackText);
      }
    }
  } else {
    return classifyPlainTextSections(htmlOrText);
  }

  return buildClassifiedResult(sectionMap, listItemsByBucket, extraSections, htmlOrText);
}

function classifyPlainTextSections(text: string): ClassifiedSections {
  const sectionMap: Record<SectionBucket, string[]> = {
    overview: [],
    dates: [],
    eligibility: [],
    prizes: [],
    rules: [],
    tracks: [],
    rounds: [],
    faqs: [],
    dos: [],
    donts: [],
    venue: [],
    contact: [],
    registration: [],
    other: [],
  };
  const listItemsByBucket: Record<SectionBucket, string[]> = {
    overview: [],
    dates: [],
    eligibility: [],
    prizes: [],
    rules: [],
    tracks: [],
    rounds: [],
    faqs: [],
    dos: [],
    donts: [],
    venue: [],
    contact: [],
    registration: [],
    other: [],
  };
  const extraSections: Record<string, string> = {};

  let currentBucket: SectionBucket = 'overview';
  let currentHeading = 'Overview';

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect markdown headings or standalone labeled section headers
    const mdHeading = line.match(/^#{1,4}\s+(.+)$/);
    const labelHeading =
      !mdHeading && line.length <= 65 && /^[A-Za-z][A-Za-z0-9\s&/'()-]{2,55}:$/.test(line)
        ? line.slice(0, -1)
        : null;

    if (mdHeading || labelHeading) {
      currentHeading = (mdHeading?.[1] || labelHeading || '').trim();
      currentBucket = classifyHeading(currentHeading);
      continue;
    }

    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      listItemsByBucket[currentBucket].push(line.replace(/^([-*•]|\d+\.)\s+/, '').trim());
    } else if (currentBucket === 'other') {
      extraSections[currentHeading] = [extraSections[currentHeading], line].filter(Boolean).join('\n');
    } else {
      sectionMap[currentBucket].push(line);
    }
  }

  return buildClassifiedResult(sectionMap, listItemsByBucket, extraSections, text);
}

function buildClassifiedResult(
  sectionMap: Record<SectionBucket, string[]>,
  listItemsByBucket: Record<SectionBucket, string[]>,
  extraSections: Record<string, string>,
  rawInput: string
): ClassifiedSections {
  const $raw = cheerio.load(rawInput);
  $raw('script, style, noscript').remove();
  const blockLines = $raw('h1, h2, h3, h4, h5, p, li, tr, dt, dd')
    .map((_, el) => $raw(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean);
  const plainAll = blockLines.length > 0 ? blockLines.join('\n') : $raw.text().replace(/[ \t]+/g, ' ').trim();

  // Overview: ONLY the overview bucket, trimmed to concise overview paragraphs
  const overviewParagraphs = sectionMap.overview
    .filter((p) => p.length >= 20)
    .filter((p) => !/^(?:event\s+date|registration\s+deadline|prize\s+pool|venue|eligibility|entry\s+fee)\s*:/i.test(p));
  const overview = overviewParagraphs.slice(0, 3).join('\n\n') || null;
  const shortDescription = overviewParagraphs[0]?.slice(0, 220) || null;

  const datesText = [...sectionMap.dates, ...listItemsByBucket.dates, plainAll].join('\n');
  const eventStartDate = matchFirst(
    datesText,
    new RegExp(`(?:event\\s+start(?:\\s+date)?|event\\s+date|starts?\\s+on|held\\s+on)\\s*[:\\-]?\\s*${DATE_PATTERN}`, 'i')
  );
  const eventEndDate = matchFirst(
    datesText,
    new RegExp(`(?:event\\s+end(?:\\s+date)?|ends?\\s+on|concludes?\\s+on)\\s*[:\\-]?\\s*${DATE_PATTERN}`, 'i')
  );
  const registrationStart = matchFirst(
    datesText,
    new RegExp(`(?:registration\\s+opens?|registration\\s+start(?:\\s+date)?|applications?\\s+open)\\s*[:\\-]?\\s*${DATE_PATTERN}`, 'i')
  );
  const registrationDeadline = matchFirst(
    datesText,
    new RegExp(`(?:registration\\s+deadline|last\\s+date(?:\\s+to\\s+register)?|apply\\s+by|closes?\\s+on|deadline)\\s*[:\\-]?\\s*${DATE_PATTERN}`, 'i')
  );
  const duration = matchFirst(datesText, /(?:duration|length)\s*[:\-]\s*([^\n.]{2,50})/i);

  const timeline: Array<{ time: string; title: string; desc: string }> = [];
  for (const item of [...sectionMap.dates, ...listItemsByBucket.dates].slice(0, 8)) {
    const colonIdx = item.indexOf(':');
    if (colonIdx > 0 && colonIdx < 40) {
      timeline.push({
        time: item.slice(0, colonIdx).trim(),
        title: item.slice(colonIdx + 1).trim(),
        desc: '',
      });
    }
  }

  const venueText = [...sectionMap.venue, ...listItemsByBucket.venue].join('\n');
  const venue =
    matchFirst(venueText || plainAll, /(?:venue|location|address)\s*[:\-]\s*([^\n]{3,140})/i) ||
    (venueText ? venueText.slice(0, 140) : null);
  const campus = matchFirst(venueText || plainAll, /(?:campus|university|college|institute)\s*[:\-]\s*([^\n]{3,100})/i);

  const eligText = [...sectionMap.eligibility, ...listItemsByBucket.eligibility].join('; ');
  const eligibility =
    eligText ||
    matchFirst(plainAll, /(?:eligibility|who\s+can\s+participate|open\s+to)\s*[:\-]\s*([^\n.]{3,160})/i);

  const teamSize = matchFirst(plainAll, /(?:team\s+size|group\s+size|participants\s+per\s+team)\s*[:\-]\s*([^\n.]{2,60})/i);
  const entryFee = matchFirst(plainAll, /(?:entry\s+fee|registration\s+fee|ticket\s+price|fee)\s*[:\-]\s*([^\n.]{1,50})/i);

  const prizesText = [...sectionMap.prizes, ...listItemsByBucket.prizes].join('\n');
  const prizePool =
    matchFirst(
      prizesText || plainAll,
      /(?:prize\s+pool|total\s+prizes?|prizes?\s+worth)\s*[:\-]?\s*([₹$€£]\s?[\d,]+(?:\s*(?:lakhs?|k|crore))?|(?:INR|USD|EUR)\s*[\d,]+)/i
    ) ||
    matchFirst(prizesText, /([₹$€£]\s?[\d,]+(?:\s*(?:lakhs?|k|crore))?)/i);

  const prizeColors = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-orange-400 to-amber-600'];
  const prizesList = listItemsByBucket.prizes.slice(0, 5).map((item, idx) => {
    const amt = item.match(/([₹$€£]\s?[\d,]+(?:\s*(?:lakhs?|k|crore))?|(?:INR|USD)\s*[\d,]+)/i)?.[1] || 'Reward';
    return {
      title: item.split(/[:\-–]/)[0].trim().slice(0, 50) || `Prize ${idx + 1}`,
      amount: amt,
      desc: item,
      color: prizeColors[idx % prizeColors.length],
    };
  });

  const certification =
    /certificate|certification/i.test(`${prizesText} ${plainAll}`)
      ? !/no\s+certificate/i.test(`${prizesText} ${plainAll}`)
      : null;

  const tracks = Array.from(
    new Set(
      [...listItemsByBucket.tracks, ...sectionMap.tracks.flatMap((t) => t.split(/,|•/).map((s) => s.trim()))]
        .filter((s) => s.length >= 2 && s.length <= 80)
    )
  ).slice(0, 12);

  const rules = Array.from(
    new Set([...listItemsByBucket.rules, ...sectionMap.rules.flatMap(splitItems)])
  ).slice(0, 15);

  const rounds = Array.from(
    new Set([...listItemsByBucket.rounds, ...sectionMap.rounds.flatMap(splitItems)])
  ).slice(0, 10);

  const dos = Array.from(new Set([...listItemsByBucket.dos, ...sectionMap.dos.flatMap(splitItems)])).slice(0, 10);
  const donts = Array.from(new Set([...listItemsByBucket.donts, ...sectionMap.donts.flatMap(splitItems)])).slice(0, 10);

  const faqs: Array<{ q: string; a: string }> = [];
  for (const line of [...sectionMap.faqs, ...listItemsByBucket.faqs]) {
    const qMatch = line.match(/^(?:Q\d*[:.\s]+)?(.+\?)\s*(?:A[:.\s]+)?(.*)$/i);
    if (qMatch?.[1] && qMatch?.[2]) {
      faqs.push({ q: qMatch[1].trim(), a: qMatch[2].trim() });
    }
  }

  const contactText = [...sectionMap.contact, ...listItemsByBucket.contact, plainAll].join(' ');
  const email = contactText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const phone = contactText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0];

  return {
    overview,
    shortDescription,
    eventStartDate,
    eventEndDate,
    registrationStart,
    registrationDeadline,
    duration,
    venue,
    campus,
    eligibility,
    teamSize,
    entryFee,
    prizePool,
    prizesList,
    certification,
    tracks,
    rules,
    rounds,
    timeline,
    faqs,
    dos,
    donts,
    organizerContact: email || phone ? { email, phone } : null,
    registrationProcess: sectionMap.registration.join('\n') || null,
    extraSections,
  };
}

/**
 * Enriches a RawExtractedEvent by classifying multi-section HTML/text descriptions
 * into individual structured fields and keeping only the clean Overview in `description`.
 */
export function refineRawEventWithSectionClassification(
  raw: RawExtractedEvent,
  rawHtmlOrText?: string
): RawExtractedEvent {
  const sourceContent = rawHtmlOrText || raw.description || '';
  if (!sourceContent) return raw;

  const classified = classifyContentIntoSections(sourceContent);

  return {
    ...raw,
    shortDescription: raw.shortDescription || classified.shortDescription,
    description: classified.overview || raw.description,
    eventStartDate: raw.eventStartDate || classified.eventStartDate,
    eventEndDate: raw.eventEndDate || classified.eventEndDate,
    registrationStart: raw.registrationStart || classified.registrationStart,
    registrationDeadline: raw.registrationDeadline || classified.registrationDeadline,
    duration: raw.duration || classified.duration,
    venue: raw.venue || classified.venue,
    campus: raw.campus || classified.campus,
    location: raw.location || classified.venue || classified.campus,
    eligibility: raw.eligibility || classified.eligibility,
    teamSize: raw.teamSize || classified.teamSize,
    entryFee: raw.entryFee || classified.entryFee,
    prizePool: raw.prizePool || classified.prizePool,
    prizesList: raw.prizesList && raw.prizesList.length > 0 ? raw.prizesList : classified.prizesList.length > 0 ? classified.prizesList : null,
    certification: raw.certification ?? classified.certification,
    tracks: raw.tracks && raw.tracks.length > 0 ? raw.tracks : classified.tracks.length > 0 ? classified.tracks : null,
    rules: raw.rules && raw.rules.length > 0 ? raw.rules : classified.rules.length > 0 ? classified.rules : null,
    rounds: raw.rounds && raw.rounds.length > 0 ? raw.rounds : classified.rounds.length > 0 ? classified.rounds : null,
    timeline: raw.timeline && raw.timeline.length > 0 ? raw.timeline : classified.timeline.length > 0 ? classified.timeline : null,
    faqs: raw.faqs && raw.faqs.length > 0 ? raw.faqs : classified.faqs.length > 0 ? classified.faqs : null,
    dos: raw.dos && raw.dos.length > 0 ? raw.dos : classified.dos.length > 0 ? classified.dos : null,
    donts: raw.donts && raw.donts.length > 0 ? raw.donts : classified.donts.length > 0 ? classified.donts : null,
    organizerContact: raw.organizerContact || classified.organizerContact,
    additionalInformation: {
      ...(raw.additionalInformation || {}),
      ...(classified.registrationProcess ? { registrationProcess: classified.registrationProcess } : {}),
      ...(Object.keys(classified.extraSections).length > 0 ? { extraSections: classified.extraSections } : {}),
    },
  };
}
