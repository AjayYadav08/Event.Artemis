import { z } from 'zod';

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Team name must be at least 2 characters').max(80),
    hackathon: z.string().trim().min(2).max(150).default('Campus Project'),
    description: z.string().trim().max(2000).default(''),
    goals: z.string().trim().max(2000).optional(),
    expectations: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
    maxMembers: z.coerce.number().int().min(2).max(20).default(4),
    location: z.string().trim().max(150).optional(),
  }),
});

export const updateTeamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    hackathon: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(2000).optional(),
    goals: z.string().trim().max(2000).optional(),
    expectations: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
    maxMembers: z.coerce.number().int().min(2).max(20).optional(),
    recruitmentStatus: z.enum(['Open', 'Closed']).optional(),
    location: z.string().trim().max(150).optional(),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(['HOST', 'ADMIN', 'MEMBER']),
    memberRoleTitle: z.string().trim().max(60).optional(),
  }),
});

export const rateMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
  }),
  body: z.object({
    stars: z.number().int().min(1).max(5),
    feedback: z.string().trim().max(1000).optional(),
  }),
});

