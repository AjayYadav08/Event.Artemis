import React, { useState, useRef, useEffect } from 'react';
import { Search, Zap, Filter, LayoutGrid, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';

interface SearchFiltersProps {
  showTeamsView: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeFilter: string;
  setActiveFilter: (val: string) => void;
  activeNav: string;
  setActiveNav: (val: string) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  showTeamsView,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  activeNav,
  setActiveNav
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (showTeamsView) return null;

  const categories = ['All', 'Competition', 'Workshop', 'Fest', 'Seminar'];
  const navItems = [
    { id: 'tour-closing', label: 'Closing Soon', icon: '🔥' },
    { id: 'tour-upcoming', label: 'Upcoming Feed', icon: '⏰' },
    { id: 'tour-past', label: 'Past Feed', icon: '⌛' }
  ];

  return (
    <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* INTEGRATED SEARCH & FILTER BAR */}
      <div id="tour-search-bar" className="bg-white/40 backdrop-blur-xl border border-white/60 p-2 lg:p-3 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_12px_48px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* SEARCH INPUT AREA */}
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-blue-500/5 rounded-[24px] opacity-0 group-focus-within:opacity-100 transition-all duration-500 blur-xl pointer-events-none" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all duration-300 pointer-events-none z-10" />
            <input 
              type="text" 
              placeholder="Search hackathons, workshops, or fests..." 
              className="w-full bg-white/80 border border-slate-100/50 pl-14 pr-24 py-5 rounded-[24px] text-base font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white outline-none transition-all duration-300 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-20 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-20"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            
            {/* FILTER DROPDOWN TRIGGER */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2" ref={dropdownRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 rounded-xl transition-all flex items-center gap-2 group/filter z-20 ${
                  isFilterOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50/80 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                {activeFilter !== 'All' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm animate-in fade-in zoom-in duration-300" />
                )}
              </button>

              {/* DROPDOWN MENU */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-4 w-56 bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2 animate-in zoom-in-95 fade-in duration-200 origin-top-right z-[100]">
                  <div className="px-3 py-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filter Category</span>
                  </div>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveFilter(cat);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        activeFilter === cat 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-slate-600'
                      }`}
                    >
                      {cat}
                      {activeFilter === cat && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* VERTICAL DIVIDER (DESKTOP) */}
          <div className="hidden lg:block w-px h-10 bg-slate-200/50 mx-2" />

          {/* MAIN FEED NAVIGATION CONTROLS (FORMERLY CATEGORIES) */}
          <div className="flex items-center p-1.5 bg-slate-100/50 rounded-[22px] overflow-x-auto no-scrollbar" id="tour-feed-nav">
            {navItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => {
                    setActiveNav(item.id);
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                  }}
                  className={`relative px-5 py-3 rounded-[18px] text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-white/40`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
                {index < navItems.length - 1 && (
                  <div className="w-px h-4 bg-slate-300/40 mx-1 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SearchFilters);
