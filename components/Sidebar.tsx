import React from 'react';
import { 
  Home, 
  TrendingUp,
  GitCommitVertical, 
  Calendar, 
  FileText,
  Trophy, 
  FileCheck2,
  ShieldAlert,
  HelpCircle,
  PartyPopper,
  Globe
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unopenedEventsCount?: number;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  unopenedEventsCount = 0,
  userRole
}) => {
  const subjects = [
    'ADA - D',
    'ADA Lab 1 - D',
    'AP - D',
    'AP Lab 1 - D',
    'DE - D',
    'DE Lab 1 - D',
    'LHL - D',
    'Maths III - D',
    'Maths III Lab 1 - D'
  ];

  return (
    <aside className="w-[248px] border-r border-[#e8ebef] bg-white flex flex-col h-full shrink-0 z-20 select-none">
      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-2">
        
        {/* Course Info Header */}
        <div className="px-2 pt-1 pb-3">
          <div className="text-base font-bold text-slate-900 tracking-tight leading-tight">
            S3'25 CS+AI RU
          </div>
          <div className="mt-1.5">
            <span className="inline-block bg-[#E8F8F0] text-[#047857] text-xs font-bold px-2.5 py-0.5 rounded-md cursor-default">
              Enrolled
            </span>
          </div>
        </div>

        {/* Home Item - Clickable & Functional */}
        <button 
          id="tour-sidebar-dashboard"
          onClick={() => setActiveTab('Home')}
          className={`flex items-center w-full px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'Home' 
              ? 'bg-[#EBF3FF] text-[#1D4ED8] font-bold' 
              : 'text-slate-800 hover:bg-slate-50 hover:text-slate-950 font-semibold'
          }`}
        >
          <Home className={`w-5 h-5 mr-3.5 shrink-0 ${activeTab === 'Home' ? 'text-[#1D4ED8] fill-[#1D4ED8]' : 'text-slate-700'}`} />
          <span className="text-[15px]">Home</span>
        </button>

        {/* Subjects Section - Presentation Only */}
        <div className="pt-3 pb-1">
          <div className="px-2 text-[12.5px] font-bold text-slate-600 mb-2.5 tracking-wide uppercase cursor-default">
            Subjects
          </div>
          <div className="border border-[#e8ebef] rounded-2xl p-1.5 bg-white space-y-0.5 shadow-xs">
            {subjects.map(subject => (
              <div 
                key={subject}
                className="px-3 py-2 text-sm font-semibold text-slate-800 rounded-lg cursor-default leading-snug truncate"
              >
                {subject}
              </div>
            ))}
          </div>
        </div>

        {/* Events Page - Clickable & Functional (Added immediately above the Core Card / Scorecard item) */}
        <div className="pt-2">
          <button 
            id="tour-sidebar-events"
            onClick={() => setActiveTab('Events')}
            className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'Events' 
                ? 'bg-[#EBF3FF] text-[#1D4ED8] font-bold' 
                : 'text-slate-800 hover:bg-slate-50 hover:text-slate-950 font-semibold'
            }`}
          >
            <div className="flex items-center min-w-0">
              <PartyPopper className={`w-5 h-5 mr-3.5 shrink-0 ${activeTab === 'Events' ? 'text-[#1D4ED8]' : 'text-slate-700'}`} />
              <span className="text-[15px] truncate">Events</span>
            </div>
            {unopenedEventsCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-xs shrink-0" />
            )}
          </button>

          {(userRole === 'ADMIN' || userRole === 'ORGANIZER') && (
            <button
              onClick={() => setActiveTab('EventSources')}
              className={`mt-1 flex items-center w-full px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'EventSources'
                  ? 'bg-[#EBF3FF] text-[#1D4ED8] font-bold'
                  : 'text-slate-800 hover:bg-slate-50 hover:text-slate-950 font-semibold'
              }`}
            >
              <Globe className={`w-5 h-5 mr-3.5 shrink-0 ${activeTab === 'EventSources' ? 'text-[#1D4ED8]' : 'text-slate-700'}`} />
              <span className="text-[15px] truncate">Event Sources</span>
            </button>
          )}
        </div>

        {/* Scorecard - Presentation Only */}
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold cursor-default select-none">
          <TrendingUp className="w-5 h-5 mr-3.5 shrink-0 text-slate-700" />
          <span className="text-[15px] truncate">Scorecard</span>
        </div>

        {/* My Timeline - Presentation Only */}
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold cursor-default select-none">
          <GitCommitVertical className="w-5 h-5 mr-3.5 shrink-0 text-slate-700" />
          <span className="text-[15px] truncate">My Timeline</span>
        </div>

        {/* Calendar - Presentation Only */}
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold cursor-default select-none">
          <Calendar className="w-5 h-5 mr-3.5 shrink-0 text-slate-700" />
          <span className="text-[15px] truncate">Calendar</span>
        </div>

        {/* My Requests - Presentation Only */}
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold cursor-default select-none">
          <FileText className="w-5 h-5 mr-3.5 shrink-0 text-slate-700" />
          <span className="text-[15px] truncate">My Requests</span>
        </div>

        {/* Leaderboard - Presentation Only */}
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold cursor-default select-none">
          <Trophy className="w-5 h-5 mr-3.5 shrink-0 text-slate-700" />
          <span className="text-[15px] truncate">Leaderboard</span>
        </div>

        {/* Question of the Day - Presentation Only */}
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold cursor-default select-none">
          <FileCheck2 className="w-5 h-5 mr-3.5 shrink-0 text-slate-700" />
          <span className="text-[15px] truncate">Question of the Day</span>
        </div>

        {/* Share a Concern - Presentation Only */}
        <div className="pt-2">
          <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl bg-[#E8F8F0] text-[#047857] font-semibold cursor-default select-none">
            <ShieldAlert className="w-5 h-5 mr-3.5 text-[#047857] shrink-0" />
            <span className="text-[15px] truncate">Share a Concern</span>
          </div>
        </div>

        {/* Help & Support - Presentation Only */}
        <div className="flex items-center w-full px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold cursor-default select-none">
          <HelpCircle className="w-5 h-5 mr-3.5 shrink-0 text-slate-700" />
          <span className="text-[15px] truncate">Help & Support</span>
        </div>

      </div>
    </aside>
  );
};
