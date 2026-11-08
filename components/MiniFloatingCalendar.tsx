import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { CampusEvent } from './events/types';

interface MiniFloatingCalendarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedDate: number | null;
  setSelectedDate: (date: number | null) => void;
  events: CampusEvent[];
  interestedIds: Set<string>;
  registeredIds: Set<string>;
}

export const MiniFloatingCalendar: React.FC<MiniFloatingCalendarProps> = ({ 
  isOpen, 
  setIsOpen, 
  selectedDate, 
  setSelectedDate,
  events,
  interestedIds,
  registeredIds
}) => {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const currentMonthDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const startOffset = 5; // May 2026 starts on Friday
  const [robotMessage, setRobotMessage] = useState("Planning? You? That's hilarious!");

  const eventDates = useMemo(() => {
    const dates = new Set<number>();
    events.forEach(e => {
      if (e.date.includes('May 2026')) {
        dates.add(e.dayOfMonth);
      }
    });
    return dates;
  }, [events]);

  const registeredDates = useMemo(() => {
    const dates = new Set<number>();
    events.forEach(e => {
      if (e.date.includes('May 2026') && registeredIds.has(e.id)) {
        dates.add(e.dayOfMonth);
      }
    });
    return dates;
  }, [events, registeredIds]);

  const interestedDates = useMemo(() => {
    const dates = new Set<number>();
    events.forEach(e => {
      if (e.date.includes('May 2026') && interestedIds.has(e.id) && !registeredIds.has(e.id)) {
        dates.add(e.dayOfMonth);
      }
    });
    return dates;
  }, [events, interestedIds, registeredIds]);

  const mockingMessages = [
    "Trying to organize your chaos? Cute.",
    "Look who's pretending to be productive!",
    "I give this schedule 2 days, max.",
    "A date? For what, procrastination?",
    "Wow, such ambition. Much wow.",
    "Clicking dates won't finish your tasks.",
    "Error 404: Motivation not found."
  ];

  useEffect(() => {
    if (isOpen) {
      const randomMsg = mockingMessages[Math.floor(Math.random() * mockingMessages.length)];
      setRobotMessage(randomMsg);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  let eventDotAssigned = false;
  let interestedAssigned = false;
  let registeredAssigned = false;

  return (
    <aside 
      id="events-calendar-panel"
      className="w-[340px] shrink-0 h-full border-l border-slate-200/90 bg-white flex flex-col justify-between overflow-hidden relative z-20 shadow-xs"
    >
      {/* Decorative Subtle Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50/70 to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 h-full flex flex-col justify-between relative z-10 overflow-y-auto no-scrollbar">
        
        {/* Top Header Row: Back Button in Top-Left Corner + Month Badge in Top-Right */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
          <button
            type="button"
            id="calendar-back-button"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none active:scale-[0.98]"
            title="Back to normal Events view"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </button>

          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shadow-2xs">
            May 2026
          </span>
        </div>

        {/* Subheader: Selection Mode & Mocking Robot */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
              Selection Mode <span className="text-sm animate-pulse">⚡️</span>
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Filter events by date</p>
          </div>

          {/* Mocking Robot */}
          <div className="relative group cursor-help">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-xs border border-blue-100 transform hover:rotate-6 transition-all hover:scale-105 relative overflow-hidden group-hover:border-blue-300">
              <Bot className="w-5 h-5 text-blue-600 relative z-10" />
            </div>

            {/* Tooltip speech bubble */}
            <div className="absolute right-full mr-3 top-0 w-44 bg-slate-900 text-white text-[10px] p-3 rounded-2xl rounded-tr-none shadow-xl transform transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 pointer-events-none border border-slate-700 z-50">
              <p className="font-medium leading-relaxed">"{robotMessage}"</p>
              <div className="absolute top-0 -right-2 w-0 h-0 border-t-[8px] border-t-slate-900 border-r-[8px] border-r-transparent" />
            </div>
          </div>
        </div>

        {/* Month Selector Row */}
        <div className="flex items-center justify-between mb-3 px-1 bg-slate-50/90 p-1.5 rounded-xl border border-slate-100 shrink-0">
          <button 
            type="button"
            className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-2xs hover:shadow-xs border border-transparent hover:border-blue-100 cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Select Day</span>
          <button 
            type="button"
            className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-2xs hover:shadow-xs border border-transparent hover:border-blue-100 cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid gap-1 mb-1 grid-cols-7 shrink-0">
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className="flex items-center justify-center text-[10px] font-black text-slate-300 uppercase h-5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid gap-1.5 mb-3 grid-cols-7 flex-1" id="tour-mini-calendar">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`off-${i}`} className="h-8" />
          ))}
          {currentMonthDays.map(day => {
            const isActive = selectedDate === day;
            const hasEvent = eventDates.has(day);
            const isRegistered = registeredDates.has(day);
            const isInterested = interestedDates.has(day);

            let btnId = undefined;
            if (hasEvent && !eventDotAssigned) { btnId = 'tour-cal-event-dot'; eventDotAssigned = true; }
            else if (isRegistered && !registeredAssigned) { btnId = 'tour-cal-registered'; registeredAssigned = true; }
            else if (isInterested && !interestedAssigned) { btnId = 'tour-cal-interested'; interestedAssigned = true; }

            return (
              <button
                key={day}
                id={btnId}
                type="button"
                onClick={() => setSelectedDate(isActive ? null : day)}
                className={`flex items-center justify-center rounded-xl text-[11px] font-bold transition-all relative group h-8 cursor-pointer select-none ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 scale-105 z-10 ring-2 ring-white' 
                    : isRegistered
                      ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 shadow-2xs'
                      : isInterested
                        ? 'text-emerald-600 ring-2 ring-emerald-500 ring-offset-1'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 hover:shadow-2xs hover:z-10'
                }`}
              >
                {day}
                {hasEvent && (
                  <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-rose-500 animate-pulse'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Legend and Clear Selection Action */}
        <div className="pt-3 border-t border-slate-100 mt-auto shrink-0 space-y-2.5">
          {/* Status Indicators Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Event</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-500" />
              <span>Registered</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-emerald-500" />
              <span>Interested</span>
            </span>
          </div>

          {/* Clear Selection Button */}
          <button 
            type="button"
            onClick={() => setSelectedDate(null)}
            disabled={selectedDate === null}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center justify-center gap-1.5 ${
              selectedDate !== null
                ? 'bg-[#0070F3] hover:bg-blue-600 active:bg-blue-700 text-white cursor-pointer active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <span>Clear Selection</span>
            {selectedDate !== null && <span className="text-[10px] font-medium opacity-90">• May {selectedDate}</span>}
          </button>
        </div>

      </div>
    </aside>
  );
};

export default MiniFloatingCalendar;
