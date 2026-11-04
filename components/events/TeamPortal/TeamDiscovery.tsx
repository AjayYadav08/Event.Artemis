import React, { useState, useMemo } from 'react';
import { Search, Users, X, ChevronLeft, Target, MessageCircle, Rocket, Clock, Check, MapPin, UserPlus } from 'lucide-react';
import { Team, JoinRequest } from '../types';

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
  joinRequests?: Record<string, JoinRequest[]>;
  teams?: Team[];
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
  isLoading = false,
  joinRequests,
  teams = []
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<'available' | 'requests'>('available');

  // Map of all known teams across active squads and pool
  const allKnownTeams = useMemo(() => {
    const map = new Map<string, Team>();
    (teams || []).forEach(t => map.set(t.id, t));
    filteredTeamsPool.forEach(t => map.set(t.id, t));
    return map;
  }, [teams, filteredTeamsPool]);

  // User's previous join requests (userId === 'me' across all teams in joinRequests)
  const myJoinRequests = useMemo(() => {
    if (!joinRequests) return [];
    const allReqs: (JoinRequest & { team?: Team })[] = [];
    Object.values(joinRequests).forEach(teamReqs => {
      (teamReqs || []).forEach(req => {
        if (req.userId === 'me') {
          const matchedTeam = allKnownTeams.get(req.teamId);
          allReqs.push({
            ...req,
            team: matchedTeam
          });
        }
      });
    });
    return allReqs;
  }, [joinRequests, allKnownTeams]);

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

        <div className="w-full sm:w-72 shrink-0">
          <div
            className={`relative flex items-center rounded-xl h-10 px-3.5 transition-colors duration-150 w-full group ${
              isSearchFocused
                ? 'bg-white hover:bg-slate-50/50 border-2 border-[#2563eb]'
                : 'bg-white hover:bg-slate-50/80 border-2 border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <Search
              className={`w-4 h-4 mr-2.5 shrink-0 pointer-events-none transition-colors ${
                isSearchFocused ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-slate-500'
              }`}
            />
            <input
              type="text"
              placeholder="Search teams or hackathons..."
              value={teamSearchQuery}
              onChange={(e) => setTeamSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 outline-none"
            />
            {teamSearchQuery && (
              <button 
                type="button"
                onClick={() => setTeamSearchQuery('')} 
                className="text-slate-400 hover:text-slate-600 ml-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two Side-by-Side Tab Boxes: Available Squads & Previous Join Requests */}
      <div className="w-full space-y-3.5">
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Tab 1: Available Squads */}
          <button
            type="button"
            id="tab-available-squads"
            onClick={() => setActiveDiscoveryTab('available')}
            className={`h-9 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all duration-150 inline-flex items-center gap-2 cursor-pointer select-none shadow-2xs border ${
              activeDiscoveryTab === 'available'
                ? 'bg-[#EBF3FF] border-[#BFDBFE] text-[#1D4ED8]'
                : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeDiscoveryTab === 'available' ? 'text-[#1D4ED8]' : 'text-slate-400'}`} />
            <span>Available Squads</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                activeDiscoveryTab === 'available'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isLoading ? '...' : filteredTeamsPool.length}
            </span>
          </button>

          {/* Tab 2: Previous Join Requests */}
          <button
            type="button"
            id="tab-previous-join-requests"
            onClick={() => setActiveDiscoveryTab('requests')}
            className={`h-9 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all duration-150 inline-flex items-center gap-2 cursor-pointer select-none shadow-2xs border ${
              activeDiscoveryTab === 'requests'
                ? 'bg-[#EBF3FF] border-[#BFDBFE] text-[#1D4ED8]'
                : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeDiscoveryTab === 'requests' ? 'text-[#1D4ED8]' : 'text-slate-400'}`} />
            <span>Previous Join Requests</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                activeDiscoveryTab === 'requests'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {myJoinRequests.length}
            </span>
          </button>
        </div>

        {/* Tab 1 Content: Available Squads Grid */}
        {activeDiscoveryTab === 'available' && (
          <div className="w-full">
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
                        <p className="text-xs text-slate-500 truncate font-normal flex items-center gap-1">
                          {team.location && (
                            <>
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{team.location}</span>
                              <span className="text-slate-300">•</span>
                            </>
                          )}
                          <span className="truncate">{team.hackathon}</span>
                        </p>
                      </div>
                    </div>

                    {/* Team Description Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 my-2 sm:my-2.5 leading-relaxed font-normal">
                      {team.description || 'Collaborating together for the hackathon showcase.'}
                    </p>

                    {/* Bottom Bar: Members Count + Add / View Squad Action Button */}
                    <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{team.members.length}/{team.maxMembers} members</span>
                      </div>
                      <button
                        type="button"
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
                        title={team.status === 'Open' ? 'View Squad & Add/Join' : 'Closed'}
                      >
                        <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                        <span>{team.status === 'Open' ? 'View Squad' : 'Closed'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Content: Previous Join Requests */}
        {activeDiscoveryTab === 'requests' && (
          <div className="w-full space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 shrink-0 pb-1">
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Track your submitted join requests across squads
                </p>
              </div>
              {myJoinRequests.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 mt-1 sm:mt-0">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Accepted</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Rejected</span>
                  </span>
                </div>
              )}
            </div>

            {myJoinRequests.length === 0 ? (
              <div className="py-8 sm:py-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No previous join requests</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  When you submit a request to join an available squad, its live approval status will be displayed here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full">
                {myJoinRequests.map((req) => {
                  const teamName = req.teamName || req.team?.name || 'Squad Application';
                  const hackathonName = req.hackathon || req.team?.hackathon || 'Hackathon Showcase';
                  const firstLetter = teamName.charAt(0);

                  return (
                    <div
                      key={req.id}
                      className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all duration-150"
                    >
                      {/* Top: Avatar, Name, Hackathon/Location, and Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#EBF3FF] border border-[#BFDBFE] text-[#1D4ED8] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {firstLetter}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {teamName}
                            </h4>
                            <p className="text-xs text-slate-500 truncate font-normal">
                              {req.team?.location ? `${req.team.location} • ` : ''}{hackathonName}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {req.status === 'Accepted' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Accepted</span>
                            </span>
                          ) : req.status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              <X className="w-3 h-3 stroke-[2.5]" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Request Message */}
                      {req.message && (
                        <div className="my-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-600 italic font-medium leading-relaxed line-clamp-2">
                            "{req.message}"
                          </p>
                        </div>
                      )}

                      {/* Bottom: Timestamp and team members info */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 font-medium mt-auto">
                        <span>Submitted {req.timestamp}</span>
                        {req.team && (
                          <span className="text-slate-500">
                            {req.team.members.length}/{req.team.maxMembers} members
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDiscovery;
