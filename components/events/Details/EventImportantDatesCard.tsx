import React from 'react';
import { CalendarDays, Clock, Timer } from 'lucide-react';
import { CampusEvent } from '../types';
import {
  formatIsoDate,
  getRegistrationDeadline,
  getUnifiedEventDate,
  getUnifiedEventTime,
  hasValue,
} from './eventDetailsUtils';

interface EventImportantDatesCardProps {
  event: CampusEvent;
  isPast: boolean;
}

const EventImportantDatesCard: React.FC<EventImportantDatesCardProps> = ({ event, isPast }) => {
  const registrationDeadline = getRegistrationDeadline(event, isPast);
  const regStart = formatIsoDate(event.registrationStart);
  const endDate = formatIsoDate(event.eventEndDate);
  const showEndDate = endDate && endDate !== formatIsoDate(event.eventDate);

  return (
    <section className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-4">
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.16em] border-b border-slate-100 pb-3 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-blue-600" /> Important Dates
      </h2>
      <div className="space-y-3.5">
        {regStart && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Registration Opens
            </span>
            <span className="text-sm font-bold text-slate-800">{regStart}</span>
          </div>
        )}

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Registration Deadline
          </span>
          <span className={`text-xs font-bold rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 mt-0.5 border ${
            isPast
              ? 'bg-slate-100 text-slate-500 border-slate-200'
              : 'bg-rose-50 text-rose-700 border-rose-200/70'
          }`}>
            <Timer className="w-3.5 h-3.5 shrink-0" />
            {registrationDeadline}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Event Date
          </span>
          <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
            {getUnifiedEventDate(event)}{showEndDate ? ` – ${endDate}` : ''}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Time
          </span>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
            {getUnifiedEventTime(event, isPast)}
            {!isPast && hasValue(event.timezone) ? ` (${event.timezone})` : ''}
          </span>
        </div>

        {hasValue(event.duration) && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Duration
            </span>
            <span className="text-sm font-bold text-slate-800">{event.duration}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventImportantDatesCard;

