import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    skills: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
    profileImage: z.string().trim().url().optional().or(z.string().trim().startsWith('/api/')),
  }),
});

