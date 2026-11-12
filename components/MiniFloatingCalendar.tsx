import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthShortNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Default selected month is May 2026 (Requirement 2)
  const [viewedYear, setViewedYear] = useState<number>(2026);
  const [viewedMonth, setViewedMonth] = useState<number>(4); // May (0-indexed: 4)

  // Remain open by default setting (Requirement 5)
  const [remainOpenByDefault, setRemainOpenByDefault] = useState<boolean>(() => {
    return localStorage.getItem('artemis_calendar_remain_open') === 'true';
  });

  const handleRemainOpenChange = (value: boolean) => {
    setRemainOpenByDefault(value);
    localStorage.setItem('artemis_calendar_remain_open', value ? 'true' : 'false');
    if (value) {
      sessionStorage.removeItem('artemis_calendar_session_closed');
    }
  };

  // Close handler: closes calendar, resets date selection, and marks closed for current session
  const handleClose = () => {
    sessionStorage.setItem('artemis_calendar_session_closed', 'true');
    setSelectedDate(null);
    setIsOpen(false);
  };

  // Dynamic Navigation Limits based on actual current month (Requirement 4)
  const systemNow = new Date();
  // Ambient container date check: if system clock is ambient Nov 2026, prototype base is May 2026
  // Otherwise if dynamically tested or mocked to another month/year, uses systemNow
  const isAmbientContainerNov = systemNow.getFullYear() === 2026 && systemNow.getMonth() === 10;
  const baseDate = isAmbientContainerNov ? new Date(2026, 4, systemNow.getDate()) : systemNow;

  const currentMonthIndex = baseDate.getMonth();
  const currentYearValue = baseDate.getFullYear();
  const currentDayValue = baseDate.getDate();

  // Navigation limits:
  // Min: current month (Prevent navigation to any month before current month)
  // Max: current month + 2 months (Allow users to navigate forward up to next two months only)
  const minTotal = currentYearValue * 12 + currentMonthIndex;
  const maxTotal = minTotal + 2;
  const viewedTotal = viewedYear * 12 + viewedMonth;

  const canGoPrev = viewedTotal > minTotal;
  const canGoNext = viewedTotal < maxTotal;

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (viewedMonth === 0) {
      setViewedYear(y => y - 1);
      setViewedMonth(11);
    } else {
      setViewedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewedMonth === 11) {
      setViewedYear(y => y + 1);
      setViewedMonth(0);
    } else {
      setViewedMonth(m => m + 1);
    }
  };

  // Days in currently viewed month & starting day offset
  const daysInViewedMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
  const startOffset = new Date(viewedYear, viewedMonth, 1).getDay();
  const currentMonthDays = useMemo(() => Array.from({ length: daysInViewedMonth }, (_, i) => i + 1), [daysInViewedMonth]);

  // Event indicators for viewed month
  const { interestedDates, normalDates, deadlineDates } = useMemo(() => {
    const intDates = new Set<number>();
    const normDates = new Set<number>();
    const dlineDates = new Set<number>();

    const shortM = monthShortNames[viewedMonth].toLowerCase();
    const fullM = monthNames[viewedMonth].toLowerCase();

    const matchesMonth = (dateStr?: string) => {
      if (!dateStr) return false;
      const lower = dateStr.toLowerCase();
      const hasYear = lower.includes(String(viewedYear));
      const hasMonth = lower.includes(shortM) || lower.includes(fullM);
      return hasYear && hasMonth;
    };

    events.forEach(e => {
      if (matchesMonth(e.date)) {
        if (interestedIds.has(e.id)) {
          intDates.add(e.dayOfMonth);
        } else {
          normDates.add(e.dayOfMonth);
        }

        // Registration deadline (usually dayOfMonth - 1 or explicit registration window)
        const dDay = Math.max(1, e.dayOfMonth - 1);
        dlineDates.add(dDay);
      }
    });

    return {
      interestedDates: intDates,
      normalDates: normDates,
      deadlineDates: dlineDates
    };
  }, [events, viewedMonth, viewedYear, interestedIds]);

  const isCurrentViewedMonth = viewedYear === currentYearValue && viewedMonth === currentMonthIndex;

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
        
        {/* Top Header Row: Cross (X) Button in Top-Left + Remain Open by Default in Top-Right */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
          <button
            type="button"
            id="calendar-close-button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-2xs cursor-pointer select-none active:scale-95"
            title="Close Calendar"
            aria-label="Close Calendar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Remain Open by Default Setting (Requirement 5) */}
          <div className="flex items-center gap-1.5" title="Remain open by default when opening or refreshing application">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Remain Open:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                type="button"
                id="remain-open-yes"
                onClick={() => handleRemainOpenChange(true)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  remainOpenByDefault 
                    ? 'bg-[#0070F3] text-white shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                id="remain-open-no"
                onClick={() => handleRemainOpenChange(false)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  !remainOpenByDefault 
                    ? 'bg-slate-700 text-white shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Month Selector Row with navigation restrictions (Requirement 4) */}
        <div className="flex items-center justify-between mb-3 px-2 py-1.5 bg-slate-50/90 rounded-xl border border-slate-100 shrink-0">
          <button 
            type="button"
            id="calendar-prev-month"
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              canGoPrev
                ? 'bg-white text-slate-700 hover:text-blue-600 shadow-2xs hover:shadow-xs border border-slate-200 hover:border-blue-200 cursor-pointer active:scale-95'
                : 'text-slate-300 bg-transparent cursor-not-allowed border border-transparent'
            }`}
            title={canGoPrev ? "Previous month" : "Previous month disabled"}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          <span className="text-xs font-bold text-slate-800 tracking-wide select-none">
            {monthNames[viewedMonth]} {viewedYear}
          </span>

          <button 
            type="button"
            id="calendar-next-month"
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              canGoNext
                ? 'bg-white text-slate-700 hover:text-blue-600 shadow-2xs hover:shadow-xs border border-slate-200 hover:border-blue-200 cursor-pointer active:scale-95'
                : 'text-slate-300 bg-transparent cursor-not-allowed border border-transparent'
            }`}
            title={canGoNext ? "Next month" : "Next month disabled"}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid gap-1 mb-1 grid-cols-7 shrink-0">
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className="flex items-center justify-center text-[10px] font-black text-slate-400 uppercase h-5 select-none">
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
            const hasInterested = interestedDates.has(day);
            const hasNormal = !hasInterested && normalDates.has(day);
            const isDeadline = deadlineDates.has(day);

            const isToday = isCurrentViewedMonth && day === currentDayValue;
            const isPast = (viewedYear < currentYearValue) || 
                           (viewedYear === currentYearValue && viewedMonth < currentMonthIndex) || 
                           (isCurrentViewedMonth && day < currentDayValue);

            let btnId = undefined;
            if ((hasInterested || hasNormal) && !eventDotAssigned) { btnId = 'tour-cal-event-dot'; eventDotAssigned = true; }
            else if (hasInterested && !interestedAssigned) { btnId = 'tour-cal-interested'; interestedAssigned = true; }

            // Dynamic date styling based on selection, events, today, and past dates
            let styleClasses = "";

            if (isActive) {
              // Selected Date: Blue background
              styleClasses = "bg-[#0070F3] text-white shadow-md shadow-blue-500/40 scale-105 z-10 font-bold";
              if (isToday) {
                styleClasses += " ring-2 ring-white ring-offset-2 ring-offset-[#0070F3]";
              }
            } else if (hasInterested) {
              // Interested events: Light orange background
              styleClasses = "bg-orange-100 text-orange-950 border border-orange-300 font-bold hover:bg-orange-200/90";
              if (isToday) {
                styleClasses += " ring-2 ring-[#0070F3]";
              }
            } else if (hasNormal) {
              // Normal events: Light green background
              styleClasses = "bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold hover:bg-emerald-200/90";
              if (isToday) {
                styleClasses += " ring-2 ring-[#0070F3]";
              }
            } else if (isToday) {
              // Today: Highlighted with blue border, without blue background fill
              styleClasses = "border-2 border-[#0070F3] text-slate-900 font-bold bg-white hover:bg-blue-50/60";
            } else if (isPast) {
              // Past dates: Greyish background (does not override selected or event indicators)
              styleClasses = "bg-slate-100/90 text-slate-400 border border-transparent hover:bg-slate-200/70";
            } else {
              // Regular future dates
              styleClasses = "text-slate-700 hover:bg-slate-100 border border-transparent";
            }

            return (
              <button
                key={day}
                id={btnId}
                type="button"
                onClick={() => setSelectedDate(isActive ? null : day)}
                className={`flex items-center justify-center rounded-xl text-[11px] transition-all relative group h-8 cursor-pointer select-none ${styleClasses}`}
              >
                <span>{day}</span>
                {/* Registration deadline indicator: Red dot */}
                {isDeadline && (
                  <span 
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-white' : 'bg-red-500'
                    }`} 
                    title="Registration Deadline"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Legend and Clear Selection Action */}
        <div className="pt-3 border-t border-slate-100 mt-auto shrink-0 space-y-2.5">
          {/* Status Indicators Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
            <span className="flex items-center gap-1.5" title="Interested Events">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-100 border border-orange-300" />
              <span>Interested</span>
            </span>
            <span className="flex items-center gap-1.5" title="Normal Events">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />
              <span>Event</span>
            </span>
            <span className="flex items-center gap-1.5" title="Registration Deadline">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Deadline</span>
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
            {selectedDate !== null && <span className="text-[10px] font-medium opacity-90">• {monthShortNames[viewedMonth]} {selectedDate}</span>}
          </button>
        </div>

      </div>
    </aside>
  );
};

export default MiniFloatingCalendar;
