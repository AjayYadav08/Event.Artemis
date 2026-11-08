import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, Check, MessageCircle, Rocket, UserPlus, ArrowLeft, ArrowRight, X, SlidersHorizontal, Heart, FilterX } from 'lucide-react';
import { Team } from './types';
import { useTutorial } from '../tutorial/TutorialContext';

interface EventsHeaderProps {
  showTeamsView: boolean;
  setShowTeamsView: (val: boolean) => void;
  setActiveTeam: (team: Team | null) => void;
  setShowTeamMembers: (val: boolean) => void;
  setShowCreateTeamForm: (val: boolean) => void;
  setShowJoinTeamView: (val: boolean) => void;
  teams: Team[];
  showCreateTeamForm: boolean;
  showJoinTeamView: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategories?: string[];
  setSelectedCategories?: (val: string[]) => void;
  selectedStatuses?: string[];
  setSelectedStatuses?: (val: string[]) => void;
  activeFilter?: string;
  setActiveFilter?: (val: string) => void;
  activeNav?: string;
  setActiveNav?: (val: string) => void;
  showOnlyInterested?: boolean;
  setShowOnlyInterested?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CATEGORY_OPTIONS = [
  { id: 'Competition', label: 'Competition' },
  { id: 'Workshop', label: 'Workshop' },
  { id: 'Fest', label: 'Fest' },
  { id: 'Seminar', label: 'Seminar' },
];

const EventsHeader: React.FC<EventsHeaderProps> = ({
  showTeamsView,
  setShowTeamsView,
  setActiveTeam,
  setShowTeamMembers,
  setShowCreateTeamForm,
  setShowJoinTeamView,
  teams,
  showCreateTeamForm,
  showJoinTeamView,
  searchQuery,
  setSearchQuery,
  selectedCategories = [],
  setSelectedCategories,
  selectedStatuses = [],
  setSelectedStatuses,
  activeFilter,
  setActiveFilter,
  activeNav,
  setActiveNav,
  showOnlyInterested = false,
  setShowOnlyInterested,
}) => {
  const { activeFlow, currentStepIndex, advanceStep } = useTutorial();

  // Category Filter State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [pendingCategories, setPendingCategories] = useState<string[]>(selectedCategories);
  const [isYourTeamsHovered, setIsYourTeamsHovered] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Responsive Status Dropdown State
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(target)) {
        setIsCategoryOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCategoryDropdown = () => {
    setPendingCategories(selectedCategories);
    setIsCategoryOpen(prev => !prev);
  };

  // Category Filter Handlers
  const togglePendingCategory = (id: string) => {
    setPendingCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleClearCategory = () => {
    setPendingCategories([]);
    setSelectedCategories?.([]);
    setActiveFilter?.('All');
    setIsCategoryOpen(false);
  };

  const handleApplyCategory = () => {
    setSelectedCategories?.(pendingCategories);
    if (pendingCategories.length === 1) {
      setActiveFilter?.(pendingCategories[0]);
    } else if (pendingCategories.length === 0) {
      setActiveFilter?.('All');
    } else {
      setActiveFilter?.(pendingCategories.join(','));
    }
    setIsCategoryOpen(false);
  };

  const hasActiveCategoryFilter = Boolean(
    (selectedCategories && selectedCategories.length > 0) ||
    (activeFilter && activeFilter !== 'All')
  );

  // Navigation shortcuts
  const scrollToSection = (sectionId: string) => {
    const doScroll = () => {
      const el = document.getElementById(sectionId) || document.getElementById(`section-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (showTeamsView) {
      setShowTeamsView(false);
      setActiveTeam(null);
      setShowTeamMembers(false);
      setShowCreateTeamForm(false);
      setShowJoinTeamView(false);
      setTimeout(doScroll, 60);
    } else {
      doScroll();
    }
  };



  return (
    <div id="events-page-header" className="sticky top-0 z-[100] px-8 pt-5 pb-4 bg-white border-b border-slate-200">
      {/* SINGLE ROW */}
      <div className="flex items-center justify-between gap-4 w-full">
        {showTeamsView ? (
          <>
            {/* LEFT: Back to Events Feed button */}
            <button
              id="tour-back-to-events"
              onClick={() => {
                setShowTeamsView(false);
                setActiveTeam(null);
                setShowTeamMembers(false);
                setShowCreateTeamForm(false);
                setShowJoinTeamView(false);
              }}
              className="h-10 w-24 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 shadow-sm flex items-center justify-center gap-1.5 transition-all duration-150 text-slate-900 font-bold select-none cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5] text-slate-900" />
              <span className="text-sm font-bold text-slate-900">Back</span>
            </button>

            {/* RIGHT: Team navigation buttons aligned to the far right */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="tour-teams-tab"
                onClick={() => {
                  setShowTeamMembers(false);
                  setShowCreateTeamForm(false);
                  setShowJoinTeamView(false);
                }}
                className={`h-10 w-[150px] px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-[0.98] ${
                  !showCreateTeamForm && !showJoinTeamView
                    ? 'border border-[#BFDBFE] bg-[#EBF3FF] text-[#1D4ED8]'
                    : 'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 active:bg-[#EBF3FF] active:border-[#BFDBFE] active:text-[#1D4ED8]'
                }`}
              >
                <span>Current Teams</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition-all ${
                    !showCreateTeamForm && !showJoinTeamView
                      ? 'bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]'
                      : 'bg-slate-100 text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {teams.length}
                </span>
              </button>

              <button
                id="tour-create-team-btn"
                onClick={() => { setShowCreateTeamForm(true); setShowJoinTeamView(false); }}
                className={`h-10 w-[104px] px-3 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm active:scale-[0.98] ${
                  showCreateTeamForm
                    ? 'border border-[#BFDBFE] bg-[#EBF3FF] text-[#1D4ED8]'
                    : 'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 active:bg-[#EBF3FF] active:border-[#BFDBFE] active:text-[#1D4ED8]'
                }`}
              >
                <span>New Team</span>
              </button>

              <button
                id="tour-team-search"
                onClick={() => { setShowJoinTeamView(true); setShowCreateTeamForm(false); }}
                className={`h-10 w-[104px] px-3 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm active:scale-[0.98] ${
                  showJoinTeamView
                    ? 'border border-[#BFDBFE] bg-[#EBF3FF] text-[#1D4ED8]'
                    : 'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 active:bg-[#EBF3FF] active:border-[#BFDBFE] active:text-[#1D4ED8]'
                }`}
              >
                <span>Join Team</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 1. YOUR TEAMS BUTTON (Subtle border & font contrast improvements) */}
            <button
              id="tour-teams-tab"
              onClick={() => {
                setShowTeamsView(true);
                setShowTeamMembers(false);
                setShowCreateTeamForm(false);
                setShowJoinTeamView(true);
                if (activeFlow === 'homepage' && currentStepIndex === 3) {
                  advanceStep();
                }
              }}
              onMouseEnter={() => setIsYourTeamsHovered(true)}
              onMouseLeave={() => setIsYourTeamsHovered(false)}
              onMouseOver={() => setIsYourTeamsHovered(true)}
              onMouseOut={() => setIsYourTeamsHovered(false)}
              className={`group h-10 w-40 px-3.5 rounded-lg border shadow-sm flex items-center justify-between text-left transition-all duration-200 shrink-0 select-none active:scale-[0.98] ${
                isYourTeamsHovered
                  ? 'bg-[#EEEFF3] border-slate-400 text-slate-900'
                  : 'bg-white border-slate-300 hover:bg-[#EEEFF3] hover:border-slate-400 text-slate-800 hover:text-slate-900'
              } active:bg-[#EBF3FF] active:border-[#BFDBFE] active:text-[#1D4ED8]`}
            >
              <span className={`teams-tab-text text-sm font-semibold transition-colors ${
                isYourTeamsHovered ? 'text-slate-900' : 'text-slate-800 group-hover:text-slate-900'
              }`}>
                Your Teams
              </span>
              <div
                className={`teams-tab-arrow w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white transition-all duration-200 shrink-0 shadow-xs ${
                  isYourTeamsHovered
                    ? 'opacity-100 scale-100'
                    : 'opacity-45 group-hover:opacity-100'
                }`}
              >
                <ArrowRight className="w-2.5 h-2.5 text-white stroke-[2.5]" />
              </div>
            </button>

            {/* 2. SEARCH BAR (SLIGHTLY REDUCED WIDTH) + HEART FILTER BUTTON */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                id="tour-search-bar"
                className="relative w-64 md:w-72 lg:w-[330px] xl:w-[370px] h-10 group shrink-0 transition-all"
              >
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search events, hackathons..."
                  className={`w-full h-full bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#2563eb] rounded-xl pl-10 ${
                    hasActiveCategoryFilter
                      ? searchQuery ? 'pr-[104px]' : 'pr-[72px]'
                      : searchQuery ? 'pr-[72px]' : 'pr-10'
                  } text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none transition-all duration-150`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute ${
                      hasActiveCategoryFilter ? 'right-[74px]' : 'right-10'
                    } top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all`}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Integrated Category Filter Trigger & Dropdown Menu */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1" ref={categoryRef}>
                  {/* Main Category Filter Button (shifted to the left when clear icon is present) */}
                  <button
                    id="tour-category-filter-btn"
                    type="button"
                    onClick={openCategoryDropdown}
                    aria-label="Filter events by category"
                    className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isCategoryOpen
                        ? 'text-blue-600 bg-blue-50'
                        : hasActiveCategoryFilter
                          ? 'text-blue-600 hover:bg-blue-50/70'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {hasActiveCategoryFilter && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                    )}
                  </button>

                  {/* Clear / Reset Active Filters Icon Button (displayed on the right side of active filter controls) */}
                  {hasActiveCategoryFilter && (
                    <button
                      id="tour-clear-filters-btn"
                      type="button"
                      onClick={handleClearCategory}
                      aria-label="Clear active filters"
                      title="Clear active filters"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                    >
                      <FilterX className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Category Dropdown Menu Card (Preserved interface) */}
                  {isCategoryOpen && (
                    <div className="absolute top-full mt-2.5 right-0 z-50 w-72 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">
                        CATEGORY
                      </div>

                      <div className="space-y-3.5">
                        {CATEGORY_OPTIONS.map(opt => {
                          const isChecked = pendingCategories.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              onClick={() => togglePendingCategory(opt.id)}
                              className="flex items-center justify-between py-1 px-1 cursor-pointer select-none"
                            >
                              <span className="text-sm font-medium text-slate-900">
                                {opt.label}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                                  isChecked
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-200 my-4" />

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleClearCategory}
                          className="text-sm font-semibold text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyCategory}
                          className="bg-[#0070f3] hover:bg-blue-600 active:scale-95 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          Apply Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. HEART FILTER BUTTON (Similar to event cards: naked symbol, no outer boundary) */}
              <button
                id="tour-liked-filter-btn"
                type="button"
                onClick={() => setShowOnlyInterested?.(prev => !prev)}
                className={`w-9 h-10 flex items-center justify-center transition-all cursor-pointer hover:scale-125 active:scale-90 select-none shrink-0 ${
                  showOnlyInterested ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                }`}
                title={showOnlyInterested ? 'Show all events' : 'Filter by liked events'}
                aria-label={showOnlyInterested ? 'Show all events' : 'Filter by liked events'}
              >
                <Heart
                  className={`w-6 h-6 stroke-current ${showOnlyInterested ? 'fill-current' : ''}`}
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* 4. NAVIGATION SHORTCUT BUTTONS (Desktop: 3 separate controls when space is comfortable) */}
            <div className="hidden min-[1200px]:flex items-center gap-2.5 shrink-0">
              <button
                id="tour-closing"
                type="button"
                onClick={() => scrollToSection('section-closing')}
                className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 active:bg-[#EBF3FF] active:border-[#BFDBFE] active:text-[#1D4ED8] text-sm font-semibold transition-all select-none active:scale-[0.98] shrink-0"
              >
                Closing Soon
              </button>

              <button
                id="tour-upcoming"
                type="button"
                onClick={() => scrollToSection('section-upcoming')}
                className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 active:bg-[#EBF3FF] active:border-[#BFDBFE] active:text-[#1D4ED8] text-sm font-semibold transition-all select-none active:scale-[0.98] shrink-0"
              >
                Upcoming
              </button>

              <button
                id="tour-past"
                type="button"
                onClick={() => scrollToSection('section-past')}
                className="h-10 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 active:bg-[#EBF3FF] active:border-[#BFDBFE] active:text-[#1D4ED8] text-sm font-semibold transition-all select-none active:scale-[0.98] shrink-0"
              >
                Past Due
              </button>
            </div>

            {/* 5. RESPONSIVE STATUS DROPDOWN (When space is tight / zoomed in) */}
            <div className="flex min-[1200px]:hidden relative shrink-0" ref={statusRef}>
              <button
                id="tour-status-dropdown-btn"
                type="button"
                onClick={() => setIsStatusOpen(prev => !prev)}
                className={`h-10 px-4 rounded-full border transition-all text-sm font-semibold select-none flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] shrink-0 ${
                  isStatusOpen
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-800 hover:text-slate-900'
                }`}
                aria-label="Filter by Status"
              >
                <span>Status</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isStatusOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {isStatusOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 w-44 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      scrollToSection('section-closing');
                      setIsStatusOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Closing Soon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      scrollToSection('section-upcoming');
                      setIsStatusOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Upcoming</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      scrollToSection('section-past');
                      setIsStatusOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Past Due</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventsHeader;
