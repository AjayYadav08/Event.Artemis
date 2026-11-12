import { apiRequest, getBackendOrigin } from './apiClient';
import { ChatMessage, ChatAttachment } from '../components/events/types';

interface ApiRes<T> {
  success: boolean;
  message: string;
  data: T;
}

export const chatService = {
  async listMessages(teamId: string, page = 1, limit = 50): Promise<ChatMessage[]> {
    const res = await apiRequest<ApiRes<ChatMessage[]>>(
      `/messages/team/${teamId}?page=${page}&limit=${limit}`
    );
    const origin = getBackendOrigin();
    return res.data.map((m) => ({
      ...m,
      attachment: m.attachment
        ? {
            ...m.attachment,
            url: m.attachment.url.startsWith('http')
              ? m.attachment.url
              : `${origin}${m.attachment.url}`,
          }
        : undefined,
    }));
  },

  async sendMessage(
    teamId: string,
    payload: {
      content: string;
      messageType?: 'TEXT' | 'AUDIO' | 'ATTACHMENT';
      audioUrl?: string;
      audioDuration?: number;
      attachmentId?: string;
    }
  ): Promise<ChatMessage> {
    const res = await apiRequest<ApiRes<ChatMessage>>(`/messages/team/${teamId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const origin = getBackendOrigin();
    const m = res.data;
    return {
      ...m,
      attachment: m.attachment
        ? {
            ...m.attachment,
            url: m.attachment.url.startsWith('http')
              ? m.attachment.url
              : `${origin}${m.attachment.url}`,
          }
        : undefined,
    };
  },

  async deleteMessage(
    messageId: string,
    deleteType: 'forMe' | 'forEveryone'
  ): Promise<void> {
    await apiRequest(`/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleteType }),
    });
  },

  async uploadAttachment(file: File, teamId?: string): Promise<ChatAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (teamId) formData.append('teamId', teamId);

    const res = await apiRequest<ApiRes<ChatAttachment>>('/attachments/upload', {
      method: 'POST',
      body: formData,
    });
    const origin = getBackendOrigin();
    return {
      ...res.data,
      url: res.data.url.startsWith('http') ? res.data.url : `${origin}${res.data.url}`,
    };
  },
};

