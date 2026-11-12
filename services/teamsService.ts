import { apiRequest } from './apiClient';
import { Team, JoinRequest } from '../components/events/types';

interface ApiRes<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface BackendTeam extends Team {
  hostId?: string;
  isMember?: boolean;
  goals?: string;
}

export const teamsService = {
  async listAvailable(search?: string): Promise<BackendTeam[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiRequest<ApiRes<BackendTeam[]>>(`/teams${qs}`);
    return res.data;
  },

  async listMyTeams(): Promise<BackendTeam[]> {
    const res = await apiRequest<ApiRes<BackendTeam[]>>('/teams/my');
    return res.data;
  },

  async createTeam(input: {
    name: string;
    hackathon: string;
    description: string;
    maxMembers: number;
    expectations?: string[];
  }): Promise<BackendTeam> {
    const res = await apiRequest<ApiRes<BackendTeam>>('/teams', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async updateTeam(
    teamId: string,
    input: {
      name?: string;
      description?: string;
      goals?: string;
      expectations?: string[];
      recruitmentStatus?: 'Open' | 'Closed';
    }
  ): Promise<BackendTeam> {
    const res = await apiRequest<ApiRes<BackendTeam>>(`/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async leaveTeam(teamId: string): Promise<void> {
    await apiRequest(`/teams/${teamId}/leave`, { method: 'POST' });
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    await apiRequest(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
  },

  async makeHost(teamId: string, userId: string): Promise<BackendTeam> {
    const res = await apiRequest<ApiRes<BackendTeam>>(
      `/teams/${teamId}/members/${userId}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'HOST' }),
      }
    );
    return res.data;
  },

  async rateMember(teamId: string, userId: string, stars: number, feedback: string): Promise<void> {
    await apiRequest(`/teams/${teamId}/members/${userId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ stars, feedback }),
    });
  },

  async createJoinRequest(teamId: string, message?: string): Promise<JoinRequest> {
    const res = await apiRequest<ApiRes<JoinRequest>>('/team-requests', {
      method: 'POST',
      body: JSON.stringify({ teamId, message }),
    });
    return res.data;
  },

  async listMyRequests(): Promise<JoinRequest[]> {
    const res = await apiRequest<ApiRes<JoinRequest[]>>('/team-requests/my');
    return res.data;
  },

  async listTeamRequests(teamId: string): Promise<JoinRequest[]> {
    const res = await apiRequest<ApiRes<JoinRequest[]>>(`/team-requests/team/${teamId}`);
    return res.data;
  },

  async acceptRequest(requestId: string): Promise<JoinRequest> {
    const res = await apiRequest<ApiRes<JoinRequest>>(`/team-requests/${requestId}/accept`, {
      method: 'POST',
    });
    return res.data;
  },

  async rejectRequest(requestId: string): Promise<JoinRequest> {
    const res = await apiRequest<ApiRes<JoinRequest>>(`/team-requests/${requestId}/reject`, {
      method: 'POST',
    });
    return res.data;
  },
};

