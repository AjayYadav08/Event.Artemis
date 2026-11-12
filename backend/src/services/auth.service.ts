import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/jwt';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
  skills: string[];
  xp: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage,
  role: user.role,
  skills: user.skills,
  xp: user.xp,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

async function issueSessionTokens(user: {
  id: string;
  email: string;
  role: string;
}) {
  const jti = uuidv4();
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    sub: user.id,
    jti,
  });

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: {
    name: string;
    email: string;
    password: string;
    skills?: string[];
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        profileImage: '/avatar.png',
        skills: input.skills ?? [],
      },
    });

    const tokens = await issueSessionTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const tokens = await issueSessionTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token has been revoked or expired');
    }

    // Rotate refresh token inside transaction
    const jti = uuidv4();
    const newAccessToken = signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    });
    const newRefreshToken = signRefreshToken({
      sub: stored.user.id,
      jti,
    });

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          userId: stored.user.id,
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        },
      }),
    ]);

    return {
      user: sanitizeUser(stored.user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  },
};

