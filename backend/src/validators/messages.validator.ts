import { z } from 'zod';

export const queryMessagesSchema = z.object({
  params: z.object({ teamId: z.string().min(1) }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({ teamId: z.string().min(1) }),
  body: z.object({
    content: z.string().trim().max(4000).default(''),
    messageType: z.enum(['TEXT', 'AUDIO', 'ATTACHMENT', 'SYSTEM']).default('TEXT'),
    audioUrl: z.string().trim().optional(),
    audioDuration: z.number().int().min(0).max(3600).optional(),
    attachmentId: z.string().min(1).optional(),
  }),
});

export const deleteMessageSchema = z.object({
  params: z.object({ messageId: z.string().min(1) }),
  body: z.object({
    deleteType: z.enum(['forMe', 'forEveryone']),
  }),
});

