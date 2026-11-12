import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().email('Valid email is required').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long'),
    skills: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Valid email is required').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128),
  }),
});

