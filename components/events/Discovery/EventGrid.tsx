import React, { useMemo } from 'react';
import { CampusEvent } from '../types';
import EventCard from './EventCard';
import { parseDateTime } from '../utils';

interface EventGridProps {
  events: CampusEvent[];
  title: string;
  Icon: any;
  colorClass: string;
  id?: string;
  interestedIds: Set<string>;
  notInterestedIds: Set<string>;
  registeredIds: Set<string>;
  toggleInterested: (id: string) => void;
  markNotInterested: (id: string) => void;
  todayDay: number;
  now: Date;
  onExplore: (event: CampusEvent) => void;
  isCalendarOpen?: boolean;
}

const EventGrid: React.FC<EventGridProps> = ({
  events,
  title,
  Icon,
  colorClass,
  id,
  interestedIds,
  notInterestedIds,
  registeredIds,
  toggleInterested,
  markNotInterested,
  todayDay,
  now,
  onExplore,
  isCalendarOpen = false
}) => {
  // Memoize card derivations at the top level — not inside JSX
  const cards = useMemo(() => events.map(event => {
    const isInterested = interestedIds.has(event.id);
    const isNotInterested = notInterestedIds.has(event.id);
    const isRegistered = registeredIds.has(event.id);
    let isPast = event.dayOfMonth < todayDay;

    const eventDate = parseDateTime(event.date, event.time);
    let timeString = null;
    let isUrgent = false;

    if (eventDate) {
      const diff = eventDate.getTime() - now.getTime();
      const absDiff = Math.abs(diff);
      const isToday = eventDate.toDateString() === now.toDateString();

      if (diff > 0) {
        if (isToday) {
          timeString = title === "Closing Soon" ? "Ends today" : "Starting today";
          isUrgent = true;
        } else if (diff < (24 * 60 * 60 * 1000)) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          timeString = `${hours}h ${mins}m left`;
          isUrgent = true;
        } else if (title === "Closing Soon") {
          const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
          timeString = `${days} days left`;
          isUrgent = diff < (48 * 60 * 60 * 1000);
        } else {
          const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
          timeString = `Starts in ${days} days`;
          isUrgent = false;
        }
      } else {
        isPast = true;
        if (isToday) {
          timeString = "Ended today";
        } else {
          const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
          timeString = days > 0 ? `Ended ${days} days ago` : `Ended ${Math.floor(absDiff / (1000 * 60 * 60))} hours ago`;
        }
        isUrgent = false;
      }
    } else {
      timeString = isPast ? "Event ended" : "Date pending";
      isUrgent = false;
    }

    return { event, isInterested, isNotInterested, isRegistered, isPast, isUrgent, timeString };
  }), [events, interestedIds, notInterestedIds, registeredIds, now, todayDay, title]);

  if (events.length === 0) return null;

  return (
    <div className="space-y-5">
      <div id={id} className="scroll-mt-24 flex items-center justify-between px-0">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{events.length} results</span>
      </div>
      <div className={`grid grid-cols-1 ${isCalendarOpen ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4 w-full`}>
        {cards.map(({ event, isInterested, isNotInterested, isRegistered, isPast, isUrgent, timeString }) => (
          <div
            key={`${title}-${event.id}`}
            className="h-[195px]"
            style={{
              contentVisibility: 'auto',
              containIntrinsicSize: '1px 195px'
            } as React.CSSProperties}
          >
            <EventCard
              event={event}
              isInterested={isInterested}
              isRegistered={isRegistered}
              isNotInterested={isNotInterested}
              isPast={isPast}
              isUrgent={isUrgent}
              timeString={timeString}
              onExplore={onExplore}
              toggleInterested={toggleInterested}
              markNotInterested={markNotInterested}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(EventGrid);
