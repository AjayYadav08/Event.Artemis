import { z } from 'zod';

const categoryEnum = z.enum(['Competition', 'Fest', 'Workshop', 'Seminar']);
const statusEnum = z.enum(['Live', 'Upcoming', 'Closed', 'Past']);
const participationModeEnum = z.enum(['Online', 'Offline', 'Hybrid']);
const teamModeEnum = z.enum(['Team', 'Solo', 'Both']);
const locationTypeEnum = z.enum(['OnCampus', 'OffCampus', 'On-Campus', 'Off-Campus']);

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200),
    category: categoryEnum,
    type: statusEnum.optional(),
    date: z.string().trim().min(3).max(50),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    time: z.string().trim().min(2).max(50),
    eventDate: z.string().datetime().optional(),
    registrationStart: z.string().datetime().optional(),
    registrationDeadline: z.string().datetime().optional(),
    location: z.string().trim().min(2).max(160),
    campus: z.string().trim().max(160).optional(),
    domain: z.string().trim().min(2).max(120),
    conductingAgency: z.string().trim().max(160).optional(),
    locationType: locationTypeEnum.optional(),
    participationMode: participationModeEnum.optional(),
    teamMode: teamModeEnum.optional(),
    registrationWindow: z.string().trim().max(120).optional(),
    registrationUrl: z.string().trim().url().optional().or(z.literal('')),
    xp: z.number().int().min(0).max(100000).optional(),
    featured: z.boolean().optional(),
    description: z.string().trim().max(5000).optional(),
    jokes: z.array(z.string()).optional(),
    timeline: z.array(z.object({ time: z.string(), title: z.string(), desc: z.string() })).optional(),
    venueDetails: z.string().trim().max(500).optional(),
    prizePool: z.string().trim().max(120).optional(),
    tracks: z.array(z.string()).optional(),
    posterUrl: z.string().trim().min(1),
    eligibility: z.string().trim().max(200).optional(),
    teamSize: z.string().trim().max(100).optional(),
    certification: z.boolean().optional(),
    prizesList: z.array(z.any()).optional(),
    sponsors: z.array(z.any()).optional(),
    judges: z.array(z.any()).optional(),
    rules: z.array(z.string()).optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    organizerContact: z.object({ phone: z.string(), email: z.string() }).optional(),
    gallery: z.array(z.string()).optional(),
    isPaid: z.boolean().optional(),
    registrationFee: z.string().trim().max(100).optional(),
    duration: z.string().trim().max(100).optional(),
    rounds: z.array(z.string()).optional(),
    dos: z.array(z.string()).optional(),
    donts: z.array(z.string()).optional(),
    // Future automation provenance fields (optional)
    sourceUrl: z.string().trim().url().optional(),
    sourceType: z.string().trim().max(60).optional(),
    externalSourceId: z.string().trim().max(200).optional(),
  }),
});

export const updateEventSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createEventSchema.shape.body.partial(),
});

export const queryEventsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    status: z.string().trim().optional(),
    participationMode: participationModeEnum.optional(),
    location: z.string().trim().optional(),
    domain: z.string().trim().optional(),
    dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    deadlineBefore: z.string().datetime().optional(),
    eventDateFrom: z.string().datetime().optional(),
    eventDateTo: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    sortBy: z.enum(['eventDate', 'xp', 'attendees', 'createdAt', 'registrationDeadline']).default('eventDate'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

