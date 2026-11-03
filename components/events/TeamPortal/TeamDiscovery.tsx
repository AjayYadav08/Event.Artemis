import React from 'react';
import { Search, Users, X, ChevronLeft, Target, MessageCircle, Rocket } from 'lucide-react';
import { Team } from '../types';

interface TeamDiscoveryProps {
  setShowJoinTeamView: (val: boolean) => void;
  setShowTeamsView: (val: boolean) => void;
  teamSearchQuery: string;
  setTeamSearchQuery: (val: string) => void;
  filteredTeamsPool: Team[];
  previewingTeam?: Team | null;
  setPreviewingTeam: (team: Team | null) => void;
  joinRequestMessage?: string;
  setJoinRequestMessage?: (val: string) => void;
  handleSendJoinRequest?: (team: Team) => void;
  isSendingRequest?: boolean;
  isLoading?: boolean;
}

const TeamDiscovery: React.FC<TeamDiscoveryProps> = ({
  teamSearchQuery,
  setTeamSearchQuery,
  filteredTeamsPool,
  previewingTeam,
  setPreviewingTeam,
  joinRequestMessage = '',
  setJoinRequestMessage,
  handleSendJoinRequest,
  isSendingRequest = false,
  isLoading = false
}) => {
  // =========================================================================
  // VIEW MODE: In-Page Full Team Details View (No Modal, Drawer, or Blur)
  // =========================================================================
  if (previewingTeam) {
    return (
      <div className="w-full flex-1 flex flex-col justify-start space-y-5 animate-in fade-in duration-200">
        {/* Top Header Row with Back Button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/90 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewingTeam(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none active:scale-[0.98]"
            title="Return to Available Squads"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Discover</span>
          </button>

          <span
            className={`text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
              previewingTeam.status === 'Open'
                ? 'bg-[#EBF3FF] text-[#1D4ED8] border border-[#BFDBFE]'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {previewingTeam.status}
          </span>
        </div>

        {/* 1. Team Hero & Identity Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
              {previewingTeam.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {previewingTeam.name}
              </h3>
              <p className="text-xs font-semibold text-[#0070F3] mt-0.5">
                {previewingTeam.hackathon}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed mt-2 font-normal">
                {previewingTeam.description || 'Collaborating together for the hackathon showcase.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Current Squad Members Grid */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Current Members ({previewingTeam.members.length}/{previewingTeam.maxMembers})</span>
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {previewingTeam.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border border-white shadow-2xs object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Expectations Section (if present) */}
        {previewingTeam.expectations && previewingTeam.expectations.length > 0 && (
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              <span>What is expected from you</span>
            </h4>
            <ul className="space-y-1.5 pl-1">
              {previewingTeam.expectations.map((exp, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Request to Join Action Area */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-[#0070F3]" />
            <span>Message to Host (Optional)</span>
          </label>
          <textarea 
            value={joinRequestMessage}
            onChange={(e) => setJoinRequestMessage?.(e.target.value)}
            placeholder="Tell the host about your skills and why you'd like to join..."
            className="w-full h-20 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0070F3] focus:bg-white rounded-xl p-3 text-xs font-normal outline-none transition-all resize-none shadow-2xs"
          />
          <div className="flex items-center justify-end pt-1">
            <button 
              type="button"
              onClick={() => handleSendJoinRequest?.(previewingTeam)}
              disabled={isSendingRequest || previewingTeam.status === 'Closed' || previewingTeam.members.length >= previewingTeam.maxMembers}
              className="h-9 px-5 bg-[#0070F3] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]"
            >
              {isSendingRequest ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Send Join Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DEFAULT VIEW MODE: Discover Teams Grid
  // =========================================================================
  return (
    <div className="w-full flex-1 flex flex-col justify-start space-y-4 sm:space-y-5">
      {/* Integrated Header: Title + Subtitle + Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200/90 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Discover Teams</h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Find an open squad and start building together.
          </p>
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search hackathons or teams..."
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0070F3] focus:bg-white rounded-xl pl-9 pr-9 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
          />
          {teamSearchQuery && (
            <button
              onClick={() => setTeamSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Adaptive Grid: 2 Cards per row on desktop, 1 per row on narrow screens */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Available Squads {isLoading ? '' : `(${filteredTeamsPool.length})`}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full">
            {[1, 2].map((idx) => (
              <div
                key={`squad-skeleton-${idx}`}
                className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shimmer-card flex flex-col justify-between shadow-2xs space-y-3 min-h-[140px]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shimmer-animated shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded shimmer-animated" />
                    <div className="h-3 w-24 bg-slate-100 rounded shimmer-animated" />
                  </div>
                </div>
                <div className="h-3 w-48 bg-slate-100 rounded shimmer-animated" />
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="h-3 w-20 bg-slate-100 rounded shimmer-animated" />
                  <div className="h-7 w-20 bg-slate-200 rounded-xl shimmer-animated" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTeamsPool.length === 0 ? (
          <div className="py-12 sm:py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200/80">
            <p className="text-sm font-semibold">No squads found matching "{teamSearchQuery}"</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing or adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full">
            {filteredTeamsPool.map((team) => (
              <div
                key={team.id}
                onClick={() => setPreviewingTeam(team)}
                className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/60 transition-all duration-150 flex flex-col justify-between shadow-2xs group cursor-pointer"
              >
                {/* Top Row: Circular Avatar + Name + Status */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-[#1D4ED8] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {team.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#0070F3] transition-colors">
                        {team.name}
                      </h4>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0 ${
                          team.status === 'Open'
                            ? 'bg-[#EBF3FF] text-[#1D4ED8] border border-[#BFDBFE]'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {team.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-normal">
                      {team.hackathon}
                    </p>
                  </div>
                </div>

                {/* Team Description Snippet */}
                <p className="text-xs text-slate-600 line-clamp-2 my-2 sm:my-2.5 leading-relaxed font-normal">
                  {team.description || 'Collaborating together for the hackathon showcase.'}
                </p>

                {/* Bottom Bar: Members Count + View Squad Action */}
                <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{team.members.length}/{team.maxMembers} members</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewingTeam(team);
                    }}
                    disabled={team.status !== 'Open'}
                    className={`h-8 px-3 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs select-none active:scale-[0.98] ${
                      team.status === 'Open'
                        ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${team.status === 'Open' ? 'bg-[#0070F3]' : 'bg-slate-300'}`} />
                    <span>{team.status === 'Open' ? 'View Squad' : 'Closed'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDiscovery;
