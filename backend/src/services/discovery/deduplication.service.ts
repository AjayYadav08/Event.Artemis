import { prisma } from '../../lib/prisma';
import { NormalizedEventPayload } from './extraction.types';

export interface DuplicateCheckResult {
  matchType: 'EXACT' | 'UNCERTAIN' | 'NONE';
  matchedEventId: string | null;
  confidence: number;
  signals: string[];
}

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSimilarity(a: string, b: string): number {
  const setA = new Set(normalizeText(a).split(' ').filter((w) => w.length > 2));
  const setB = new Set(normalizeText(b).split(' ').filter((w) => w.length > 2));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Checks whether a normalized event matches an existing Event in PostgreSQL
 * using multiple signals: sourceUrl, externalSourceId, registrationUrl,
 * normalized title similarity, organizer name, and event date proximity.
 */
export async function detectDuplicateEvent(
  payload: NormalizedEventPayload
): Promise<DuplicateCheckResult> {
  const candidates = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      conductingAgency: true,
      eventDate: true,
      registrationUrl: true,
      sourceUrl: true,
      externalSourceId: true,
    },
    take: 250,
    orderBy: { createdAt: 'desc' },
  });

  const targetDateMs = new Date(payload.eventDate).getTime();
  let bestMatch: DuplicateCheckResult = {
    matchType: 'NONE',
    matchedEventId: null,
    confidence: 0,
    signals: [],
  };

  for (const ev of candidates) {
    const signals: string[] = [];
    let score = 0;

    if (payload.externalSourceId && ev.externalSourceId && payload.externalSourceId === ev.externalSourceId) {
      score += 0.65;
      signals.push('Matching externalEventId');
    }

    if (payload.sourceUrl && ev.sourceUrl && payload.sourceUrl === ev.sourceUrl) {
      score += 0.6;
      signals.push('Matching sourceUrl');
    }

    if (
      payload.registrationUrl &&
      ev.registrationUrl &&
      payload.registrationUrl === ev.registrationUrl &&
      payload.registrationUrl !== payload.sourceUrl
    ) {
      score += 0.4;
      signals.push('Matching registrationUrl');
    }

    const titleSim = tokenSimilarity(payload.title, ev.title);
    if (titleSim >= 0.85) {
      score += 0.45;
      signals.push(`High title similarity (${Math.round(titleSim * 100)}%)`);
    } else if (titleSim >= 0.55) {
      score += 0.25;
      signals.push(`Moderate title similarity (${Math.round(titleSim * 100)}%)`);
    }

    const diffHours = Math.abs(targetDateMs - ev.eventDate.getTime()) / (1000 * 60 * 60);
    if (diffHours <= 48 && titleSim >= 0.45) {
      score += 0.25;
      signals.push('Event dates within 48 hours');
    }

    if (payload.conductingAgency && ev.conductingAgency) {
      const orgSim = tokenSimilarity(payload.conductingAgency, ev.conductingAgency);
      if (orgSim >= 0.6) {
        score += 0.15;
        signals.push('Matching organizer');
      }
    }

    const clamped = Math.min(1, Number(score.toFixed(2)));
    if (clamped > bestMatch.confidence) {
      bestMatch = {
        matchType: clamped >= 0.75 ? 'EXACT' : clamped >= 0.48 ? 'UNCERTAIN' : 'NONE',
        matchedEventId: clamped >= 0.48 ? ev.id : null,
        confidence: clamped,
        signals,
      };
    }
  }

  return bestMatch;
}

