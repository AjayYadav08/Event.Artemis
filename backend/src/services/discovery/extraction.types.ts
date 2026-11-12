import { ExtractionMethod, EventCategory, ParticipationMode, TeamMode, LocationType } from '@prisma/client';

export interface RawExtractedEvent {
  title?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  posterUrl?: string | null;
  category?: string | null;
  domain?: string | null;
  tracks?: string[] | null;
  conductingAgency?: string | null;
  eventWebsiteUrl?: string | null;
  registrationStart?: string | null;
  registrationDeadline?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  duration?: string | null;
  timezone?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  venue?: string | null;
  campus?: string | null;
  location?: string | null;
  participationMode?: string | null;
  eligibility?: string | null;
  eligibleYears?: string[] | null;
  eligibleBranches?: string[] | null;
  teamMode?: string | null;
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
  teamSize?: string | null;
  entryFee?: string | null;
  isPaid?: boolean | null;
  prizePool?: string | null;
  prizesList?: Array<{ position: string; amount: string; description?: string }> | null;
  certification?: boolean | null;
  otherRewards?: string[] | null;
  registrationUrl?: string | null;
  applicationUrl?: string | null;
  organizerContact?: { phone?: string; email?: string } | null;
  rules?: string[] | null;
  dos?: string[] | null;
  donts?: string[] | null;
  faqs?: Array<{ q: string; a: string }> | null;
  requiredResources?: string[] | null;
  externalEventId?: string | null;
  pdfUrls?: string[] | null;
}

export interface ExtractionResult {
  method: ExtractionMethod;
  confidence: number;
  events: RawExtractedEvent[];
  discoveredLinks: Array<{ url: string; title: string; score: number; isPdf: boolean }>;
  rawTextSnippet: string;
  fieldProvenance: Record<string, 'EXPLICIT' | 'INFERRED' | 'MISSING'>;
  aiCallsUsed: number;
  warnings: string[];
}

export interface NormalizedEventPayload {
  title: string;
  category: EventCategory;
  date: string;
  dayOfMonth: number;
  time: string;
  eventDate: string; // ISO
  registrationStart: string | null;
  registrationDeadline: string | null;
  location: string;
  campus: string | null;
  domain: string;
  conductingAgency: string | null;
  locationType: LocationType;
  participationMode: ParticipationMode;
  teamMode: TeamMode;
  registrationWindow: string | null;
  registrationUrl: string | null;
  xp: number;
  description: string | null;
  venueDetails: string;
  prizePool: string | null;
  tracks: string[];
  posterUrl: string;
  eligibility: string;
  teamSize: string;
  certification: boolean;
  prizesList: Array<{ position: string; amount: string; description?: string }>;
  rules: string[];
  faqs: Array<{ q: string; a: string }>;
  organizerContact: { phone?: string; email?: string } | null;
  isPaid: boolean;
  registrationFee: string;
  duration: string | null;
  dos: string[];
  donts: string[];
  sourceUrl: string;
  externalSourceId: string | null;
  sourceMetadata: Record<string, unknown>;
}

