import { io, Socket } from 'socket.io-client';
import { getAccessToken, getBackendOrigin } from './apiClient';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL?.trim() || getBackendOrigin()).replace(/\/+$/, '');

let socket: Socket | null = null;

export const connectSocket = (): Socket | null => {
  const token = getAccessToken();
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

