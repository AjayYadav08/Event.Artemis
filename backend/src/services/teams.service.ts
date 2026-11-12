import { TeamMemberRole, RecruitmentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

export function formatTeamForFrontend(
  team: {
    id: string;
    name: string;
    hackathon: string;
    description: string;
    goals: string | null;
    expectations: string[];
    maxMembers: number;
    recruitmentStatus: RecruitmentStatus;
    location: string | null;
    createdById: string;
    createdAt: Date;
    memberships: Array<{
      userId: string;
      role: TeamMemberRole;
      memberRoleTitle: string;
      skills: string[];
      user: {
        id: string;
        name: string;
        profileImage: string | null;
        skills: string[];
      };
    }>;
  },
  currentUserId?: string
) {
  const hostMembership =
    team.memberships.find((m) => m.role === 'HOST') || team.memberships[0];

  return {
    id: team.id,
    name: team.name,
    hackathon: team.hackathon,
    description: team.description,
    goals: team.goals ?? undefined,
    expectations: team.expectations,
    maxMembers: team.maxMembers,
    status: team.recruitmentStatus,
    location: team.location ?? 'Campus Innovation Hub',
    createdById: team.createdById,
    hostId: hostMembership?.userId ?? team.createdById,
    isMember: currentUserId
      ? team.memberships.some((m) => m.userId === currentUserId)
      : false,
    members: team.memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      role: m.memberRoleTitle || (m.role === 'HOST' ? 'Team Lead' : 'Contributor'),
      memberRole: m.role,
      skills: m.skills.length > 0 ? m.skills : m.user.skills,
      avatar: m.user.profileImage || '/avatar.png',
    })),
    messages: [],
    createdAt: team.createdAt.toISOString(),
  };
}

const teamInclude = {
  memberships: {
    include: {
      user: {
        select: { id: true, name: true, profileImage: true, skills: true },
      },
    },
    orderBy: { joinedAt: 'asc' as const },
  },
};

