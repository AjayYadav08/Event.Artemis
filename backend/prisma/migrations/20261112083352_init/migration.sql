-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('Competition', 'Fest', 'Workshop', 'Seminar');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Live', 'Upcoming', 'Closed', 'Past');

-- CreateEnum
CREATE TYPE "ParticipationMode" AS ENUM ('Online', 'Offline', 'Hybrid');

-- CreateEnum
CREATE TYPE "TeamMode" AS ENUM ('Team', 'Solo', 'Both');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('OnCampus', 'OffCampus');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('MANUAL', 'PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "DataProvenance" AS ENUM ('MANUAL', 'AUTOMATED', 'HYBRID');

-- CreateEnum
CREATE TYPE "RecruitmentStatus" AS ENUM ('Open', 'Closed');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('HOST', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'Accepted', 'Rejected');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'AUDIO', 'ATTACHMENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "profileImage" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "xp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "type" "EventStatus" NOT NULL DEFAULT 'Upcoming',
    "date" TEXT NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "registrationStart" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "campus" TEXT,
    "domain" TEXT NOT NULL,
    "conductingAgency" TEXT,
    "locationType" "LocationType" NOT NULL DEFAULT 'OnCampus',
    "participationMode" "ParticipationMode" NOT NULL DEFAULT 'Offline',
    "teamMode" "TeamMode" NOT NULL DEFAULT 'Both',
    "registrationWindow" TEXT,
    "registrationUrl" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "attendees" INTEGER NOT NULL DEFAULT 0,
    "sectionParticipants" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "jokes" JSONB NOT NULL DEFAULT '[]',
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "venueDetails" TEXT NOT NULL DEFAULT '',
    "prizePool" TEXT,
    "tracks" JSONB NOT NULL DEFAULT '[]',
    "posterUrl" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL DEFAULT 'All Students',
    "teamSize" TEXT NOT NULL DEFAULT '1-4 Members',
    "certification" BOOLEAN NOT NULL DEFAULT true,
    "prizesList" JSONB NOT NULL DEFAULT '[]',
    "sponsors" JSONB NOT NULL DEFAULT '[]',
    "judges" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "organizerContact" JSONB,
    "gallery" JSONB NOT NULL DEFAULT '[]',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "registrationFee" TEXT NOT NULL DEFAULT 'Free',
    "duration" TEXT,
    "rounds" JSONB NOT NULL DEFAULT '[]',
    "dos" JSONB NOT NULL DEFAULT '[]',
    "donts" JSONB NOT NULL DEFAULT '[]',
    "sourceUrl" TEXT,
    "sourceType" TEXT,
    "externalSourceId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'MANUAL',
    "dataProvenance" "DataProvenance" NOT NULL DEFAULT 'MANUAL',
    "extractionConfidence" DOUBLE PRECISION,
    "sourceMetadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFieldHistory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "provenance" "DataProvenance" NOT NULL DEFAULT 'MANUAL',
    "confidence" DOUBLE PRECISION,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFieldHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInterest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hackathon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goals" TEXT,
    "expectations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxMembers" INTEGER NOT NULL DEFAULT 4,
    "recruitmentStatus" "RecruitmentStatus" NOT NULL DEFAULT 'Open',
    "location" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
    "memberRoleTitle" TEXT NOT NULL DEFAULT 'Contributor',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamJoinRequest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRating" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "audioUrl" TEXT,
    "audioDuration" INTEGER,
    "deletedForEveryoneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageDeletion" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "teamId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Event_registrationDeadline_idx" ON "Event"("registrationDeadline");

-- CreateIndex
CREATE INDEX "Event_domain_idx" ON "Event"("domain");

-- CreateIndex
CREATE INDEX "Event_externalSourceId_idx" ON "Event"("externalSourceId");

-- CreateIndex
CREATE INDEX "EventFieldHistory_eventId_fieldName_idx" ON "EventFieldHistory"("eventId", "fieldName");

-- CreateIndex
CREATE INDEX "EventInterest_userId_idx" ON "EventInterest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventInterest_eventId_userId_key" ON "EventInterest"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventRegistration_userId_idx" ON "EventRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Team_recruitmentStatus_idx" ON "Team"("recruitmentStatus");

-- CreateIndex
CREATE INDEX "Team_createdById_idx" ON "Team"("createdById");

-- CreateIndex
CREATE INDEX "TeamMembership_userId_idx" ON "TeamMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_teamId_userId_key" ON "TeamMembership"("teamId", "userId");

-- CreateIndex
CREATE INDEX "TeamJoinRequest_teamId_status_idx" ON "TeamJoinRequest"("teamId", "status");

-- CreateIndex
CREATE INDEX "TeamJoinRequest_userId_status_idx" ON "TeamJoinRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "TeamInvitation_recipientId_status_idx" ON "TeamInvitation"("recipientId", "status");

-- CreateIndex
CREATE INDEX "TeamInvitation_teamId_recipientId_idx" ON "TeamInvitation"("teamId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRating_teamId_raterId_targetUserId_key" ON "TeamRating"("teamId", "raterId", "targetUserId");

-- CreateIndex
CREATE INDEX "ChatMessage_teamId_createdAt_idx" ON "ChatMessage"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageDeletion_userId_idx" ON "MessageDeletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageDeletion_messageId_userId_key" ON "MessageDeletion"("messageId", "userId");

-- CreateIndex
CREATE INDEX "ChatAttachment_messageId_idx" ON "ChatAttachment"("messageId");

-- CreateIndex
CREATE INDEX "ChatAttachment_teamId_idx" ON "ChatAttachment"("teamId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFieldHistory" ADD CONSTRAINT "EventFieldHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInterest" ADD CONSTRAINT "EventInterest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInterest" ADD CONSTRAINT "EventInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamJoinRequest" ADD CONSTRAINT "TeamJoinRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamJoinRequest" ADD CONSTRAINT "TeamJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRating" ADD CONSTRAINT "TeamRating_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRating" ADD CONSTRAINT "TeamRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRating" ADD CONSTRAINT "TeamRating_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDeletion" ADD CONSTRAINT "MessageDeletion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDeletion" ADD CONSTRAINT "MessageDeletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
