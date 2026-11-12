import { apiRequest, setAccessToken } from './apiClient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: 'STUDENT' | 'ORGANIZER' | 'ADMIN';
  skills: string[];
  xp: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await apiRequest<ApiResponse<{ user: AuthUser; accessToken: string }>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuthRefresh: true,
      }
    );
    setAccessToken(res.data.accessToken);
    return res.data.user;
  },

  async register(name: string, email: string, password: string, skills?: string[]): Promise<AuthUser> {
    const res = await apiRequest<ApiResponse<{ user: AuthUser; accessToken: string }>>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password, skills }),
        skipAuthRefresh: true,
      }
    );
    setAccessToken(res.data.accessToken);
    return res.data.user;
  },

  async restoreSession(): Promise<AuthUser | null> {
    try {
      const res = await apiRequest<ApiResponse<{ user: AuthUser; accessToken: string }>>(
        '/auth/refresh',
        { method: 'POST', skipAuthRefresh: true }
      );
      setAccessToken(res.data.accessToken);
      return res.data.user;
    } catch {
      setAccessToken(null);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<ApiResponse<null>>('/auth/logout', {
        method: 'POST',
        skipAuthRefresh: true,
      });
    } finally {
      setAccessToken(null);
    }
  },

  async getMe(): Promise<AuthUser> {
    const res = await apiRequest<ApiResponse<AuthUser>>('/users/me');
    return res.data;
  },

  async updateProfile(data: { name?: string; skills?: string[] }): Promise<AuthUser> {
    const res = await apiRequest<ApiResponse<AuthUser>>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