export const teamsService = {
  async listAvailableTeams(currentUserId: string, search?: string) {
    const teams = await prisma.team.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { hackathon: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: teamInclude,
      orderBy: { createdAt: 'desc' },
    });
    return teams.map((t) => formatTeamForFrontend(t, currentUserId));
  },

  async listMyTeams(currentUserId: string) {
    const teams = await prisma.team.findMany({
      where: {
        memberships: { some: { userId: currentUserId } },
      },
      include: teamInclude,
      orderBy: { createdAt: 'desc' },
    });
    return teams.map((t) => formatTeamForFrontend(t, currentUserId));
  },

  async getById(teamId: string, currentUserId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: teamInclude,
    });
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }
    return formatTeamForFrontend(team, currentUserId);
  },

  async create(
    userId: string,
    input: {
      name: string;
      hackathon: string;
      description: string;
      goals?: string;
      expectations?: string[];
      maxMembers: number;
      location?: string;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const created = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: input.name,
          hackathon: input.hackathon,
          description: input.description,
          goals: input.goals ?? null,
          expectations: input.expectations ?? [],
          maxMembers: input.maxMembers,
          location: input.location ?? 'Campus Innovation Hub',
          createdById: userId,
        },
      });

      await tx.teamMembership.create({
        data: {
          teamId: team.id,
          userId,
          role: 'HOST',
          memberRoleTitle: 'Team Lead',
          skills: user.skills.length > 0 ? user.skills : ['Full-Stack'],
        },
      });

      return tx.team.findUniqueOrThrow({
        where: { id: team.id },
        include: teamInclude,
      });
    });

    return formatTeamForFrontend(created, userId);
  },

  async assertTeamAdmin(teamId: string, userId: string) {
    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership || (membership.role !== 'HOST' && membership.role !== 'ADMIN')) {
      throw new ApiError(403, 'Only team hosts or admins can manage this team');
    }
    return membership;
  },

  async assertTeamMember(teamId: string, userId: string) {
    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) {
      throw new ApiError(403, 'You must be a member of this team to access this resource');
    }
    return membership;
  },

  async update(
    teamId: string,
    userId: string,
    input: {
      name?: string;
      hackathon?: string;
      description?: string;
      goals?: string;
      expectations?: string[];
      maxMembers?: number;
      recruitmentStatus?: RecruitmentStatus;
      location?: string;
    }
  ) {
    await this.assertTeamAdmin(teamId, userId);

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.hackathon !== undefined ? { hackathon: input.hackathon } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.goals !== undefined ? { goals: input.goals } : {}),
        ...(input.expectations !== undefined ? { expectations: input.expectations } : {}),
        ...(input.maxMembers !== undefined ? { maxMembers: input.maxMembers } : {}),
        ...(input.recruitmentStatus !== undefined
          ? { recruitmentStatus: input.recruitmentStatus }
          : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
      },
      include: teamInclude,
    });

    return formatTeamForFrontend(updated, userId);
  },

  async remove(teamId: string, userId: string) {
    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership || membership.role !== 'HOST') {
      throw new ApiError(403, 'Only the team host can delete the team');
    }
    await prisma.team.delete({ where: { id: teamId } });
  },

  async leaveTeam(teamId: string, userId: string) {
    const membership = await this.assertTeamMember(teamId, userId);

    await prisma.$transaction(async (tx) => {
      await tx.teamMembership.delete({
        where: { teamId_userId: { teamId, userId } },
      });

      const remaining = await tx.teamMembership.findMany({
        where: { teamId },
        orderBy: { joinedAt: 'asc' },
      });

      if (remaining.length === 0) {
        await tx.team.delete({ where: { id: teamId } });
      } else if (membership.role === 'HOST') {
        await tx.teamMembership.update({
          where: { id: remaining[0].id },
          data: { role: 'HOST', memberRoleTitle: 'Team Lead' },
        });
      }
    });
  },

  async removeMember(teamId: string, actorId: string, targetUserId: string) {
    await this.assertTeamAdmin(teamId, actorId);
    if (actorId === targetUserId) {
      throw new ApiError(400, 'Use leave endpoint to leave the team yourself');
    }

    const target = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
    if (!target) {
      throw new ApiError(404, 'Member not found in this team');
    }
    if (target.role === 'HOST') {
      throw new ApiError(403, 'Cannot remove the team host');
    }

    await prisma.teamMembership.delete({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
  },

  async updateMemberRole(
    teamId: string,
    actorId: string,
    targetUserId: string,
    newRole: TeamMemberRole,
    memberRoleTitle?: string
  ) {
    const actor = await this.assertTeamMember(teamId, actorId);
    if (actor.role !== 'HOST') {
      throw new ApiError(403, 'Only the team host can change member roles');
    }

    const target = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId: targetUserId } },
    });
    if (!target) {
      throw new ApiError(404, 'Member not found in this team');
    }

    await prisma.$transaction(async (tx) => {
      if (newRole === 'HOST' && targetUserId !== actorId) {
        await tx.teamMembership.update({
          where: { teamId_userId: { teamId, userId: actorId } },
          data: { role: 'MEMBER', memberRoleTitle: 'Contributor' },
        });
      }
      await tx.teamMembership.update({
        where: { teamId_userId: { teamId, userId: targetUserId } },
        data: {
          role: newRole,
          ...(memberRoleTitle
            ? { memberRoleTitle }
            : newRole === 'HOST'
            ? { memberRoleTitle: 'Team Lead' }
            : {}),
        },
      });
    });

    return this.getById(teamId, actorId);
  },

  async rateMember(
    teamId: string,
    raterId: string,
    targetUserId: string,
    stars: number,
    feedback?: string
  ) {
    await this.assertTeamMember(teamId, raterId);
    await this.assertTeamMember(teamId, targetUserId);
    if (raterId === targetUserId) {
      throw new ApiError(400, 'You cannot rate yourself');
    }

    return prisma.teamRating.upsert({
      where: {
        teamId_raterId_targetUserId: { teamId, raterId, targetUserId },
      },
      update: { stars, feedback: feedback ?? null },
      create: { teamId, raterId, targetUserId, stars, feedback: feedback ?? null },
    });
  },
};

