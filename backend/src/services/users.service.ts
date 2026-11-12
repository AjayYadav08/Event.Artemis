import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { sanitizeUser } from './auth.service';

export const usersService = {
  async getById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return sanitizeUser(user);
  },

  async updateProfile(
    userId: string,
    data: { name?: string; skills?: string[]; profileImage?: string }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.skills !== undefined ? { skills: data.skills } : {}),
        ...(data.profileImage !== undefined ? { profileImage: data.profileImage } : {}),
      },
    });
    return sanitizeUser(user);
  },

  async searchUsers(query: string, excludeUserId: string) {
    const users = await prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        skills: true,
        role: true,
      },
    });
    return users;
  },
};

