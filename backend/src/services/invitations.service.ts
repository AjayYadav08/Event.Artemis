import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { teamsService } from './teams.service';

export const invitationsService = {
  async sendInvitation(
    senderId: string,
    input: { teamId: string; recipientEmail?: string; recipientId?: string; message?: string }
  ) {
    await teamsService.assertTeamAdmin(input.teamId, senderId);

    const recipient = input.recipientId
      ? await prisma.user.findUnique({ where: { id: input.recipientId } })
      : await prisma.user.findUnique({ where: { email: input.recipientEmail! } });

    if (!recipient) {
      throw new ApiError(404, 'Recipient user not found');
    }
    if (recipient.id === senderId) {
      throw new ApiError(400, 'You cannot invite yourself');
    }

    const alreadyMember = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId: input.teamId, userId: recipient.id } },
    });
    if (alreadyMember) {
      throw new ApiError(409, 'User is already a member of this team');
    }

    const pendingInvite = await prisma.teamInvitation.findFirst({
      where: { teamId: input.teamId, recipientId: recipient.id, status: 'Pending' },
    });
    if (pendingInvite) {
      throw new ApiError(409, 'A pending invitation already exists for this user');
    }

    return prisma.teamInvitation.create({
      data: {
        teamId: input.teamId,
        senderId,
        recipientId: recipient.id,
        message: input.message ?? null,
        status: 'Pending',
      },
      include: {
        team: { select: { id: true, name: true, hackathon: true } },
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async listReceived(userId: string) {
    return prisma.teamInvitation.findMany({
      where: { recipientId: userId },
      include: {
        team: { select: { id: true, name: true, hackathon: true, description: true } },
        sender: { select: { id: true, name: true, email: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async acceptInvitation(invitationId: string, userId: string) {
    const invite = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: { include: { _count: { select: { memberships: true } } } },
        recipient: { select: { id: true, skills: true } },
      },
    });
    if (!invite) throw new ApiError(404, 'Invitation not found');
    if (invite.recipientId !== userId) {
      throw new ApiError(403, 'You can only respond to your own invitations');
    }
    if (invite.status !== 'Pending') {
      throw new ApiError(400, `Invitation has already been ${invite.status.toLowerCase()}`);
    }
    if (invite.team._count.memberships >= invite.team.maxMembers) {
      throw new ApiError(400, 'Team has reached maximum capacity');
    }

    return prisma.$transaction(async (tx) => {
      const existing = await tx.teamMembership.findUnique({
        where: { teamId_userId: { teamId: invite.teamId, userId } },
      });
      if (!existing) {
        await tx.teamMembership.create({
          data: {
            teamId: invite.teamId,
            userId,
            role: 'MEMBER',
            memberRoleTitle: 'Contributor',
            skills: invite.recipient.skills.length > 0 ? invite.recipient.skills : ['Invited Member'],
          },
        });
      }
      return tx.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'Accepted' },
      });
    });
  },

  async rejectInvitation(invitationId: string, userId: string) {
    const invite = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invite) throw new ApiError(404, 'Invitation not found');
    if (invite.recipientId !== userId) {
      throw new ApiError(403, 'You can only respond to your own invitations');
    }
    if (invite.status !== 'Pending') {
      throw new ApiError(400, `Invitation has already been ${invite.status.toLowerCase()}`);
    }
    return prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'Rejected' },
    });
  },
};

