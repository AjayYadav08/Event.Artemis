import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from './prisma';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin.trim().replace(/\/+$/, ''))) {
          callback(null, true);
        } else {
          callback(new Error(`Socket.IO CORS origin not allowed: ${origin}`));
        }
      },
      credentials: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        (typeof socket.handshake.headers.authorization === 'string' &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : null);

      if (!rawToken) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(rawToken);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('team:join', async (teamId: string) => {
      if (!teamId || !socket.data.user?.id) return;
      const membership = await prisma.teamMembership.findUnique({
        where: {
          teamId_userId: { teamId, userId: socket.data.user.id },
        },
      });
      if (membership) {
        socket.join(`team:${teamId}`);
      }
    });

    socket.on('team:leave', (teamId: string) => {
      if (teamId) {
        socket.leave(`team:${teamId}`);
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;

