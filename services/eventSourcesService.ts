import { apiRequest } from './apiClient';

export type SourceType = 'SINGLE_EVENT' | 'COLLEGE_WEBSITE' | 'EVENT_LISTING' | 'OTHER';

export interface EventSourceItem {
  id: string;
  name: string;
  sourceUrl: string;
  sourceType: SourceType;
  description?: string | null;
  monitoringEnabled: boolean;
  monitoringStatus: 'ACTIVE' | 'PAUSED' | 'ERROR';
  syncIntervalHours: number;
  maxCrawlDepth: number;
  maxPagesPerCycle: number;
  extractionOptions?: { allowAiFallback?: boolean; allowPdfExtraction?: boolean };
  lastCheckedAt?: string | null;
  lastSuccessfulAt?: string | null;
  nextCheckAt?: string | null;
  lastSyncStatus: string;
  lastError?: string | null;
  aiRequestsUsed: number;
  discoveredEventsCount: number;
  activeEventsCount: number;
  pagesCount: number;
  latestJob?: SyncJobItem | null;
  createdAt: string;
}

export interface SyncJobItem {
  id: string;
  sourceId: string;
  jobType: 'DISCOVER' | 'SYNC';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  progressMessage?: string | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface DiscoveredEventItem {
  id: string;
  sourceId: string;
  sourcePageId?: string | null;
  approvedEventId?: string | null;
  duplicateOfEventId?: string | null;
  duplicateConfidence?: number | null;
  duplicateSignals: string[];
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'MERGED_DUPLICATE' | 'NEEDS_REVIEW';
  extractionMethod: string;
  confidence: number;
  title: string;
  sourcePageUrl: string;
  normalizedPayload: Record<string, any>;
  extractedFields: string[];
  missingFields: string[];
  validationWarnings: string[];
  source?: { id: string; name: string; sourceType: SourceType; sourceUrl: string };
  duplicateOfEvent?: { id: string; title: string; date: string; location: string } | null;
  createdAt: string;
}

export interface SyncHistoryItem {
  id: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string | null;
  status: string;
  pagesScanned: number;
  eventsDiscovered: number;
  eventsUpdated: number;
  fieldsUpdated: number;
  aiCallsUsed: number;
  errorMessage?: string | null;
}

export interface AdminNotificationItem {
  id: string;
  sourceId?: string | null;
  eventId?: string | null;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

export const eventSourcesService = {
  async listSources(): Promise<EventSourceItem[]> {
    const res = await apiRequest<{ success: boolean; data: EventSourceItem[] }>('/event-sources');
    return res.data;
  },

  async getSourceDetails(id: string): Promise<any> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/event-sources/${id}`);
    return res.data;
  },

  async createSource(input: {
    name: string;
    sourceUrl: string;
    sourceType: SourceType;
    description?: string;
    syncIntervalHours?: number;
    maxCrawlDepth?: number;
    maxPagesPerCycle?: number;
    monitoringEnabled?: boolean;
    extractionOptions?: { allowAiFallback?: boolean };
  }): Promise<{ source: EventSourceItem; job: SyncJobItem | null }> {
    const res = await apiRequest<{ success: boolean; data: { source: EventSourceItem; job: SyncJobItem | null } }>(
      '/event-sources',
      { method: 'POST', body: JSON.stringify(input) }
    );
    return res.data;
  },

  async updateSource(id: string, input: Partial<EventSourceItem>): Promise<EventSourceItem> {
    const res = await apiRequest<{ success: boolean; data: EventSourceItem }>(`/event-sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async deleteSource(id: string): Promise<void> {
    await apiRequest(`/event-sources/${id}`, { method: 'DELETE' });
  },

  async triggerSync(id: string): Promise<{ job: SyncJobItem; deduplicated: boolean }> {
    const res = await apiRequest<{ success: boolean; data: { job: SyncJobItem; deduplicated: boolean } }>(
      `/event-sources/${id}/sync`,
      { method: 'POST' }
    );
    return res.data;
  },

  async getJobStatus(jobId: string): Promise<SyncJobItem> {
    const res = await apiRequest<{ success: boolean; data: SyncJobItem }>(`/event-sources/jobs/${jobId}`);
    return res.data;
  },

  async getSyncHistory(id: string): Promise<SyncHistoryItem[]> {
    const res = await apiRequest<{ success: boolean; data: SyncHistoryItem[] }>(`/event-sources/${id}/sync-history`);
    return res.data;
  },

  async listDiscoveredEvents(params?: { sourceId?: string; status?: string }): Promise<DiscoveredEventItem[]> {
    const qs = new URLSearchParams();
    if (params?.sourceId) qs.set('sourceId', params.sourceId);
    if (params?.status) qs.set('status', params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await apiRequest<{ success: boolean; data: DiscoveredEventItem[] }>(`/discovered-events${suffix}`);
    return res.data;
  },

  async updateDiscoveredEvent(
    id: string,
    input: { title?: string; normalizedPayload?: Record<string, any> }
  ): Promise<DiscoveredEventItem> {
    const res = await apiRequest<{ success: boolean; data: DiscoveredEventItem }>(`/discovered-events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async approveDiscoveredEvent(id: string): Promise<any> {
    const res = await apiRequest<{ success: boolean; data: any }>(`/discovered-events/${id}/approve`, {
      method: 'POST',
    });
    return res.data;
  },

  async rejectDiscoveredEvent(id: string, reason?: string): Promise<void> {
    await apiRequest(`/discovered-events/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async bulkApproveDiscoveredEvents(ids: string[]): Promise<any[]> {
    const res = await apiRequest<{ success: boolean; data: any[] }>('/discovered-events/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    return res.data;
  },

  async listNotifications(): Promise<AdminNotificationItem[]> {
    const res = await apiRequest<{ success: boolean; data: AdminNotificationItem[] }>('/event-sources/notifications');
    return res.data;
  },
};

