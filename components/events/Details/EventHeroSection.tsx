import React from 'react';
import {
  CalendarDays, MapPin, History, UserPlus, ArrowRight,
  Heart, ThumbsDown, CheckCircle2, Timer, BadgeCheck, ExternalLink
} from 'lucide-react';
import { CampusEvent } from '../types';
import ImageWithFallback from '../ImageWithFallback';
import {
  getEventMode,
  getRegistrationDeadline,
  getUnifiedEventDate,
  getUnifiedEventTime,
  hasValue,
} from './eventDetailsUtils';

interface EventHeroSectionProps {
  event: CampusEvent;
  isPast: boolean;
  isRegistered: boolean;
  isInterested: boolean;
  isNotInterested: boolean;
  officialUrl: string | null;
  conductingAgency: string | null;
  onRegisterAction: () => void;
  toggleInterested: (id: string) => void;
  markNotInterested: (id: string) => void;
}

const EventHeroSection: React.FC<EventHeroSectionProps> = ({
  event,
  isPast,
  isRegistered,
  isInterested,
  isNotInterested,
  officialUrl,
  conductingAgency,
  onRegisterAction,
  toggleInterested,
  markNotInterested,
}) => {
  const eventMode = getEventMode(event);
  const registrationDeadline = getRegistrationDeadline(event, isPast);

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="relative h-48 sm:h-60 bg-slate-900">
        <ImageWithFallback
          src={event.posterUrl}
          alt={event.title}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/25 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/95 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
              {event.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/95 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
              {eventMode}
            </span>
            {event.type === 'Live' && (
              <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm animate-pulse">
                Live Now
              </span>
            )}
            {hasValue(event.domain) && (
              <span className="px-3 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/15">
                {event.domain}
              </span>
            )}
          </div>

          {event.certification && (
            <span className="px-3 py-1 rounded-full bg-blue-500/95 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm">
              <BadgeCheck className="w-3.5 h-3.5" /> Certificate
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
          {conductingAgency && (
            <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
              {conductingAgency}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Outside Event Card Info Strip */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{event.location || 'Location TBA'}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{getUnifiedEventDate(event)} · {getUnifiedEventTime(event, isPast)}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            isPast
              ? 'bg-slate-50 border-slate-200/70 text-slate-500'
              : 'bg-rose-50/70 border-rose-200/70 text-rose-700'
          }`}>
            <Timer className={`w-4 h-4 shrink-0 ${isPast ? 'text-slate-400' : 'text-rose-600'}`} />
            <span>Reg. Deadline: {registrationDeadline}</span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <button
            id="tour-event-register"
            onClick={onRegisterAction}
            disabled={isPast}
            className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2.5 ${
              isPast
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : isRegistered
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-slate-900 text-white hover:bg-black shadow-sm'
            }`}
          >
            {isPast ? (
              <><History className="w-4 h-4" /> Event Concluded</>
            ) : isRegistered ? (
              <><UserPlus className="w-4 h-4" /> Invite Peers</>
            ) : officialUrl ? (
              <>Register Now <ExternalLink className="w-4 h-4" /></>
            ) : (
              <>Register Now <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <div className="flex gap-2.5">
            <button
              onClick={() => toggleInterested(event.id)}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                isInterested
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-500'
              }`}
              title="Interested"
            >
              <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
              <span>Interested</span>
            </button>

            <button
              onClick={() => markNotInterested(event.id)}
              className={`px-3.5 py-3 rounded-xl border font-bold transition-all flex items-center justify-center ${
                isNotInterested
                  ? 'border-slate-300 bg-slate-100 text-slate-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
              title="Not Interested"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isRegistered && !isPast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/70 rounded-xl flex items-center text-emerald-700 font-semibold text-xs gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>You are registered for this event.</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventHeroSection;

