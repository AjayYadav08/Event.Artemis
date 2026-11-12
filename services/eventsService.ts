import { apiRequest } from './apiClient';
import { CampusEvent } from '../components/events/types';

export interface BackendCampusEvent extends CampusEvent {
  isInterested?: boolean;
  isRegistered?: boolean;
  interestedCount?: number;
}

interface EventsResponse {
  success: boolean;
  message: string;
  data: BackendCampusEvent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const eventsService = {
  async list(params?: Record<string, string | number | undefined>): Promise<BackendCampusEvent[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.set(k, String(v));
      });
    }
    const qs = searchParams.toString();
    const res = await apiRequest<EventsResponse>(`/events${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  async markInterested(eventId: string): Promise<void> {
    await apiRequest(`/events/${eventId}/interest`, { method: 'POST' });
  },

  async removeInterest(eventId: string): Promise<void> {
    await apiRequest(`/events/${eventId}/interest`, { method: 'DELETE' });
  },

  async getMyInterested(): Promise<BackendCampusEvent[]> {
    const res = await apiRequest<{ success: boolean; data: BackendCampusEvent[] }>(
      '/events/my/interested'
    );
    return res.data;
  },

  async register(eventId: string): Promise<void> {
    await apiRequest(`/events/${eventId}/register`, { method: 'POST' });
  },

  async getMyRegistered(): Promise<string[]> {
    const res = await apiRequest<{ success: boolean; data: string[] }>(
      '/events/my/registered'
    );
    return res.data;
  },
};

