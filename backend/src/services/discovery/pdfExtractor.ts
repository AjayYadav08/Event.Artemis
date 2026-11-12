import { ExtractionMethod } from '@prisma/client';
import { ExtractionResult, RawExtractedEvent } from './extraction.types';
import { extractWithAi } from './aiExtractor';

// pdf-parse exports a default function in CJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (dataBuffer: Buffer) => Promise<{ text: string; numpages: number }>;

/**
 * Extracts text and structured event fields from a publicly accessible PDF buffer.
 * Validates %PDF- magic bytes and flags scanned/image-only PDFs for OCR review.
 */
export async function extractFromPdfBuffer(
  buffer: Buffer,
  pdfUrl: string
): Promise<ExtractionResult> {
  const header = buffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    return {
      method: ExtractionMethod.PDF_DOCUMENT,
      confidence: 0,
      events: [],
      discoveredLinks: [],
      rawTextSnippet: '',
      fieldProvenance: {},
      aiCallsUsed: 0,
      warnings: ['Downloaded file does not have a valid %PDF- signature'],
    };
  }

  const parsed = await pdfParse(buffer);
  const text = (parsed.text || '').replace(/\r\n/g, '\n').trim();

  if (text.length < 80) {
    return {
      method: ExtractionMethod.PDF_DOCUMENT,
      confidence: 0.1,
      events: [],
      discoveredLinks: [],
      rawTextSnippet: text,
      fieldProvenance: {},
      aiCallsUsed: 0,
      warnings: ['PDF appears to be image-based or scanned; OCR is required to extract text'],
    };
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 140) || null;
  const datePattern = '((?:\\d{1,2}\\s+[A-Za-z]{3,9}\\s+20\\d{2})|(?:[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+20\\d{2})|(?:20\\d{2}-\\d{2}-\\d{2}))';
  const eventDateMatch = text.match(new RegExp(`(?:event\\s+date|date|starts?\\s+on)\\s*[:\\-]?\\s*${datePattern}`, 'i'))
    || text.match(new RegExp(datePattern, 'i'));
  const deadlineMatch = text.match(new RegExp(`(?:deadline|apply\\s+by|last\\s+date)\\s*[:\\-]?\\s*${datePattern}`, 'i'));
  const venueMatch = text.match(/(?:venue|location|campus)\s*[:\-]\s*([^\n]{2,120})/i);
  const prizeMatch = text.match(/(?:prize\s+pool|prizes?)\s*[:\-]\s*([^\n]{2,80})/i);

  const rawEvent: RawExtractedEvent = {
    title,
    description: lines.slice(1, 6).join(' ').slice(0, 1200) || null,
    eventStartDate: eventDateMatch?.[1]?.trim() || null,
    registrationDeadline: deadlineMatch?.[1]?.trim() || null,
    venue: venueMatch?.[1]?.trim() || null,
    location: venueMatch?.[1]?.trim() || null,
    prizePool: prizeMatch?.[1]?.trim() || null,
    registrationUrl: pdfUrl,
    eventWebsiteUrl: pdfUrl,
  };

  let aiCallsUsed = 0;
  const warnings: string[] = [];

  if (!rawEvent.eventStartDate || !rawEvent.venue) {
    try {
      const aiRes = await extractWithAi(text, pdfUrl);
      if (aiRes && aiRes.events.length > 0) {
        aiCallsUsed = aiRes.aiCallsUsed;
        return {
          ...aiRes,
          method: ExtractionMethod.PDF_DOCUMENT,
          aiCallsUsed,
          warnings: [...aiRes.warnings, ...warnings],
        };
      }
    } catch (err) {
      warnings.push(`AI PDF structuring skipped: ${(err as Error).message}`);
    }
  }

  return {
    method: ExtractionMethod.PDF_DOCUMENT,
    confidence: rawEvent.title && rawEvent.eventStartDate ? 0.65 : 0.4,
    events: rawEvent.title ? [rawEvent] : [],
    discoveredLinks: [],
    rawTextSnippet: text.slice(0, 3000),
    fieldProvenance: {
      title: rawEvent.title ? 'EXPLICIT' : 'MISSING',
      eventStartDate: rawEvent.eventStartDate ? 'EXPLICIT' : 'MISSING',
      registrationDeadline: rawEvent.registrationDeadline ? 'EXPLICIT' : 'MISSING',
      venue: rawEvent.venue ? 'EXPLICIT' : 'MISSING',
    },
    aiCallsUsed,
    warnings,
  };
}

