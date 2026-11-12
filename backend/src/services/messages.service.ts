import { MessageType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { teamsService } from './teams.service';

export function formatMessageForUser(
  msg: {
    id: string;
    teamId: string;
    senderId: string;
    content: string;
    messageType: MessageType;
    audioUrl: string | null;
    audioDuration: number | null;
    deletedForEveryoneAt: Date | null;
    createdAt: Date;
    sender: { id: string; name: string };
    attachments: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
    }>;
  },
  currentUserId: string
) {
  const isDeletedForEveryone = Boolean(msg.deletedForEveryoneAt);
  const firstAttachment = msg.attachments[0];

  return {
    id: msg.id,
    teamId: msg.teamId,
    senderId: msg.senderId,
    senderName: msg.sender.name,
    text: isDeletedForEveryone ? 'This message was deleted' : msg.content,
    timestamp: msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: msg.createdAt.toISOString(),
    createdAt: msg.createdAt.getTime(),
    isMe: msg.senderId === currentUserId,
    audioUrl: isDeletedForEveryone ? undefined : msg.audioUrl ?? undefined,
    audioDuration: isDeletedForEveryone ? undefined : msg.audioDuration ?? undefined,
    attachment:
      !isDeletedForEveryone && firstAttachment
        ? {
            id: firstAttachment.id,
            name: firstAttachment.fileName,
            url: firstAttachment.fileUrl,
            size: firstAttachment.fileSize,
            type: firstAttachment.fileType,
          }
        : undefined,
    deletedForEveryone: isDeletedForEveryone,
  };
}

export const messagesService = {
  async listByTeam(teamId: string, userId: string, page = 1, limit = 50) {
    await teamsService.assertTeamMember(teamId, userId);

    const where = {
      teamId,
      deletions: { none: { userId } },
    };

    const skip = (page - 1) * limit;
    const [total, rawMessages] = await Promise.all([
      prisma.chatMessage.count({ where }),
      prisma.chatMessage.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rawMessages.map((m) => formatMessageForUser(m, userId)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async send(
    teamId: string,
    senderId: string,
    input: {
      content: string;
      messageType: MessageType;
      audioUrl?: string;
      audioDuration?: number;
      attachmentId?: string;
    }
  ) {
    await teamsService.assertTeamMember(teamId, senderId);

    if (!input.content.trim() && !input.audioUrl && !input.attachmentId) {
      throw new ApiError(400, 'Message content, audio, or attachment is required');
    }

    const created = await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: {
          teamId,
          senderId,
          content: input.content.trim(),
          messageType: input.attachmentId
            ? 'ATTACHMENT'
            : input.audioUrl
            ? 'AUDIO'
            : input.messageType,
          audioUrl: input.audioUrl ?? null,
          audioDuration: input.audioDuration ?? null,
        },
      });

      if (input.attachmentId) {
        const attachment = await tx.chatAttachment.findUnique({
          where: { id: input.attachmentId },
        });
        if (!attachment || attachment.uploaderId !== senderId) {
          throw new ApiError(404, 'Attachment not found or unauthorized');
        }
        await tx.chatAttachment.update({
          where: { id: attachment.id },
          data: { messageId: msg.id, teamId },
        });
      }

      return tx.chatMessage.findUniqueOrThrow({
        where: { id: msg.id },
        include: {
          sender: { select: { id: true, name: true } },
          attachments: true,
        },
      });
    });

    return created;
  },

  async deleteMessage(
    messageId: string,
    userId: string,
    deleteType: 'forMe' | 'forEveryone'
  ) {
    const msg = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) {
      throw new ApiError(404, 'Message not found');
    }

    const membership = await teamsService.assertTeamMember(msg.teamId, userId);

    if (deleteType === 'forEveryone') {
      const canDeleteForEveryone =
        msg.senderId === userId ||
        membership.role === 'HOST' ||
        membership.role === 'ADMIN';
      if (!canDeleteForEveryone) {
        throw new ApiError(
          403,
          'Only the sender or a team admin can delete a message for everyone'
        );
      }

      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          deletedForEveryoneAt: new Date(),
          content: 'This message was deleted',
          audioUrl: null,
          audioDuration: null,
        },
        include: {
          sender: { select: { id: true, name: true } },
          attachments: true,
        },
      });

      return { deleteType, teamId: msg.teamId, message: formatMessageForUser(updated, userId) };
    }

    await prisma.messageDeletion.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: {},
      create: { messageId, userId },
    });

    return { deleteType, teamId: msg.teamId, messageId };
  },
};

