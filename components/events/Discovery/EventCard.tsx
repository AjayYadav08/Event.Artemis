import React from 'react';
import { ArrowRight, Trophy, Terminal, Palette, Mic2, Zap, Heart, ThumbsDown } from 'lucide-react';
import { CampusEvent } from '../types';
import {
  getEventMode,
  getRegistrationDeadline,
  getUnifiedEventDate,
  getUnifiedEventTime,
} from '../Details/eventDetailsUtils';

interface EventCardProps {
  event: CampusEvent;
  isInterested: boolean;
  isRegistered: boolean;
  isNotInterested?: boolean;
  isPast: boolean;
  isUrgent: boolean;
  timeString: string | null;
  onExplore: (event: CampusEvent) => void;
  toggleInterested: (id: string) => void;
  markNotInterested?: (id: string) => void;
}

const getFormattedEventDate = (event: CampusEvent): string => {
  return `${getUnifiedEventDate(event)} · ${getUnifiedEventTime(event, false)}`;
};

const EventCard: React.FC<EventCardProps> = ({
  event,
  isInterested,
  isNotInterested = false,
  isPast,
  isUrgent,
  onExplore,
  toggleInterested,
  markNotInterested
}) => {
  const eventMode = getEventMode(event);
  const formattedEventDate = getFormattedEventDate(event);
  const registrationDeadline = getRegistrationDeadline(event, isPast);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Competition': return <Trophy className="w-3 h-3" />;
      case 'Workshop': return <Terminal className="w-3 h-3" />;
      case 'Fest': return <Palette className="w-3 h-3" />;
      case 'Seminar': return <Mic2 className="w-3 h-3" />;
      default: return <Zap className="w-3 h-3" />;
    }
  };

  const getModeBadgeStyle = (mode: string) => {
    switch (mode) {
      case 'Online': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Hybrid': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div
      onClick={() => onExplore(event)}
      style={{ containerType: 'inline-size' }}
      className="w-full h-[195px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.07)] transition-all duration-200 ease-out flex flex-col justify-between overflow-hidden group cursor-pointer event-card-container"
    >
      <style>{`
        @container (max-width: 235px) {
          .event-card-container .event-mode-badge {
            display: none !important;
          }
        }
      `}</style>
      {/* =========================================================================
          ROW 1: Event Name + Location (with 📍 symbol) on Left | Naked Like & Dislike on Right
          ========================================================================= */}
      <div className="px-2.5 pt-2.5 pb-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[14.5px] font-bold text-slate-900 tracking-tight leading-snug group-hover:text-[#0070F3] transition-colors truncate" title={event.title}>
              {event.title}
            </h3>

            {/* Location directly below Event Name with 📍 icon */}
            <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600 font-medium mt-1 truncate">
              <span className="text-slate-400 text-xs shrink-0">📍</span>
              <span className="text-slate-700 font-medium truncate" title={event.location}>
                {event.location}
              </span>
            </div>
          </div>

          {/* Naked Actions: Pure Symbols with No Outer Boundary */}
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            {/* Like / Interested Symbol */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleInterested(event.id); }}
              className={`p-1 transition-all cursor-pointer hover:scale-125 active:scale-90 select-none ${
                isInterested ? 'text-rose-500' : 'text-slate-300 hover:text-rose-500'
              }`}
              title={isInterested ? 'Unlike / Remove from Saved' : 'Mark as Interested'}
              aria-label={isInterested ? 'Unlike' : 'Interested'}
            >
              <Heart className={`w-6 h-6 stroke-current ${isInterested ? 'fill-current' : ''}`} strokeWidth={2} />
            </button>

            {/* Dislike Symbol */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); markNotInterested?.(event.id); }}
              className={`p-1 transition-all cursor-pointer hover:scale-125 active:scale-90 select-none ${
                isNotInterested ? 'text-slate-900' : 'text-slate-300 hover:text-slate-800'
              }`}
              title={isNotInterested ? 'Remove Dislike' : 'Not Interested'}
              aria-label="Dislike"
            >
              <ThumbsDown className={`w-6 h-6 stroke-current ${isNotInterested ? 'fill-current' : ''}`} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2 (SWAPPED): Date & Registration Deadline (2-Column Precision Split)
          Background extends edge-to-edge from top divider to bottom divider
          ========================================================================= */}
      <div className="px-2.5 py-2.5 bg-slate-100/60 border-y border-slate-100 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-2">
          {/* Event Date */}
          <div className="min-w-0">
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider truncate">
              Date :
            </span>
            <span className="text-[13px] font-black text-slate-900 block mt-0.5 tracking-tight leading-snug truncate" title={formattedEventDate}>
              {formattedEventDate}
            </span>
          </div>

          {/* Registration Deadline */}
          <div className="min-w-0">
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider truncate">
              Reg. Deadline :
            </span>
            <span className={`text-[13px] font-black block mt-0.5 tracking-tight leading-snug truncate ${
              isPast ? 'text-slate-400' : isUrgent ? 'text-rose-600' : 'text-slate-800'
            }`} title={registrationDeadline}>
              {registrationDeadline}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: Category & Mode Side-by-Side (Line 1), Domain (Line 2) | Explore on Right
          ========================================================================= */}
      <div className="px-2.5 py-2 bg-slate-50/30 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Category & Mode on Line 1, Domain on Line 2 */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Line 1: Category & Mode side-by-side */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              {getCategoryIcon(event.category)}
              <span>{event.category}</span>
            </span>

            {/* Repositioned Event Mode next to Category */}
            <span className={`event-mode-badge px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wide border shrink-0 ${getModeBadgeStyle(eventMode)}`}>
              {eventMode}
            </span>
          </div>

          {/* Line 2: Core Domain */}
          <div className="min-w-0">
            <span className="font-semibold text-blue-600 text-[11.5px] truncate block" title={event.domain}>
              {event.domain}
            </span>
          </div>
        </div>

        {/* Right: Explore Button (Compact pill, moved to bottom-most row) */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onExplore(event); }}
          className="h-8 px-2.5 sm:px-3 shrink-0 bg-slate-900 hover:bg-[#0070F3] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-sm active:scale-[0.98] group/btn"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(EventCard);
