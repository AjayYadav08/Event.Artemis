import { z } from 'zod';

export const createInvitationSchema = z.object({
  body: z.object({
    teamId: z.string().min(1, 'teamId is required'),
    recipientEmail: z.string().trim().email('Valid recipient email is required').toLowerCase().optional(),
    recipientId: z.string().min(1).optional(),
    message: z.string().trim().max(500).optional(),
  }).refine((data) => Boolean(data.recipientEmail || data.recipientId), {
    message: 'Either recipientEmail or recipientId is required',
  }),
});

