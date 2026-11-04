import React from 'react';
import { Flame, Clock, History, SearchX, Sparkles } from 'lucide-react';
import { CampusEvent } from '../types';
import EventGrid from './EventGrid';

interface EventsDiscoveryProps {
  showTeamsView: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeFilter: string;
  setActiveFilter: (val: string) => void;
  activeNav: string;
  setActiveNav: (val: string) => void;
  selectedStatuses?: string[];
  onClearAllFilters?: () => void;
  closingSoonEvents: CampusEvent[];
  upcomingEvents: CampusEvent[];
  pastEvents: CampusEvent[];
  interestedIds: Set<string>;
  notInterestedIds: Set<string>;
  registeredIds: Set<string>;
  toggleInterested: (id: string) => void;
  markNotInterested: (id: string) => void;
  todayDay: number;
  now: Date;
  onExplore: (event: CampusEvent) => void;
}

const EventsDiscovery: React.FC<EventsDiscoveryProps> = (props) => {
  const {
    showTeamsView,
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    activeNav, setActiveNav,
    selectedStatuses = [],
    onClearAllFilters,
    closingSoonEvents, upcomingEvents, pastEvents,
    interestedIds, notInterestedIds, registeredIds,
    toggleInterested, markNotInterested,
    todayDay, now,
    onExplore
  } = props;

  const showClosing = selectedStatuses.length === 0 || selectedStatuses.includes('tour-closing');
  const showUpcoming = selectedStatuses.length === 0 || selectedStatuses.includes('tour-upcoming');
  const showPast = selectedStatuses.length === 0 || selectedStatuses.includes('tour-past');

  const visibleClosingCount = showClosing ? closingSoonEvents.length : 0;
  const visibleUpcomingCount = showUpcoming ? upcomingEvents.length : 0;
  const visiblePastCount = showPast ? pastEvents.length : 0;
  const totalResults = visibleClosingCount + visibleUpcomingCount + visiblePastCount;

  const hasClosing = showClosing && closingSoonEvents.length > 0;
  const hasUpcoming = showUpcoming && upcomingEvents.length > 0;
  const hasPast = showPast && pastEvents.length > 0;

  if (showTeamsView) return null;

  return (
    <div className="space-y-12 px-8 pb-32">

      {totalResults === 0 ? (
        <div className="flex flex-col items-center justify-center pt-16 pb-40 text-center animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 bg-white rounded-[32px] shadow-xl flex items-center justify-center border border-slate-100">
               <SearchX className="w-10 h-10 text-slate-300" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No Results Found</h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium leading-relaxed">
            We couldn't find any events matching your current search or filters. Try adjusting them to explore more!
          </p>
          
          <button 
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('All');
              onClearAllFilters?.();
            }}
            className="mt-10 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black hover:shadow-xl transition-all active:scale-95"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {hasClosing && (
            <EventGrid 
              id="section-closing"
              title="Closing Soon"
              Icon={Flame}
              colorClass="bg-rose-500"
              events={closingSoonEvents}
              interestedIds={interestedIds}
              notInterestedIds={notInterestedIds}
              registeredIds={registeredIds}
              toggleInterested={toggleInterested}
              markNotInterested={markNotInterested}
              todayDay={todayDay}
              now={now}
              onExplore={onExplore}
            />
          )}

          {hasClosing && (hasUpcoming || hasPast) && (
            <div className="border-b border-slate-100" />
          )}

          {hasUpcoming && (
            <EventGrid 
              id="section-upcoming"
              title="Upcoming"
              Icon={Clock}
              colorClass="bg-blue-600"
              events={upcomingEvents}
              interestedIds={interestedIds}
              notInterestedIds={notInterestedIds}
              registeredIds={registeredIds}
              toggleInterested={toggleInterested}
              markNotInterested={markNotInterested}
              todayDay={todayDay}
              now={now}
              onExplore={onExplore}
            />
          )}

          {hasUpcoming && hasPast && (
            <div className="border-b border-slate-100" />
          )}

          {hasPast && (
            <EventGrid 
              id="section-past"
              title="Past Due"
              Icon={History}
              colorClass="bg-slate-400"
              events={pastEvents}
              interestedIds={interestedIds}
              notInterestedIds={notInterestedIds}
              registeredIds={registeredIds}
              toggleInterested={toggleInterested}
              markNotInterested={markNotInterested}
              todayDay={todayDay}
              now={now}
              onExplore={onExplore}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EventsDiscovery;
