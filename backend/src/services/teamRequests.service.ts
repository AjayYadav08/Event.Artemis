import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { teamsService } from './teams.service';

function formatRequest(req: {
  id: string;
  teamId: string;
  userId: string;
  message: string;
  status: string;
  createdAt: Date;
  team: { id: string; name: string; hackathon: string };
  user: { id: string; name: string; profileImage: string | null };
}) {
  return {
    id: req.id,
    teamId: req.teamId,
    teamName: req.team.name,
    hackathon: req.team.hackathon,
    userId: req.userId,
    userName: req.user.name,
    userAvatar: req.user.profileImage || '/avatar.png',
    message: req.message,
    timestamp: req.createdAt.toISOString(),
    status: req.status as 'Pending' | 'Accepted' | 'Rejected',
  };
}

export const teamRequestsService = {
  async createRequest(userId: string, teamId: string, message?: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { memberships: true } } },
    });
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }
    if (team.recruitmentStatus !== 'Open') {
      throw new ApiError(400, 'This team is currently closed for new requests');
    }
    if (team._count.memberships >= team.maxMembers) {
      throw new ApiError(400, 'This team has reached its maximum member capacity');
    }

    const existingMember = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existingMember) {
      throw new ApiError(409, 'You are already a member of this team');
    }

    const existingPending = await prisma.teamJoinRequest.findFirst({
      where: { teamId, userId, status: 'Pending' },
    });
    if (existingPending) {
      throw new ApiError(409, 'You already have a pending join request for this team');
    }

    const created = await prisma.teamJoinRequest.create({
      data: {
        teamId,
        userId,
        message: message?.trim() || `Hi, I'd like to join ${team.name}!`,
        status: 'Pending',
      },
      include: {
        team: { select: { id: true, name: true, hackathon: true } },
        user: { select: { id: true, name: true, profileImage: true } },
      },
    });

    return formatRequest(created);
  },

  async listMyRequests(userId: string) {
    const reqs = await prisma.teamJoinRequest.findMany({
      where: { userId },
      include: {
        team: { select: { id: true, name: true, hackathon: true } },
        user: { select: { id: true, name: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reqs.map(formatRequest);
  },

  async listTeamRequests(teamId: string, actorId: string) {
    await teamsService.assertTeamAdmin(teamId, actorId);
    const reqs = await prisma.teamJoinRequest.findMany({
      where: { teamId },
      include: {
        team: { select: { id: true, name: true, hackathon: true } },
        user: { select: { id: true, name: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reqs.map(formatRequest);
  },

  async acceptRequest(requestId: string, actorId: string) {
    const req = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: { include: { _count: { select: { memberships: true } } } },
        user: { select: { id: true, name: true, profileImage: true, skills: true } },
      },
    });
    if (!req) throw new ApiError(404, 'Join request not found');
    await teamsService.assertTeamAdmin(req.teamId, actorId);

    if (req.status !== 'Pending') {
      throw new ApiError(400, `Request has already been ${req.status.toLowerCase()}`);
    }
    if (req.team._count.memberships >= req.team.maxMembers) {
      throw new ApiError(400, 'Team has reached maximum capacity');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existingMember = await tx.teamMembership.findUnique({
        where: { teamId_userId: { teamId: req.teamId, userId: req.userId } },
      });

      if (!existingMember) {
        await tx.teamMembership.create({
          data: {
            teamId: req.teamId,
            userId: req.userId,
            role: 'MEMBER',
            memberRoleTitle: 'Contributor',
            skills: req.user.skills.length > 0 ? req.user.skills : ['New Member'],
          },
        });
      }

      return tx.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: 'Accepted' },
        include: {
          team: { select: { id: true, name: true, hackathon: true } },
          user: { select: { id: true, name: true, profileImage: true } },
        },
      });
    });

    return formatRequest(updated);
  },

  async rejectRequest(requestId: string, actorId: string) {
    const req = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) throw new ApiError(404, 'Join request not found');
    await teamsService.assertTeamAdmin(req.teamId, actorId);

    if (req.status !== 'Pending') {
      throw new ApiError(400, `Request has already been ${req.status.toLowerCase()}`);
    }

    const updated = await prisma.teamJoinRequest.update({
      where: { id: requestId },
      data: { status: 'Rejected' },
      include: {
        team: { select: { id: true, name: true, hackathon: true } },
        user: { select: { id: true, name: true, profileImage: true } },
      },
    });

    return formatRequest(updated);
  },
};

