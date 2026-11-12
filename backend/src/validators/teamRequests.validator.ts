import { z } from 'zod';

export const createJoinRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1, 'teamId is required'),
    message: z.string().trim().max(1000).optional(),
  }),
});

