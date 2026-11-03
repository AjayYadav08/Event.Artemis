import { useState, useEffect, useCallback, useRef } from 'react';
import { CampusEvent } from './types';

export type EventsDataStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface UseEventsDataOptions {
  /** Simulated network latency in milliseconds (default: 650ms) */
  simulatedDelayMs?: number;
  /** Fallback static data to serve in simulated mode (e.g. EVENTS_MOCK) */
  fallbackData?: CampusEvent[];
  /** Initial status override for testing */
  initialStatus?: EventsDataStatus;
  /** Optional custom fetcher function for future API integration */
  fetcher?: () => Promise<CampusEvent[]>;
}

export interface UseEventsDataResult {
  /** The retrieved events list (empty array while loading or in error state) */
  events: CampusEvent[];
  /** Current state: 'idle' | 'loading' | 'success' | 'empty' | 'error' */
  status: EventsDataStatus;
  /** Convenience boolean flags */
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isSuccess: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Trigger a re-fetch of event data */
  refetch: () => Promise<void>;
  /** Test helper to simulate an API error */
  simulateError: () => void;
  /** Test helper to simulate an empty response */
  simulateEmpty: () => void;
}

/**
 * Custom hook to manage asynchronous event data fetching with full
 * Loading, Success, Empty, and Error state support.
 *
 * Prepared for future REST / GraphQL API endpoints.
 */
export function useEventsData(options: UseEventsDataOptions = {}): UseEventsDataResult {
  const { simulatedDelayMs = 450, fallbackData = [], fetcher } = options;

  const [status, setStatus] = useState<EventsDataStatus>('loading');
  const [events, setEvents] = useState<CampusEvent[]>(fallbackData);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async (forcedMode?: 'error' | 'empty' | 'normal') => {
    setStatus('loading');
    setError(null);

    try {
      if (fetcher) {
        // Real API integration path
        const data = await fetcher();
        if (!isMountedRef.current) return;

        if (!data || data.length === 0) {
          setEvents([]);
          setStatus('empty');
        } else {
          setEvents(data);
          setStatus('success');
        }
      } else {
        // Simulated asynchronous API fetch
        await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs));
        if (!isMountedRef.current) return;

        if (forcedMode === 'error') {
          throw new Error('Network connection timed out while querying the Event Artemis API.');
        } else if (forcedMode === 'empty') {
          setEvents([]);
          setStatus('empty');
        } else {
          // Success with data
          setEvents(fallbackData);
          setStatus(fallbackData.length > 0 ? 'success' : 'empty');
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('[EventsData] Failed to load event data:', err);
      setError(err?.message || 'Failed to retrieve events. Please check your network connection.');
      setStatus('error');
    }
  }, [fetcher, simulatedDelayMs, fallbackData]);

  // Initial fetch on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(async () => {
    await loadData('normal');
  }, [loadData]);

  const simulateError = useCallback(() => {
    loadData('error');
  }, [loadData]);

  const simulateEmpty = useCallback(() => {
    loadData('empty');
  }, [loadData]);

  return {
    events,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    isEmpty: status === 'empty',
    isSuccess: status === 'success',
    error,
    refetch,
    simulateError,
    simulateEmpty,
  };
}
