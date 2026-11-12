import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Plus, RefreshCw, Pause, Play, Trash2, CheckCircle2, XCircle,
  AlertTriangle, Clock, ExternalLink, Edit3, History, Sparkles, X, Check,
  Layers, Bell, ShieldAlert
} from 'lucide-react';
import {
  eventSourcesService,
  EventSourceItem,
  DiscoveredEventItem,
  SourceType,
} from '../../../services/eventSourcesService';

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATED: 'bg-blue-50 text-blue-700 border-blue-200',
  NO_CHANGES: 'bg-slate-100 text-slate-600 border-slate-200',
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
  NEEDS_REVIEW: 'bg-orange-50 text-orange-700 border-orange-200',
  PARTIALLY_SUCCESSFUL: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  PAUSED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  SINGLE_EVENT: 'Single Event Website',
  COLLEGE_WEBSITE: 'College / Institution Website',
  EVENT_LISTING: 'Event Listing Website',
  OTHER: 'Other',
};

export const EventSourcesAdminPage: React.FC = () => {
  const qc = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'preview' | 'alerts'>('sources');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | undefined>(undefined);

  // URL-Only Quick Add
  const [quickUrl, setQuickUrl] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isAddingQuick, setIsAddingQuick] = useState(false);
  const [autoPreviewSourceId, setAutoPreviewSourceId] = useState<string | null>(null);

  // Edit Source Modal (existing sources only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<EventSourceItem | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('SINGLE_EVENT');
  const [description, setDescription] = useState('');
  const [syncIntervalHours, setSyncIntervalHours] = useState(12);
  const [maxCrawlDepth, setMaxCrawlDepth] = useState(2);
  const [maxPagesPerCycle, setMaxPagesPerCycle] = useState(50);
  const [allowAiFallback, setAllowAiFallback] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active polling jobs
  const [activeJobMap, setActiveJobMap] = useState<Record<string, string>>({}); // sourceId -> jobId
  const [historySource, setHistorySource] = useState<EventSourceItem | null>(null);
  const [deleteConfirmSource, setDeleteConfirmSource] = useState<EventSourceItem | null>(null);

  // Preview selection & editing
  const [selectedDiscoveryIds, setSelectedDiscoveryIds] = useState<Set<string>>(new Set());
  const [editingDiscovery, setEditingDiscovery] = useState<DiscoveredEventItem | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, any>>({});
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['event-sources'],
    queryFn: () => eventSourcesService.listSources(),
  });

  const { data: discoveredEvents = [], isLoading: discoveriesLoading } = useQuery({
    queryKey: ['discovered-events', selectedSourceFilter],
    queryFn: () => eventSourcesService.listDiscoveredEvents({ sourceId: selectedSourceFilter }),
  });

  const { data: syncHistory = [] } = useQuery({
    queryKey: ['event-source-history', historySource?.id],
    queryFn: () => eventSourcesService.getSyncHistory(historySource!.id),
    enabled: Boolean(historySource),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => eventSourcesService.listNotifications(),
  });

  // Poll active background jobs
  useEffect(() => {
    const entries = Object.entries(activeJobMap);
    if (entries.length === 0) return;

    const timer = setInterval(async () => {
      let updated = false;
      const next = { ...activeJobMap };

      for (const [srcId, jobId] of entries) {
        try {
          const job = await eventSourcesService.getJobStatus(jobId);
          if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
            delete next[srcId];
            updated = true;
            qc.invalidateQueries({ queryKey: ['event-sources'] });
            qc.invalidateQueries({ queryKey: ['discovered-events'] });
            qc.invalidateQueries({ queryKey: ['events'] });
            qc.invalidateQueries({ queryKey: ['admin-notifications'] });
            if (autoPreviewSourceId === srcId && job.status === 'COMPLETED') {
              setSelectedSourceFilter(srcId);
              setActiveSubTab('preview');
              setAutoPreviewSourceId(null);
            }
          }
        } catch {
          delete next[srcId];
          updated = true;
        }
      }
      if (updated) setActiveJobMap(next);
    }, 2000);

    return () => clearInterval(timer);
  }, [activeJobMap, qc]);

  const resetForm = () => {
    setSourceName('');
    setSourceUrl('');
    setSourceType('SINGLE_EVENT');
    setDescription('');
    setSyncIntervalHours(12);
    setMaxCrawlDepth(2);
    setMaxPagesPerCycle(50);
    setAllowAiFallback(true);
    setFormError(null);
    setEditingSource(null);
  };

  const openEditModal = (src: EventSourceItem) => {
    setEditingSource(src);
    setSourceName(src.name);
    setSourceUrl(src.sourceUrl);
    setSourceType(src.sourceType);
    setDescription(src.description || '');
    setSyncIntervalHours(src.syncIntervalHours);
    setMaxCrawlDepth(src.maxCrawlDepth);
    setMaxPagesPerCycle(src.maxPagesPerCycle);
    setAllowAiFallback(src.extractionOptions?.allowAiFallback !== false);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleQuickAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    const trimmed = quickUrl.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setQuickError('URL must start with http:// or https://');
        return;
      }
    } catch {
      setQuickError('Please enter a valid website URL');
      return;
    }

    setIsAddingQuick(true);
    try {
      const res = await eventSourcesService.createSource({ sourceUrl: trimmed });
      setQuickUrl('');
      if (res.job) {
        setActiveJobMap((prev) => ({ ...prev, [res.source.id]: res.job!.id }));
        setAutoPreviewSourceId(res.source.id);
      }
      setActionFeedback(`Recognized "${res.source.name}" (${SOURCE_TYPE_LABEL[res.source.sourceType]}) — discovering events...`);
      qc.invalidateQueries({ queryKey: ['event-sources'] });
    } catch (err: any) {
      setQuickError(err?.message || 'Failed to add website URL');
    } finally {
      setIsAddingQuick(false);
    }
  };

  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const parsed = new URL(sourceUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setFormError('URL must start with http:// or https://');
        return;
      }
    } catch {
      setFormError('Please enter a valid website URL');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSource) {
        await eventSourcesService.updateSource(editingSource.id, {
          name: sourceName.trim(),
          sourceType,
          description: description.trim() || null,
          syncIntervalHours,
          maxCrawlDepth,
          maxPagesPerCycle,
          extractionOptions: { allowAiFallback },
        });
        setActionFeedback(`Updated source "${sourceName.trim()}"`);
      } else {
        const res = await eventSourcesService.createSource({
          name: sourceName.trim(),
          sourceUrl: sourceUrl.trim(),
          sourceType,
          description: description.trim() || undefined,
          syncIntervalHours,
          maxCrawlDepth,
          maxPagesPerCycle,
          monitoringEnabled: true,
          extractionOptions: { allowAiFallback },
        });
        if (res.job) {
          setActiveJobMap((prev) => ({ ...prev, [res.source.id]: res.job!.id }));
        }
        setActionFeedback(`Added "${sourceName.trim()}" and queued initial discovery`);
      }
      qc.invalidateQueries({ queryKey: ['event-sources'] });
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save event source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMonitoring = async (src: EventSourceItem) => {
    await eventSourcesService.updateSource(src.id, { monitoringEnabled: !src.monitoringEnabled });
    qc.invalidateQueries({ queryKey: ['event-sources'] });
    setActionFeedback(src.monitoringEnabled ? `Paused monitoring for ${src.name}` : `Resumed monitoring for ${src.name}`);
  };

  const handleManualSync = async (src: EventSourceItem) => {
    const res = await eventSourcesService.triggerSync(src.id);
    setActiveJobMap((prev) => ({ ...prev, [src.id]: res.job.id }));
    setActionFeedback(res.deduplicated ? `Sync already running for ${src.name}` : `Queued manual sync for ${src.name}`);
    qc.invalidateQueries({ queryKey: ['event-sources'] });
  };

  const handleDeleteSource = async () => {
    if (!deleteConfirmSource) return;
    await eventSourcesService.deleteSource(deleteConfirmSource.id);
    setActionFeedback(`Removed source "${deleteConfirmSource.name}" (approved events preserved)`);
    setDeleteConfirmSource(null);
    qc.invalidateQueries({ queryKey: ['event-sources'] });
    qc.invalidateQueries({ queryKey: ['discovered-events'] });
  };

  const handleApproveOne = async (id: string) => {
    await eventSourcesService.approveDiscoveredEvent(id);
    qc.invalidateQueries({ queryKey: ['discovered-events'] });
    qc.invalidateQueries({ queryKey: ['event-sources'] });
    qc.invalidateQueries({ queryKey: ['events'] });
    setActionFeedback('Event approved and published to Events Discovery');
  };

  const handleRejectOne = async (id: string) => {
    await eventSourcesService.rejectDiscoveredEvent(id);
    qc.invalidateQueries({ queryKey: ['discovered-events'] });
    setActionFeedback('Discovered event rejected');
  };

  const handleBulkApprove = async (ids: string[]) => {
    if (ids.length === 0) return;
    await eventSourcesService.bulkApproveDiscoveredEvents(ids);
    setSelectedDiscoveryIds(new Set());
    qc.invalidateQueries({ queryKey: ['discovered-events'] });
    qc.invalidateQueries({ queryKey: ['event-sources'] });
    qc.invalidateQueries({ queryKey: ['events'] });
    setActionFeedback(`Approved ${ids.length} event(s)`);
  };

  const handleSaveDiscoveryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscovery) return;
    await eventSourcesService.updateDiscoveredEvent(editingDiscovery.id, {
      title: editDraft.title,
      normalizedPayload: {
        ...editingDiscovery.normalizedPayload,
        ...editDraft,
      },
    });
    setEditingDiscovery(null);
    qc.invalidateQueries({ queryKey: ['discovered-events'] });
    setActionFeedback('Updated extracted event preview');
  };

  const pendingDiscoveries = discoveredEvents.filter(
    (d) => d.status === 'PENDING_REVIEW' || d.status === 'NEEDS_REVIEW'
  );
  const validPendingIds = pendingDiscoveries
    .filter((d) => d.validationWarnings.length === 0 && !d.duplicateOfEventId)
    .map((d) => d.id);

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-6 space-y-6">
      {/* Header + URL-Only Source Registration */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EBF3FF] text-[#1D4ED8] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Automated Event Sources & Monitoring
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste any event, Unstop, Luma, or college website URL — Event Artemis automatically recognizes the platform, extracts events, and monitors updates.
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickAddUrl} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="url"
            required
            value={quickUrl}
            onChange={(e) => {
              setQuickUrl(e.target.value);
              if (quickError) setQuickError(null);
            }}
            placeholder="Paste website URL (e.g. https://unstop.com/hackathons, https://lu.ma/ai, or college events page)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F3]"
          />
          <button
            type="submit"
            disabled={isAddingQuick}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0070F3] hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {isAddingQuick ? 'Discovering...' : 'Add Website / Discover Events'}
          </button>
        </form>

        {quickError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
            {quickError}
          </div>
        )}
      </div>

      {actionFeedback && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2.5 rounded-xl text-xs font-semibold">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-blue-600 hover:text-blue-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Registered Sources</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{sources.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Active Monitoring</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {sources.filter((s) => s.monitoringEnabled).length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Pending Review</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingDiscoveries.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Change Alerts</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{notifications.length}</div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('sources')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
            activeSubTab === 'sources' ? 'bg-[#EBF3FF] text-[#1D4ED8]' : 'text-slate-600 hover:bg-white'
          }`}
        >
          Source Management ({sources.length})
        </button>
        <button
          onClick={() => setActiveSubTab('preview')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'preview' ? 'bg-[#EBF3FF] text-[#1D4ED8]' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Extraction Preview ({pendingDiscoveries.length})
        </button>
        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'alerts' ? 'bg-[#EBF3FF] text-[#1D4ED8]' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          Monitoring Alerts ({notifications.length})
        </button>
      </div>

      {/* TAB 1: SOURCE MANAGEMENT DASHBOARD */}
      {activeSubTab === 'sources' && (
        <div className="space-y-4">
          {sourcesLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
              Loading registered sources...
            </div>
          ) : sources.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
              <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No website sources registered yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Add Website Source" to submit a single event URL or college event-listing page.
              </p>
            </div>
          ) : (
            sources.map((src) => {
              const isSyncing = Boolean(activeJobMap[src.id]) || src.lastSyncStatus === 'PROCESSING';
              return (
                <div key={src.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">{src.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {SOURCE_TYPE_LABEL[src.sourceType]}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            STATUS_BADGE[src.lastSyncStatus] || STATUS_BADGE.PENDING
                          }`}
                        >
                          {isSyncing ? 'PROCESSING' : src.lastSyncStatus}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            src.monitoringEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {src.monitoringEnabled ? 'Auto-Monitor ON' : 'Paused'}
                        </span>
                      </div>
                      <a
                        href={src.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline break-all"
                      >
                        {src.sourceUrl}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      {src.description && <p className="text-xs text-slate-500">{src.description}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedSourceFilter(src.id);
                          setActiveSubTab('preview');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Preview ({src.discoveredEventsCount})
                      </button>
                      <button
                        onClick={() => handleManualSync(src)}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-[#EBF3FF] text-[#1D4ED8] hover:bg-blue-100 text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Now
                      </button>
                      <button
                        onClick={() => handleToggleMonitoring(src)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {src.monitoringEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {src.monitoringEnabled ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => openEditModal(src)}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        title="Edit configuration"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setHistorySource(src)}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        title="Sync history"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmSource(src)}
                        className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remove source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Discovered</span>
                      <span className="font-bold text-slate-800">{src.discoveredEventsCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Active Linked Events</span>
                      <span className="font-bold text-slate-800">{src.activeEventsCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Last Successful Check</span>
                      <span className="font-semibold text-slate-700">
                        {src.lastSuccessfulAt ? new Date(src.lastSuccessfulAt).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Next Scheduled Check</span>
                      <span className="font-semibold text-slate-700">
                        {src.monitoringEnabled && src.nextCheckAt
                          ? new Date(src.nextCheckAt).toLocaleString()
                          : 'Paused'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Interval / AI Calls</span>
                      <span className="font-semibold text-slate-700">
                        Every {src.syncIntervalHours}h · {src.aiRequestsUsed} AI
                      </span>
                    </div>
                  </div>

                  {src.lastError && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="truncate">Last error: {src.lastError}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: EXTRACTION PREVIEW & APPROVAL */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <select
                value={selectedSourceFilter || ''}
                onChange={(e) => setSelectedSourceFilter(e.target.value || undefined)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">All Sources</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                Showing {discoveredEvents.length} extracted event candidate(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedDiscoveryIds.size > 0 && (
                <button
                  onClick={() => handleBulkApprove(Array.from(selectedDiscoveryIds))}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Approve Selected ({selectedDiscoveryIds.size})
                </button>
              )}
              {validPendingIds.length > 0 && (
                <button
                  onClick={() => handleBulkApprove(validPendingIds)}
                  className="px-3.5 py-2 rounded-xl bg-[#0070F3] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Approve All Valid ({validPendingIds.length})
                </button>
              )}
            </div>
          </div>

          {discoveriesLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
              Loading extracted event previews...
            </div>
          ) : discoveredEvents.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-sm text-slate-500">
              No discovered events in preview yet. Add or sync a source to extract events.
            </div>
          ) : (
            discoveredEvents.map((item) => {
              const p = item.normalizedPayload || {};
              const isPending = item.status === 'PENDING_REVIEW' || item.status === 'NEEDS_REVIEW';
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {isPending && (
                        <input
                          type="checkbox"
                          checked={selectedDiscoveryIds.has(item.id)}
                          onChange={(e) => {
                            const next = new Set(selectedDiscoveryIds);
                            if (e.target.checked) next.add(item.id);
                            else next.delete(item.id);
                            setSelectedDiscoveryIds(next);
                          }}
                          className="mt-1 rounded border-slate-300"
                        />
                      )}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                            {Math.round(item.confidence * 100)}% confidence · {item.extractionMethod}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {item.status}
                          </span>
                        </div>
                        {p.description && (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed mt-2">
                            <span className="font-bold text-slate-900 block mb-0.5">About / Overview</span>
                            <p className="line-clamp-3">{p.description}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 text-xs">
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Event Date</span>
                            <span className="font-semibold text-slate-800">{p.date || 'TBA'} {p.time ? `· ${p.time}` : ''}</span>
                          </div>
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Reg. Deadline</span>
                            <span className="font-semibold text-slate-800">
                              {p.registrationDeadline ? new Date(p.registrationDeadline).toLocaleDateString() : 'Not listed'}
                            </span>
                          </div>
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                            <span className="font-semibold text-slate-800 truncate block">{p.location || 'TBA'}</span>
                          </div>
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Mode & Team Size</span>
                            <span className="font-semibold text-slate-800">{p.participationMode || 'Offline'} · {p.teamSize || '1-4'}</span>
                          </div>
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Category & Domain</span>
                            <span className="font-semibold text-slate-800">{p.category || 'Competition'} · {p.domain || 'General'}</span>
                          </div>
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Organizer</span>
                            <span className="font-semibold text-slate-800 truncate block">{p.conductingAgency || item.source?.name || 'TBA'}</span>
                          </div>
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Prize Pool & Fee</span>
                            <span className="font-semibold text-slate-800">{p.prizePool || 'TBA'} · {p.registrationFee || 'Free'}</span>
                          </div>
                          <div className="bg-slate-50/70 rounded-lg px-2.5 py-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Eligibility</span>
                            <span className="font-semibold text-slate-800 truncate block">{p.eligibility || 'All Students'}</span>
                          </div>
                        </div>

                        {Array.isArray(p.tracks) && p.tracks.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-500">Tracks:</span>
                            {p.tracks.slice(0, 6).map((t: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {Array.isArray(p.rules) && p.rules.length > 0 && (
                          <div className="text-[11px] text-slate-600 pt-1">
                            <span className="font-bold text-slate-700">Rules ({p.rules.length}): </span>
                            <span>{p.rules.slice(0, 2).join(' · ')}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs pt-1">
                          <a href={item.sourcePageUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            Source Page
                          </a>
                          {p.registrationUrl && (
                            <a href={p.registrationUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              Registration URL
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingDiscovery(item);
                            setEditDraft({
                              title: item.title,
                              description: p.description || '',
                              date: p.date || '',
                              location: p.location || '',
                              participationMode: p.participationMode || 'Offline',
                              category: p.category || 'Competition',
                              domain: p.domain || '',
                              conductingAgency: p.conductingAgency || '',
                              prizePool: p.prizePool || '',
                              registrationFee: p.registrationFee || 'Free',
                              teamSize: p.teamSize || '1-4 Members',
                              eligibility: p.eligibility || 'All Students',
                              registrationUrl: p.registrationUrl || '',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleApproveOne(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectOne(item.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Extracted vs Missing Fields + Warnings + Duplicate Match */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="font-bold text-emerald-700">Extracted Fields: </span>
                      <span className="text-slate-600">{item.extractedFields.join(', ') || 'None'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">Missing Fields: </span>
                      <span className="text-slate-500">{item.missingFields.join(', ') || 'None'}</span>
                    </div>
                  </div>

                  {item.validationWarnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 space-y-0.5">
                      {item.validationWarnings.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.duplicateOfEvent && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-purple-800 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>
                        Potential duplicate of existing event <strong>{item.duplicateOfEvent.title}</strong> (
                        {item.duplicateSignals.join(', ')})
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: MONITORING ALERTS */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-sm text-slate-500">
              No monitoring change alerts yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">{n.title}</div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADD / EDIT SOURCE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingSource ? 'Edit Website Source' : 'Add Website Source'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSource} className="space-y-3.5">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source Name</label>
                <input
                  required
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. MIT TechFest 2026 Events"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                <input
                  required
                  type="url"
                  disabled={Boolean(editingSource)}
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://college.edu/events"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm disabled:bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as SourceType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="SINGLE_EVENT">Single Event Website</option>
                    <option value="COLLEGE_WEBSITE">College / Institution Website</option>
                    <option value="EVENT_LISTING">Event Listing Website</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sync Interval (hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={syncIntervalHours}
                    onChange={(e) => setSyncIntervalHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              {sourceType !== 'SINGLE_EVENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Crawl Depth</label>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={maxCrawlDepth}
                      onChange={(e) => setMaxCrawlDepth(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Pages / Cycle</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxPagesPerCycle}
                      onChange={(e) => setMaxPagesPerCycle(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAiFallback}
                  onChange={(e) => setAllowAiFallback(e.target.checked)}
                />
                Use AI extraction fallback for unstructured pages (when configured)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#0070F3] hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSource ? 'Save Changes' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DISCOVERED EVENT MODAL */}
      {editingDiscovery && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Edit Before Approval</h2>
              <button onClick={() => setEditingDiscovery(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDiscoveryEdit} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Name</label>
                <input
                  required
                  value={editDraft.title || ''}
                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">About / Overview (Concise Summary Only)</label>
                <textarea
                  rows={3}
                  value={editDraft.description || ''}
                  onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Date</label>
                  <input
                    value={editDraft.date || ''}
                    onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <input
                    value={editDraft.location || ''}
                    onChange={(e) => setEditDraft((d) => ({ ...d, location: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mode</label>
                  <select
                    value={editDraft.participationMode || 'Offline'}
                    onChange={(e) => setEditDraft((d) => ({ ...d, participationMode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prize Pool</label>
                  <input
                    value={editDraft.prizePool || ''}
                    onChange={(e) => setEditDraft((d) => ({ ...d, prizePool: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDiscovery(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#0070F3] text-white text-xs font-bold">
                  Save Preview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYNC HISTORY MODAL */}
      {historySource && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Sync History · {historySource.name}</h2>
              <button onClick={() => setHistorySource(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {syncHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No synchronization runs recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {syncHistory.map((h) => (
                  <div key={h.id} className="border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${STATUS_BADGE[h.status] || STATUS_BADGE.PENDING}`}>
                        {h.status}
                      </span>
                      <span className="ml-2 text-slate-600">
                        {h.pagesScanned} pages · {h.eventsDiscovered} discovered · {h.fieldsUpdated} fields updated
                      </span>
                      {h.errorMessage && <p className="text-rose-600 mt-1">{h.errorMessage}</p>}
                    </div>
                    <span className="text-slate-400 shrink-0">{new Date(h.startedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">Remove Website Source?</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Removing <strong>{deleteConfirmSource.name}</strong> will stop monitoring its URL. Previously approved
              and published events in Event Artemis will <strong>not</strong> be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmSource(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSource}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Remove Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

