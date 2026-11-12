import {
  Event,
  EventCategory,
  EventStatus,
  LocationType,
  ParticipationMode,
  Prisma,
  TeamMode,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDisplayDate(dateStr: string, timeStr: string): Date {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10) || 1;
    const month = MONTHS[parts[1]] ?? 4;
    const year = parseInt(parts[2], 10) || 2026;
    const timeParts = timeStr.trim().split(/\s+/);
    const [hRaw, mRaw] = (timeParts[0] || '10:00').split(':').map(Number);
    let hours = Number.isFinite(hRaw) ? hRaw : 10;
    const minutes = Number.isFinite(mRaw) ? mRaw : 0;
    if (timeParts[1]?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (timeParts[1]?.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return new Date(Date.UTC(year, month, day, hours, minutes));
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Computes consistent event status from eventDate and registrationDeadline.
 */
export function computeEventStatus(
  eventDate: Date,
  registrationDeadline?: Date | null,
  explicitType?: EventStatus
): EventStatus {
  if (explicitType === 'Closed' || explicitType === 'Past') {
    return explicitType;
  }
  const now = new Date();
  const diffFromEventMs = eventDate.getTime() - now.getTime();
  if (diffFromEventMs < -24 * 60 * 60 * 1000) {
    return 'Past';
  }
  if (registrationDeadline && registrationDeadline.getTime() < now.getTime()) {
    return 'Closed';
  }
  if (diffFromEventMs <= 48 * 60 * 60 * 1000 && diffFromEventMs >= -24 * 60 * 60 * 1000) {
    return 'Live';
  }
  return explicitType ?? 'Upcoming';
}

export function formatEventForFrontend(
  event: Event & { _count?: { interests?: number; registrations?: number } },
  interestedSet?: Set<string>,
  registeredSet?: Set<string>
) {
  const computedStatus = computeEventStatus(
    event.eventDate,
    event.registrationDeadline,
    event.type
  );

  return {
    id: event.id,
    title: event.title,
    category: event.category,
    type: computedStatus,
    date: event.date,
    dayOfMonth: event.dayOfMonth,
    time: event.time,
    eventDate: event.eventDate.toISOString(),
    registrationStart: event.registrationStart?.toISOString() ?? null,
    registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
    location: event.location,
    campus: event.campus,
    domain: event.domain,
    conductingAgency: event.conductingAgency ?? undefined,
    locationType: event.locationType === 'OffCampus' ? 'Off-Campus' : 'On-Campus',
    registrationWindow: event.registrationWindow ?? undefined,
    registrationUrl: event.registrationUrl ?? undefined,
    xp: event.xp,
    attendees: event.attendees + (event._count?.registrations ?? 0),
    interestedCount: event._count?.interests ?? 0,
    sectionParticipants: event.sectionParticipants,
    featured: event.featured,
    description: event.description ?? undefined,
    jokes: (event.jokes as string[]) ?? [],
    timeline: (event.timeline as Array<{ time: string; title: string; desc: string }>) ?? [],
    venueDetails: event.venueDetails,
    prizePool: event.prizePool ?? undefined,
    tracks: (event.tracks as string[]) ?? [],
    posterUrl: event.posterUrl,
    eligibility: event.eligibility,
    teamSize: event.teamSize,
    certification: event.certification,
    prizesList: (event.prizesList as unknown[]) ?? undefined,
    sponsors: (event.sponsors as unknown[]) ?? undefined,
    judges: (event.judges as unknown[]) ?? undefined,
    rules: (event.rules as string[]) ?? undefined,
    faqs: (event.faqs as Array<{ q: string; a: string }>) ?? undefined,
    organizerContact: (event.organizerContact as { phone: string; email: string }) ?? undefined,
    gallery: (event.gallery as string[]) ?? undefined,
    isPaid: event.isPaid,
    registrationFee: event.registrationFee,
    duration: event.duration ?? undefined,
    format: {
      rounds: (event.rounds as string[]) ?? [],
      type: event.participationMode,
      mode: event.teamMode,
    },
    dos: (event.dos as string[]) ?? undefined,
    donts: (event.donts as string[]) ?? undefined,
    isInterested: interestedSet ? interestedSet.has(event.id) : false,
    isRegistered: registeredSet ? registeredSet.has(event.id) : false,
    // Provenance metadata for Phase 2 compatibility
    dataProvenance: event.dataProvenance,
    extractionStatus: event.extractionStatus,
    sourceUrl: event.sourceUrl,
  };
}

export const eventsService = {
  async list(
    query: {
      search?: string;
      category?: string;
      status?: string;
      participationMode?: ParticipationMode;
      location?: string;
      domain?: string;
      dayOfMonth?: number;
      month?: number;
      year?: number;
      deadlineBefore?: string;
      eventDateFrom?: string;
      eventDateTo?: string;
      page: number;
      limit: number;
      sortBy: 'eventDate' | 'xp' | 'attendees' | 'createdAt' | 'registrationDeadline';
      sortOrder: 'asc' | 'desc';
    },
    userId?: string
  ) {
    const where: Prisma.EventWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { domain: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category && query.category !== 'All') {
      const cats = query.category.split(',').map((c) => c.trim()) as EventCategory[];
      where.category = cats.length > 1 ? { in: cats } : cats[0];
    }

    if (query.status && query.status !== 'All') {
      const statuses = query.status.split(',').map((s) => s.trim()) as EventStatus[];
      where.type = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    if (query.participationMode) {
      where.participationMode = query.participationMode;
    }

    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (query.domain) {
      where.domain = { contains: query.domain, mode: 'insensitive' };
    }

    if (query.dayOfMonth) {
      where.dayOfMonth = query.dayOfMonth;
    }

    if (query.month && query.year) {
      const start = new Date(Date.UTC(query.year, query.month - 1, 1));
      const end = new Date(Date.UTC(query.year, query.month, 0, 23, 59, 59));
      where.eventDate = { gte: start, lte: end };
    } else if (query.eventDateFrom || query.eventDateTo) {
      where.eventDate = {
        ...(query.eventDateFrom ? { gte: new Date(query.eventDateFrom) } : {}),
        ...(query.eventDateTo ? { lte: new Date(query.eventDateTo) } : {}),
      };
    }

    if (query.deadlineBefore) {
      where.registrationDeadline = { lte: new Date(query.deadlineBefore) };
    }

    const skip = (query.page - 1) * query.limit;

    const [total, items, userInterests, userRegistrations] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          _count: { select: { interests: true, registrations: true } },
        },
      }),
      userId
        ? prisma.eventInterest.findMany({
            where: { userId },
            select: { eventId: true },
          })
        : Promise.resolve([]),
      userId
        ? prisma.eventRegistration.findMany({
            where: { userId },
            select: { eventId: true },
          })
        : Promise.resolve([]),
    ]);

    const interestedSet = new Set(userInterests.map((i) => i.eventId));
    const registeredSet = new Set(userRegistrations.map((r) => r.eventId));

    return {
      items: items.map((e) => formatEventForFrontend(e, interestedSet, registeredSet)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string, userId?: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { interests: true, registrations: true } },
      },
    });
    if (!event) {
      throw new ApiError(404, 'Event not found');
    }

    const [interest, reg] = userId
      ? await Promise.all([
          prisma.eventInterest.findUnique({
            where: { eventId_userId: { eventId: id, userId } },
          }),
          prisma.eventRegistration.findUnique({
            where: { eventId_userId: { eventId: id, userId } },
          }),
        ])
      : [null, null];

    return formatEventForFrontend(
      event,
      interest ? new Set([id]) : new Set(),
      reg ? new Set([id]) : new Set()
    );
  },

  async create(input: Record<string, any>, creatorId: string) {
    const eventDate = input.eventDate
      ? new Date(input.eventDate)
      : parseDisplayDate(input.date, input.time);
    const dayOfMonth = input.dayOfMonth ?? eventDate.getUTCDate();
    const registrationDeadline = input.registrationDeadline
      ? new Date(input.registrationDeadline)
      : new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);

    const locType: LocationType =
      input.locationType === 'Off-Campus' || input.locationType === 'OffCampus'
        ? 'OffCampus'
        : 'OnCampus';

    const created = await prisma.event.create({
      data: {
        title: input.title,
        category: input.category,
        type: input.type ?? computeEventStatus(eventDate, registrationDeadline),
        date: input.date,
        dayOfMonth,
        time: input.time,
        eventDate,
        registrationStart: input.registrationStart ? new Date(input.registrationStart) : null,
        registrationDeadline,
        location: input.location,
        campus: input.campus ?? null,
        domain: input.domain,
        conductingAgency: input.conductingAgency ?? null,
        locationType: locType,
        participationMode: (input.participationMode ?? 'Offline') as ParticipationMode,
        teamMode: (input.teamMode ?? 'Both') as TeamMode,
        registrationWindow: input.registrationWindow ?? null,
        registrationUrl: input.registrationUrl || null,
        xp: input.xp ?? 500,
        featured: input.featured ?? false,
        description: input.description ?? null,
        jokes: input.jokes ?? [],
        timeline: input.timeline ?? [],
        venueDetails: input.venueDetails ?? input.location,
        prizePool: input.prizePool ?? null,
        tracks: input.tracks ?? [],
        posterUrl: input.posterUrl,
        eligibility: input.eligibility ?? 'All Students',
        teamSize: input.teamSize ?? '1-4 Members',
        certification: input.certification ?? true,
        prizesList: input.prizesList ?? [],
        sponsors: input.sponsors ?? [],
        judges: input.judges ?? [],
        rules: input.rules ?? [],
        faqs: input.faqs ?? [],
        organizerContact: input.organizerContact ?? undefined,
        gallery: input.gallery ?? [],
        isPaid: input.isPaid ?? false,
        registrationFee: input.registrationFee ?? 'Free',
        duration: input.duration ?? null,
        rounds: input.rounds ?? [],
        dos: input.dos ?? [],
        donts: input.donts ?? [],
        sourceUrl: input.sourceUrl ?? null,
        sourceType: input.sourceType ?? null,
        externalSourceId: input.externalSourceId ?? null,
        createdById: creatorId,
      },
      include: { _count: { select: { interests: true, registrations: true } } },
    });

    return formatEventForFrontend(created);
  },

  async update(id: string, input: Record<string, any>, actorId: string) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Event not found');
    }

    const updateData: Prisma.EventUpdateInput = {};
    const historyEntries: Prisma.EventFieldHistoryCreateManyInput[] = [];

    const directFields = [
      'title', 'category', 'type', 'date', 'dayOfMonth', 'time', 'location',
      'campus', 'domain', 'conductingAgency', 'participationMode', 'teamMode',
      'registrationWindow', 'registrationUrl', 'xp', 'featured', 'description',
      'jokes', 'timeline', 'venueDetails', 'prizePool', 'tracks', 'posterUrl',
      'eligibility', 'teamSize', 'certification', 'prizesList', 'sponsors',
      'judges', 'rules', 'faqs', 'organizerContact', 'gallery', 'isPaid',
      'registrationFee', 'duration', 'rounds', 'dos', 'donts',
    ] as const;

    for (const field of directFields) {
      if (input[field] !== undefined) {
        (updateData as any)[field] = input[field];
        historyEntries.push({
          eventId: id,
          fieldName: field,
          previousValue: (existing as any)[field] ?? Prisma.JsonNull,
          newValue: input[field] ?? Prisma.JsonNull,
          provenance: 'MANUAL',
          updatedById: actorId,
        });
      }
    }

    if (input.eventDate) updateData.eventDate = new Date(input.eventDate);
    if (input.registrationDeadline) updateData.registrationDeadline = new Date(input.registrationDeadline);
    if (input.locationType) {
      updateData.locationType =
        input.locationType === 'Off-Campus' || input.locationType === 'OffCampus'
          ? 'OffCampus'
          : 'OnCampus';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ev = await tx.event.update({
        where: { id },
        data: updateData,
        include: { _count: { select: { interests: true, registrations: true } } },
      });
      if (historyEntries.length > 0) {
        await tx.eventFieldHistory.createMany({ data: historyEntries });
      }
      return ev;
    });

    return formatEventForFrontend(updated);
  },

  async remove(id: string) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Event not found');
    }
    await prisma.event.delete({ where: { id } });
  },

  async addInterest(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, 'Event not found');

    await prisma.eventInterest.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: {},
      create: { eventId, userId },
    });
    return { eventId, isInterested: true };
  },

  async removeInterest(eventId: string, userId: string) {
    await prisma.eventInterest.deleteMany({
      where: { eventId, userId },
    });
    return { eventId, isInterested: false };
  },

  async getUserInterestedEvents(userId: string) {
    const interests = await prisma.eventInterest.findMany({
      where: { userId },
      include: {
        event: {
          include: { _count: { select: { interests: true, registrations: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const interestedSet = new Set(interests.map((i) => i.eventId));
    return interests.map((i) => formatEventForFrontend(i.event, interestedSet));
  },

  async registerForEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, 'Event not found');

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (!existing) {
        await tx.eventRegistration.create({ data: { eventId, userId } });
        await tx.user.update({
          where: { id: userId },
          data: { xp: { increment: event.xp } },
        });
      }
      return { eventId, isRegistered: true };
    });
    return result;
  },

  async getUserRegisteredEvents(userId: string) {
    const regs = await prisma.eventRegistration.findMany({
      where: { userId },
      select: { eventId: true },
    });
    return regs.map((r) => r.eventId);
  },
};

