
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar as CalendarIcon,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Clock,
  Users2,
  Trophy
} from 'lucide-react';
import { EVENTS_MOCK, CampusEvent } from './EventsPage';

const LEGENDS = [
  { label: 'Competition / Hackathon', color: 'bg-blue-500', category: 'Competition' },
  { label: 'Workshop / Seminar', color: 'bg-emerald-500', category: 'Workshop' }, // Grouped Workshop & Seminar
  { label: 'Fest / Culture', color: 'bg-orange-500', category: 'Fest' },
  { label: 'Seminar', color: 'bg-sky-400', category: 'Seminar' }
];

const TODAY_DAY = new Date().getDate();
const TODAY_MONTH = 0; // January for mock purposes as most events are Jan/Feb
const TODAY_YEAR = 2026;

// Helper to parse date string like "15 Feb 2026" into parts
const parseDate = (dateStr: string) => {
  const [day, monthStr, yearStr] = dateStr.split(' ');
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  return {
    day: parseInt(day),
    month: monthMap[monthStr] || 0,
    year: parseInt(yearStr)
  };
};

interface FullCalendarPageProps {
  events?: CampusEvent[];
}

export const FullCalendarPage: React.FC<FullCalendarPageProps> = ({ events }) => {
  const sourceEvents = events && events.length > 0 ? events : EVENTS_MOCK;
  const [currentMonth, setCurrentMonth] = useState(4); 
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filter and Process Events for Calendar
  const calendarEvents = useMemo(() => {
    return sourceEvents.map(e => {
       const parsed = parseDate(e.date);
       return {
         ...e,
         parsedDate: parsed
       };
    }).filter(e => {
       const matchesFilter = filter === 'All' || e.category === filter;
       const matchesMonth = e.parsedDate.month === currentMonth;
       const matchesYear = e.parsedDate.year === currentYear;
       return matchesFilter && matchesMonth && matchesYear;
    });
  }, [filter, currentMonth, currentYear]);
  
  const selectedDateEvents = selectedDate 
    ? calendarEvents.filter(e => e.parsedDate.day === selectedDate) 
    : [];

  const selectedEvent = selectedEventId 
    ? sourceEvents.find(e => e.id === selectedEventId)
    : null;

  const getEventColor = (category: string) => {
    switch (category) {
      case 'Competition': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
      case 'Workshop': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      case 'Seminar': return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]';
      case 'Fest': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
      default: return 'bg-slate-500';
    }
  };

  const getEventBadgeStyle = (category: string) => {
    switch (category) {
      case 'Competition': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'Workshop': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'Seminar': return 'text-sky-500 border-sky-400/20 bg-sky-400/10';
      case 'Fest': return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

  return (
    <div className="h-full flex flex-col gap-4    overflow-hidden bg-transparent">
      {/* Event Artemis Branding Header */}
      <div className="px-4 pt-4 flex items-center gap-3 shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-[18px] font-black text-white">⚡</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Event Artemis</h1>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Tight Header - Dark Theme */}
      <div className="flex items-center justify-between bg-[#09090b] px-5 py-3 rounded-2xl border border-white/10 shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/5">
            <button onClick={() => setCurrentMonth(m => (m === 0 ? 11 : m - 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-4 text-xs font-black uppercase tracking-widest text-slate-200 min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button onClick={() => setCurrentMonth(m => (m === 11 ? 0 : m + 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-1">
            {['All', 'Competition', 'Workshop', 'Fest'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${filter === cat ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Legend Strip */}
          <div className="hidden xl:flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
            {LEGENDS.map((leg) => (
              <div key={leg.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${leg.color} shadow-[0_0_10px_currentColor]`} />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{leg.label}</span>
              </div>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[9px] font-black rounded-lg hover:bg-slate-200 uppercase tracking-widest shadow-lg shadow-white/10">
            <Sparkles className="w-3.5 h-3.5" /> Synchronize
          </button>
        </div>
      </div>

      {/* Adaptive Layout - Dark Theme */}
      <div className={`flex-1 flex gap-4 min-h-0 transition-all  ${
        isExpanded ? 'flex-col' : ''
      }`}>
        <div className={`bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl flex flex-col transition-all  ease-in-out overflow-hidden ${
          isExpanded 
            ? 'w-full h-[600px]' 
            : selectedDate 
              ? 'flex-[0.7]' 
              : 'flex-1'
        }`}>
          <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
            {daysOfWeek.map(day => (
              <div key={day} className="py-3 text-center">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{day}</span>
              </div>
            ))}
          </div>
          
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`off-${i}`} className="border-r border-b border-white/5 bg-white/[0.02] last:border-r-0" />
            ))}
            
            {monthDays.map(day => {
              const isActive = selectedDate === day;
              const isToday = day === TODAY_DAY && currentMonth === TODAY_MONTH;
              const eventsOnDay = calendarEvents.filter(e => e.parsedDate.day === day);
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isActive ? null : day)}
                  className={`relative group flex flex-col items-center justify-center border-r border-b border-white/5 last:border-r-0 hover:bg-white/5 transition-all ${
                    isActive ? 'bg-blue-900/20' : ''
                  }`}
                >
                  {isToday && (
                    <div className="absolute inset-2 border border-rose-500/50 rounded-2xl pointer-events-none z-0 shadow-[0_0_15px_rgba(244,63,94,0.2)]" />
                  )}
                  <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all relative z-10 ${
                    isActive ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-110' : 
                    isToday ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400 group-hover:text-white'
                  }`}>
                    {day}
                  </div>
                  <div className="flex gap-1 mt-2 h-1.5 relative z-10">
                    {eventsOnDay.slice(0, 3).map(e => (
                      <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e.category)}`} title={e.category} />
                    ))}
                    {eventsOnDay.length > 3 && (
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-600" title="More..." />
                    )}
                  </div>
                </button>
              );
            })}
            {Array.from({ length: 42 - (daysInMonth + firstDayOfMonth) }).map((_, i) => (
              <div key={`fill-${i}`} className="border-r border-b border-white/5 bg-white/[0.02] last:border-r-0" />
            ))}
          </div>
        </div>

        {selectedDate && !isExpanded && (
          <div className="flex-[0.3] bg-[#000000] border border-white/10 text-white rounded-3xl p-6 flex flex-col shadow-2xl    relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8 shrink-0 relative z-10">
              <div>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Day Observer</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight text-white">{selectedDate} {monthNames[currentMonth]}</h3>
              </div>
              <button onClick={() => setSelectedDate(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar relative z-10">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full text-left bg-[#111] p-4 rounded-2xl border transition-all group hover:bg-[#161616] ${
                      selectedEventId === event.id 
                        ? 'border-blue-500/50 bg-[#1a1a2e] shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        : 'border-white/10 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                       <span className={`text-[8px] font-black uppercase border px-2 py-0.5 rounded-lg tracking-widest ${getEventBadgeStyle(event.category)}`}>
                         {event.category}
                       </span>
                       <span className="text-[9px] font-bold text-slate-500">{event.time}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-200 mb-2 group-hover:text-white transition-colors leading-snug">{event.title}</h4>
                    <div className="flex items-center text-[10px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> {event.location}
                    </div>
                  </button>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                   <Info className="w-10 h-10 mb-4 text-white" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-white">No Events</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Centered Calendar View */}
      {isExpanded && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[900] bg-[#09090b] flex flex-col overflow-hidden">
          {/* Expanded Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-sky-500/10 px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-white">⚡</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Event Artemis Calendar</h2>
              </div>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Expanded Content - Centered Layout */}
          <div className="flex-1 flex gap-6 overflow-hidden px-6 py-6 justify-center">
            {/* Centered Calendar Grid */}
            <div className="w-[700px] bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden shrink-0">
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between bg-white/5 px-6 py-4 border-b border-white/5 shrink-0">
                <button onClick={() => setCurrentMonth(m => (m === 0 ? 11 : m - 1))} className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-black uppercase tracking-widest text-slate-200">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button onClick={() => setCurrentMonth(m => (m === 11 ? 0 : m + 1))} className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
                {daysOfWeek.map(day => (
                  <div key={day} className="py-4 text-center">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{day}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`off-${i}`} className="border-r border-b border-white/5 bg-white/[0.02] last:border-r-0" />
                ))}
                
                {monthDays.map(day => {
                  const isActive = selectedDate === day;
                  const isToday = day === TODAY_DAY && currentMonth === TODAY_MONTH;
                  const eventsOnDay = calendarEvents.filter(e => e.parsedDate.day === day);
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(isActive ? null : day)}
                      className={`relative group flex flex-col items-center justify-center border-r border-b border-white/5 last:border-r-0 hover:bg-white/5 transition-all p-3 ${
                        isActive ? 'bg-blue-900/20' : ''
                      }`}
                    >
                      {isToday && (
                        <div className="absolute inset-2 border-2 border-rose-500/50 rounded-xl pointer-events-none z-0 shadow-[0_0_15px_rgba(244,63,94,0.2)]" />
                      )}
                      <div className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all relative z-10 ${
                        isActive ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-110' : 
                        isToday ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400 group-hover:text-white'
                      }`}>
                        {day}
                      </div>
                      <div className="flex gap-1.5 mt-2 h-2 relative z-10">
                        {eventsOnDay.slice(0, 4).map(e => (
                          <div key={e.id} className={`w-2 h-2 rounded-full ${getEventColor(e.category)}`} title={e.category} />
                        ))}
                        {eventsOnDay.length > 4 && (
                           <div className="w-2 h-2 rounded-full bg-slate-600" title="More..." />
                        )}
                      </div>
                    </button>
                  );
                })}
                
                {Array.from({ length: 42 - (daysInMonth + firstDayOfMonth) }).map((_, i) => (
                  <div key={`fill-${i}`} className="border-r border-b border-white/5 bg-white/[0.02] last:border-r-0" />
                ))}
              </div>
            </div>

            {/* Right-Side Events Panel */}
            <div className="w-80 bg-[#0a0a0b] border border-white/10 text-white rounded-2xl p-5 flex flex-col shadow-2xl overflow-hidden shrink-0">
              {/* Panel Header */}
              <div className="mb-5 pb-4 border-b border-white/5 shrink-0">
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">Upcoming Events</p>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {calendarEvents.length} Event{calendarEvents.length !== 1 ? 's' : ''} in {monthNames[currentMonth]}
                </h3>
              </div>

              {/* Events Grouped by Date */}
              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar relative z-10">
                {calendarEvents.length > 0 ? (
                  (() => {
                    // Group events by date
                    const eventsByDate: Record<number, typeof calendarEvents> = {};
                    calendarEvents.forEach(event => {
                      const day = event.parsedDate.day;
                      if (!eventsByDate[day]) eventsByDate[day] = [];
                      eventsByDate[day].push(event);
                    });

                    // Sort dates and render
                    return Object.keys(eventsByDate)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(dayStr => {
                        const day = parseInt(dayStr);
                        const events = eventsByDate[day];
                        const isSelected = selectedDate === day;
                        
                        return (
                          <div key={day} className={`border border-white/10 rounded-xl p-4 transition-all ${
                            isSelected ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#111] hover:bg-[#161616] hover:border-white/20'
                          }`}>
                            {/* Date Header */}
                            <button
                              onClick={() => setSelectedDate(isSelected ? null : day)}
                              className="w-full text-left mb-3 pb-3 border-b border-white/10 group"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">
                                    {new Date(2026, currentMonth, day).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </p>
                                  <h4 className="text-sm font-black text-white mt-1 group-hover:text-blue-300 transition-colors">
                                    {day} {monthNames[currentMonth]}
                                  </h4>
                                </div>
                                <div className="flex gap-1.5 h-2">
                                  {events.slice(0, 3).map((e, idx) => (
                                    <div key={idx} className={`w-2 h-2 rounded-full ${getEventColor(e.category)}`} />
                                  ))}
                                </div>
                              </div>
                            </button>

                            {/* Events List for this Date */}
                            <div className="space-y-2">
                              {events.map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEventId(event.id)}
                                  className={`w-full text-left p-2.5 rounded-lg border transition-all group text-[12px] ${
                                    selectedEventId === event.id
                                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-100'
                                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-blue-500/30 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getEventBadgeStyle(event.category)}`}>
                                      {event.category}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-400">{event.time}</span>
                                  </div>
                                  <p className="font-bold group-hover:text-blue-200 transition-colors line-clamp-2">{event.title}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      });
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-8">
                    <Info className="w-10 h-10 mb-3 text-slate-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                      No Events<br/>This Month
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Event Detail Modal */}
      {selectedEventId && selectedEvent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm   ">
          <div className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl  -95  relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedEventId(null)}
              className="absolute top-6 right-6 z-20 p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>

            {/* Event Image */}
            <div className="w-full h-80 bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
              <img 
                src={selectedEvent.posterUrl} 
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {selectedEvent.category}
                  </span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">{selectedEvent.title}</h1>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</p>
                  <p className="font-black text-lg text-slate-900">{selectedEvent.date}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time</p>
                  <p className="font-black text-lg text-slate-900">{selectedEvent.time}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</p>
                  <p className="font-black text-sm text-slate-900 leading-snug">{selectedEvent.location}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prize Pool</p>
                  <p className="font-black text-lg text-amber-600">{selectedEvent.prizePool || 'N/A'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">About Event</h3>
                  <p className="text-slate-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-blue-600" /> Participants
                  </h3>
                  <p className="text-3xl font-black text-slate-900">{selectedEvent.attendees}</p>
                  <p className="text-sm text-slate-500 mt-1">{selectedEvent.sectionParticipants} from your section</p>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-600" /> Experience Points
                  </h3>
                  <p className="text-3xl font-black text-amber-600">{selectedEvent.xp} XP</p>
                  <p className="text-sm text-slate-500 mt-1">Upon completion</p>
                </div>
              </div>

              {/* Eligibility & Team Size */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Eligibility</p>
                    <p className="font-bold text-slate-900">{selectedEvent.eligibility}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Team Size</p>
                    <p className="font-bold text-slate-900">{selectedEvent.teamSize}</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-4 pt-4">
                <button className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:shadow-lg transition-all">
                  Register Now
                </button>
                <button className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Save for Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

