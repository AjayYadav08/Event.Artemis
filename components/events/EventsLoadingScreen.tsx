import React from 'react';
import { AlertCircle, RefreshCw, CalendarX, Sparkles } from 'lucide-react';

/**
 * Section-level Feed Skeleton:
 * Appears ONLY in the data section where events are being fetched.
 * The static header above it remains completely visible and interactive.
 * Features subtle, theme-matching moving gradient shimmers.
 */
export const EventsFeedSkeleton: React.FC = () => {
  return (
    <div className="space-y-12 px-8 pb-32 animate-in fade-in duration-300 select-none">
      
      {/* Subtle activity status bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#0070F3] absolute" />
          </div>
          <span className="text-xs font-semibold text-slate-600 tracking-tight">
            Syncing live campus event schedule...
          </span>
        </div>
        <div className="relative w-24 h-1 bg-slate-200/80 rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-[#0070F3] rounded-full shimmer-progress-bar" />
        </div>
      </div>

      {/* Section 1: Closing Soon Skeletons */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-rose-500 rounded-full" />
            <div className="h-6 w-36 bg-slate-200/90 rounded-md shimmer-animated" />
            <div className="h-5 w-8 bg-slate-100 rounded-full shimmer-animated" />
          </div>
          <div className="h-4 w-20 bg-slate-100 rounded shimmer-animated" />
        </div>

        {/* 3 Event Card Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full">
          {[1, 2, 3].map((idx) => (
            <div
              key={`feed-skeleton-closing-${idx}`}
              className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between shimmer-card space-y-2.5"
            >
              {/* Top Row Skeleton */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shimmer-animated shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-4 w-32 bg-slate-200 rounded shimmer-animated" />
                    <div className="h-4 w-12 bg-slate-100 rounded shimmer-animated shrink-0" />
                  </div>
                  <div className="h-3 w-24 bg-slate-100 rounded shimmer-animated" />
                </div>
              </div>

              {/* Middle Row Skeleton */}
              <div className="grid grid-cols-2 gap-2 my-1">
                <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 shimmer-animated" />
                <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 shimmer-animated" />
              </div>

              {/* Bottom Row Skeleton */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 shimmer-animated shrink-0" />
                  <div className="h-3 w-16 bg-slate-100 rounded shimmer-animated" />
                </div>
                <div className="h-7.5 w-20 bg-slate-200 rounded-xl shimmer-animated shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Upcoming Events Skeletons */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-blue-500 rounded-full" />
          <div className="h-6 w-44 bg-slate-200/90 rounded-md shimmer-animated" />
          <div className="h-5 w-8 bg-slate-100 rounded-full shimmer-animated" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full">
          {[4, 5, 6].map((idx) => (
            <div
              key={`feed-skeleton-upcoming-${idx}`}
              className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between shimmer-card space-y-2.5"
            >
              {/* Top Row Skeleton */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shimmer-animated shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-4 w-28 bg-slate-200 rounded shimmer-animated" />
                    <div className="h-4 w-12 bg-slate-100 rounded shimmer-animated shrink-0" />
                  </div>
                  <div className="h-3 w-20 bg-slate-100 rounded shimmer-animated" />
                </div>
              </div>

              {/* Middle Row Skeleton */}
              <div className="grid grid-cols-2 gap-2 my-1">
                <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 shimmer-animated" />
                <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 shimmer-animated" />
              </div>

              {/* Bottom Row Skeleton */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 shimmer-animated shrink-0" />
                  <div className="h-3 w-16 bg-slate-100 rounded shimmer-animated" />
                </div>
                <div className="h-7.5 w-20 bg-slate-200 rounded-xl shimmer-animated shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

/**
 * Clean Error State with retry option
 */
export const EventsErrorScreen: React.FC<{
  error: string | null;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-14 text-center max-w-md mx-auto my-auto animate-in fade-in duration-300">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">Unable to Load Events</h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        {error || 'An unexpected error occurred while communicating with the event service. Please check your network and try again.'}
      </p>
      <button
        onClick={onRetry}
        className="mt-6 px-5 py-2.5 rounded-xl bg-[#0070F3] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};

/**
 * Clean Empty State when no events exist in database
 */
export const EventsEmptyScreen: React.FC<{
  onRefresh?: () => void;
}> = ({ onRefresh }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-14 text-center max-w-md mx-auto my-auto animate-in fade-in duration-300">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shadow-xs mb-4">
        <CalendarX className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">No Events Scheduled</h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        There are currently no upcoming campus events or hackathons scheduled. Check back soon or refresh the feed.
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs inline-flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      )}
    </div>
  );
};

// Backwards compatibility alias
export const EventsSkeletonScreen = EventsFeedSkeleton;
