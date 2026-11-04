import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Compass, 
  X, 
  ChevronLeft,
  ChevronDown,
  Inbox,
  LogOut,
  Settings,
  Shield,
  Star
} from 'lucide-react';
import { Team, ChatMessage, JoinRequest, ChatAttachment } from '../types';
import TeamChat from './TeamChat';
import TeamRequests from './TeamRequests';
import TeamDiscovery from './TeamDiscovery';
import CreateTeamForm from './CreateTeamForm';
import { useTutorial } from '../../tutorial/TutorialContext';

interface TeamPortalProps {
  availableEvents: any[];
  activeTeam: Team | null;
  setActiveTeam: (team: Team | null) => void;
  showCreateTeamForm: boolean;
  setShowCreateTeamForm: (val: boolean) => void;
  showJoinTeamView: boolean;
  setShowJoinTeamView: (val: boolean) => void;
  teams: Team[];
  activeTab: 'Chat' | 'Members' | 'Requests';
  setActiveTab: (tab: 'Chat' | 'Members' | 'Requests') => void;
  teamHosts: Record<string, string>;
  joinRequests: Record<string, JoinRequest[]>;
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  removedMembers: Record<string, Set<string>>;
  submittedRatings: Record<string, { stars: number; feedback: string }>;
  handleMakeHost: (teamId: string, memberId: string) => void;
  setConfirmRemoveTarget: (id: string | null) => void;
  confirmRemoveTarget: string | null;
  handleRemoveMember: (teamId: string, memberId: string) => void;
  setRatingTarget: (id: string | null) => void;
  ratingTarget: string | null;
  setRatingStars: (stars: number) => void;
  ratingStars: number;
  setRatingFeedback: (feedback: string) => void;
  ratingFeedback: string;
  handleSubmitRating: () => void;
  teamMessages: Record<string, ChatMessage[]>;
  handleDeleteMessage?: (teamId: string, messageId: string, deleteType: 'forMe' | 'forEveryone', userId?: string) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  sendMessage: (customText?: string, audioData?: { url?: string; duration?: number }, attachmentData?: ChatAttachment) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  handleAcceptRequest: (request: JoinRequest) => void;
  handleRejectRequest: (request: JoinRequest) => void;
  teamSearchQuery: string;
  setTeamSearchQuery: (val: string) => void;
  filteredTeamsPool: Team[];
  previewingTeam?: Team | null;
  setPreviewingTeam: (team: Team | null) => void;
  joinRequestMessage?: string;
  setJoinRequestMessage?: (val: string) => void;
  handleSendJoinRequest?: (team: Team) => void;
  isSendingRequest?: boolean;
  newTeamData: any;
  setNewTeamData: (data: any) => void;
  handleCreateTeam: () => void;
  setShowTeamsView: (val: boolean) => void;
}

const TeamPortal: React.FC<TeamPortalProps> = (props) => {
  const {
    availableEvents,
    activeTeam, setActiveTeam,
    showCreateTeamForm, setShowCreateTeamForm,
    showJoinTeamView, setShowJoinTeamView,
    teams,
    activeTab, setActiveTab,
    teamHosts, joinRequests,
    setTeams,
    removedMembers, submittedRatings,
    handleMakeHost, setConfirmRemoveTarget, confirmRemoveTarget, handleRemoveMember,
    setRatingTarget, ratingTarget, setRatingStars, ratingStars, setRatingFeedback, ratingFeedback, handleSubmitRating,
    teamMessages, handleDeleteMessage, chatInput, setChatInput, sendMessage, chatEndRef,
    handleAcceptRequest, handleRejectRequest,
    teamSearchQuery, setTeamSearchQuery, filteredTeamsPool, setPreviewingTeam,
    previewingTeam, joinRequestMessage, setJoinRequestMessage, handleSendJoinRequest, isSendingRequest,
    newTeamData, setNewTeamData, handleCreateTeam,
    setShowTeamsView
  } = props;

  const { startFlow, advanceStep, activeFlow } = useTutorial();

  // Team info displayed in main chat area state
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  const [confirmExitTeam, setConfirmExitTeam] = useState(false);

  // Ensure an active team is selected whenever teams exist (default to first/most recent team)
  const effectiveActiveTeam = activeTeam || teams[0] || null;

  useEffect(() => {
    if (!activeTeam && teams.length > 0) {
      setActiveTeam(teams[0]);
    }
  }, [activeTeam, teams, setActiveTeam]);

  // Whenever TeamPortal mounts or is entered, default to Discover Teams page
  useEffect(() => {
    setShowJoinTeamView(true);
    setShowCreateTeamForm(false);
    setShowTeamInfo(false);
  }, []);

  // Active view tracker for resetting scroll position across pages
  const activeViewName = showJoinTeamView
    ? `discover-${previewingTeam ? previewingTeam.id : 'list'}`
    : showCreateTeamForm
    ? 'create-team'
    : showTeamInfo
    ? `team-info-${effectiveActiveTeam?.id}`
    : activeTab === 'Requests'
    ? `requests-${effectiveActiveTeam?.id}`
    : `chat-${effectiveActiveTeam?.id}`;

  const discoverScrollRef = useRef<HTMLDivElement>(null);
  const createTeamScrollRef = useRef<HTMLDivElement>(null);
  const teamInfoScrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position to top whenever switching pages or revisiting a page
  useEffect(() => {
    if (discoverScrollRef.current) discoverScrollRef.current.scrollTop = 0;
    if (createTeamScrollRef.current) createTeamScrollRef.current.scrollTop = 0;
    if (teamInfoScrollRef.current) teamInfoScrollRef.current.scrollTop = 0;
  }, [activeViewName]);

  // Sidebar search / filter state
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredSidebarTeams = useMemo(() => {
    if (!sidebarSearch.trim()) return teams;
    const q = sidebarSearch.toLowerCase();
    return teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.hackathon.toLowerCase().includes(q)
    );
  }, [teams, sidebarSearch]);

  const didStartTeamDetailsFlow = useRef(false);

  useEffect(() => {
    if (effectiveActiveTeam) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const pageContainer = document.getElementById('events-page-scroll-container') || document.querySelector('.overflow-y-auto');
      if (pageContainer) pageContainer.scrollTop = 0;

      if (!didStartTeamDetailsFlow.current) {
        didStartTeamDetailsFlow.current = true;
        const t = setTimeout(() => startFlow('team_details'), 350);
        return () => clearTimeout(t);
      }
    }
  }, [effectiveActiveTeam, startFlow]);

  // Handle Exit Team
  const handleExitTeam = () => {
    if (!effectiveActiveTeam) return;
    const teamId = effectiveActiveTeam.id;
    setTeams(prev => prev.filter(t => t.id !== teamId));
    const remaining = teams.filter(t => t.id !== teamId);
    if (remaining.length > 0) {
      setActiveTeam(remaining[0]);
    } else {
      setActiveTeam(null);
    }
    setConfirmExitTeam(false);
    setShowTeamInfo(false);
  };

  const pendingRequestsCount = effectiveActiveTeam 
    ? (joinRequests[effectiveActiveTeam.id] || []).filter(r => r.status === 'Pending').length 
    : 0;

  return (
    <div className="flex-1 min-h-0 flex flex-row w-full h-full bg-white overflow-hidden pb-[30px] sm:pb-[36px] md:pb-[36px] pr-3 md:pr-4">
      {/* =========================================================================
          LEFT SIDEBAR (Teams List)
          ========================================================================= */}
      <aside className="w-80 sm:w-84 md:w-96 shrink-0 border-r border-b border-slate-200/90 bg-white flex flex-col h-full select-none">
        {/* 1. Header: Teams Title + New / Discover Action Icons (Back button removed) */}
        <div className="h-16 px-4 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0" id="tour-current-teams-title">
            <button
              onClick={() => {
                setShowTeamsView(false);
                setActiveTeam(null);
                setShowCreateTeamForm(false);
                setShowJoinTeamView(false);
              }}
              className="w-8 h-8 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs select-none active:scale-[0.96]"
              title="Back to Events"
              aria-label="Back to Events"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Teams</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="tour-create-team-btn"
              onClick={() => {
                setShowCreateTeamForm(!showCreateTeamForm);
                setShowJoinTeamView(false);
              }}
              title="Create Team"
              className={`h-9 px-3.5 sm:px-4 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs select-none active:scale-[0.98] ${
                showCreateTeamForm
                  ? 'bg-[#EBF3FF] text-[#1D4ED8] border-[#BFDBFE] shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create</span>
            </button>

            <button
              id="tour-team-search"
              onClick={() => {
                setShowJoinTeamView(!showJoinTeamView);
                setShowCreateTeamForm(false);
              }}
              title="Discover Teams"
              className={`h-9 px-3.5 sm:px-4 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs select-none active:scale-[0.98] ${
                showJoinTeamView
                  ? 'bg-[#EBF3FF] text-[#1D4ED8] border-[#BFDBFE] shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <Compass className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Discover</span>
            </button>
          </div>
        </div>

        {/* 2. Redesigned Search Input: Independent Focus & Hover States */}
        <div className="px-4 py-3 bg-white border-b border-slate-200/80 shrink-0">
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
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 outline-none"
            />
            {sidebarSearch && (
              <button 
                onClick={() => setSidebarSearch('')} 
                className="text-slate-400 hover:text-slate-600 ml-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Refined Vertical Teams List with Rounded Corners & Distinct States */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1.5 bg-white no-scrollbar" id="tour-my-teams-list">
          {filteredSidebarTeams.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-xs font-medium text-slate-400">No teams found</p>
            </div>
          ) : (
            filteredSidebarTeams.map((team, tIdx) => {
              const isSelected = effectiveActiveTeam?.id === team.id && !showJoinTeamView && !showCreateTeamForm;
              const teamPendingCount = (joinRequests[team.id] || []).filter(r => r.status === 'Pending').length;
              const isUserHost = teamHosts[team.id] === 'me';

              // Last message snippet (excluding messages deleted for me)
              const msgs = (teamMessages[team.id] || team.messages || []).filter(
                m => !m.deletedForUsers?.includes('me')
              );
              const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

              return (
                <div
                  key={team.id}
                  id={tIdx === 0 ? 'tour-first-team-card' : undefined}
                  onClick={() => {
                    setActiveTeam(team);
                    setActiveTab('Chat');
                    setShowCreateTeamForm(false);
                    setShowJoinTeamView(false);
                    setShowTeamInfo(false);
                  }}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 rounded-xl relative select-none ${
                    isSelected
                      ? 'bg-[#EBF3FF] text-slate-900 border border-[#BFDBFE] shadow-2xs font-medium'
                      : 'hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  {/* Circular Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                    isSelected
                      ? 'bg-white text-[#1D4ED8] border border-[#BFDBFE] font-bold shadow-2xs'
                      : 'bg-[#EBF3FF] text-[#1D4ED8] font-semibold'
                  }`}>
                    {team.name.charAt(0)}
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate ${isSelected ? 'text-[#1D4ED8] font-bold' : 'text-slate-900 font-semibold'}`}>
                        {team.name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0 ml-2">
                        {lastMsg ? lastMsg.timestamp : team.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 truncate leading-tight font-normal">
                        {lastMsg ? (
                          <span>
                            <span className="font-semibold text-slate-700">{lastMsg.isMe ? 'You: ' : `${lastMsg.senderName.split(' ')[0]}: `}</span>
                            <span className="text-slate-600">{lastMsg.text}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">{team.hackathon}</span>
                        )}
                      </p>

                      {/* Unread / Pending Request Badge */}
                      {isUserHost && teamPendingCount > 0 && (
                        <span 
                          className="w-4 h-4 rounded-full bg-[#0070F3] text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                          title={`${teamPendingCount} pending join request(s)`}
                        >
                          {teamPendingCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN WORKSPACE (Team Header + Chat / Requests / Team Info in Main Area)
          ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col bg-white h-full overflow-hidden border-r border-b border-slate-200/90 rounded-br-2xl">
        {showJoinTeamView ? (
          <div 
            key={`page-discover-${previewingTeam ? previewingTeam.id : 'list'}`}
            ref={discoverScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 bg-white no-scrollbar"
          >
            <TeamDiscovery
              setShowJoinTeamView={setShowJoinTeamView}
              setShowTeamsView={setShowTeamsView}
              teamSearchQuery={teamSearchQuery}
              setTeamSearchQuery={setTeamSearchQuery}
              filteredTeamsPool={filteredTeamsPool}
              previewingTeam={previewingTeam}
              setPreviewingTeam={setPreviewingTeam}
              joinRequestMessage={joinRequestMessage}
              setJoinRequestMessage={setJoinRequestMessage}
              handleSendJoinRequest={handleSendJoinRequest}
              isSendingRequest={isSendingRequest}
              joinRequests={joinRequests}
              teams={teams}
            />
          </div>
        ) : showCreateTeamForm ? (
          <div 
            key="page-create-team"
            ref={createTeamScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 bg-white no-scrollbar"
          >
            <CreateTeamForm
              availableEvents={availableEvents}
              setShowCreateTeamForm={setShowCreateTeamForm}
              newTeamData={newTeamData}
              setNewTeamData={setNewTeamData}
              handleCreateTeam={handleCreateTeam}
            />
          </div>
        ) : effectiveActiveTeam ? (
          <>
            {/* Clean Top Header: Team Name (clickable, no boxed hover effect) + Requests Button shifted right */}
            <div className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 select-none">
              {/* Team Identity Area -> Name is directly clickable with pointer cursor */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full border border-[#BFDBFE] bg-[#EBF3FF] flex items-center justify-center text-[#1D4ED8] font-bold text-sm shrink-0 shadow-2xs">
                  <span>{effectiveActiveTeam.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 
                      id="tour-team-members-btn"
                      onClick={() => {
                        setShowTeamInfo(true);
                        if (activeFlow === 'team_details') {
                          advanceStep();
                        }
                      }}
                      className="text-base font-bold text-slate-900 truncate leading-tight cursor-pointer select-none inline-block hover:text-[#0070F3] transition-colors"
                      title="View team information"
                    >
                      {effectiveActiveTeam.name}
                    </h3>
                    <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0 ${
                      effectiveActiveTeam.status === 'Open'
                        ? 'bg-[#EBF3FF] text-[#1D4ED8] border border-[#BFDBFE]'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {effectiveActiveTeam.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-normal leading-snug">
                    {effectiveActiveTeam.hackathon} • {effectiveActiveTeam.members.length} members
                  </p>
                </div>
              </div>

              {/* Header Actions: Retain ONLY Request button (Option 2: Bottom Indicator & Border Accent Tab) */}
              <div className="flex items-center gap-2 shrink-0 mr-1.5">
                {teamHosts[effectiveActiveTeam.id] === 'me' && (
                  <button
                    onClick={() => {
                      setShowTeamInfo(false);
                      setActiveTab(activeTab === 'Requests' ? 'Chat' : 'Requests');
                    }}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 select-none active:scale-[0.98] cursor-pointer shadow-2xs shrink-0 ${
                      activeTab === 'Requests'
                        ? 'bg-white border border-slate-200 border-b-2 border-b-[#0070F3] text-slate-900 shadow-xs'
                        : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900'
                    }`}
                    title="Join Requests"
                  >
                    <Inbox className={`w-3.5 h-3.5 ${activeTab === 'Requests' ? 'text-[#0070F3]' : 'text-slate-500'}`} />
                    <span>Requests</span>
                    {pendingRequestsCount > 0 && (
                      <span className={`px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        activeTab === 'Requests'
                          ? 'bg-blue-50 text-[#0070F3] border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {pendingRequestsCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Main Area Content: Team Info View (Replaces Chat) OR Requests View OR Chat Stream */}
            {showTeamInfo ? (
              /* =========================================================================
                  TEAM INFORMATION VIEW (Displays in the main content area)
                  ========================================================================= */
              <div 
                key={`page-team-info-${effectiveActiveTeam.id}`}
                ref={teamInfoScrollRef}
                className="flex-1 min-h-0 flex flex-col bg-slate-50/50 overflow-y-auto p-6 md:p-8 no-scrollbar"
              >
                {/* Subtle Back Button in Corner of Main Content Area */}
                <div className="max-w-3xl mx-auto w-full mb-4 flex items-center justify-between">
                  <button
                    onClick={() => setShowTeamInfo(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Back to Chat"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Chat</span>
                  </button>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Profile & Management</span>
                </div>

                <div className="max-w-3xl mx-auto w-full space-y-4">
                  {/* 1. Team Logo & Name Section */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#EBF3FF] border-2 border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center text-3xl font-black shadow-xs mb-3">
                      <span>{effectiveActiveTeam.name.charAt(0)}</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                      {effectiveActiveTeam.name}
                    </h4>
                    <p className="text-sm font-medium text-slate-500 mb-2.5">
                      {effectiveActiveTeam.hackathon}
                    </p>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      effectiveActiveTeam.status === 'Open'
                        ? 'bg-[#EBF3FF] text-[#1D4ED8] border border-[#BFDBFE]'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {effectiveActiveTeam.status} Squad • {effectiveActiveTeam.members.length} Members
                    </span>
                  </div>

                  {/* 2. Team About & Goals Section */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">About & Goal</h5>
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {effectiveActiveTeam.description || 'Collaborating together for the hackathon showcase.'}
                    </p>
                  </div>

                  {/* 3. Members Section */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-bold text-slate-900">Squad Members</h5>
                      <span className="text-xs font-semibold text-slate-500">{effectiveActiveTeam.members.length} total</span>
                    </div>

                    <div className="space-y-2.5 divide-y divide-slate-100">
                      {effectiveActiveTeam.members
                        .filter(m => !(removedMembers[effectiveActiveTeam.id]?.has(m.id)))
                        .map((member, mIdx) => {
                          const isMemberHost = teamHosts[effectiveActiveTeam.id] === member.id;
                          const existingRating = submittedRatings[member.id];

                          return (
                            <div key={`${member.id}-${mIdx}`} className="pt-2.5 first:pt-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative shrink-0">
                                    <img 
                                      src={member.avatar} 
                                      alt={member.name} 
                                      className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                                    />
                                    {isMemberHost && (
                                      <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs">
                                        <Shield className="w-2.5 h-2.5" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {member.name} {member.id === 'me' && '(You)'}
                                      </p>
                                      {isMemberHost && (
                                        <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 text-[8.5px] font-black uppercase rounded tracking-wider border border-amber-200 shrink-0">
                                          Host
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{member.role}</p>
                                  </div>
                                </div>

                                {/* Right: Rating Button */}
                                {member.id !== 'me' && (
                                  <div className="shrink-0">
                                    {existingRating ? (
                                      <button
                                        onClick={() => { 
                                          setRatingTarget(member.id); 
                                          setRatingStars(existingRating.stars); 
                                          setRatingFeedback(existingRating.feedback); 
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-[#EBF3FF] rounded-lg border border-[#BFDBFE] text-xs font-bold text-[#1D4ED8] cursor-pointer shadow-2xs"
                                      >
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <span>{existingRating.stars}/5</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setRatingTarget(member.id)}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                                      >
                                        <Star className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Rate</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Skills chips */}
                              <div className="flex flex-wrap gap-1 mt-2 ml-13">
                                {member.skills.map((skill, sIdx) => (
                                  <span key={sIdx} className="px-2 py-0.5 bg-slate-100 border border-slate-200/60 text-[10px] font-medium text-slate-600 rounded-md">
                                    {skill}
                                  </span>
                                ))}
                              </div>

                              {/* Host Controls for other members */}
                              {teamHosts[effectiveActiveTeam.id] === 'me' && member.id !== 'me' && (
                                <div className="flex items-center gap-2 mt-2 ml-13">
                                  <button
                                    onClick={() => handleMakeHost(effectiveActiveTeam.id, member.id)}
                                    className="text-[10px] font-bold text-[#0070F3] hover:underline cursor-pointer"
                                  >
                                    Make Host
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <button
                                    onClick={() => setConfirmRemoveTarget(member.id)}
                                    className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}

                              {/* Remove confirmation */}
                              {confirmRemoveTarget === member.id && (
                                <div className="mt-2 ml-13 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1.5">
                                  <p className="text-xs font-semibold text-rose-700">Remove {member.name} from this squad?</p>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setConfirmRemoveTarget(null)}
                                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-medium"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => { handleRemoveMember(effectiveActiveTeam.id, member.id); setConfirmRemoveTarget(null); }}
                                      className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold"
                                    >
                                      Confirm Remove
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Inline Rating Modal */}
                              {ratingTarget === member.id && (
                                <div className="mt-2.5 ml-13 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase">Rate {member.name.split(' ')[0]}</span>
                                    <button onClick={() => setRatingTarget(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <button key={s} onClick={() => setRatingStars(s)}>
                                        <Star className={`w-5 h-5 ${s <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                      </button>
                                    ))}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Quick feedback (optional)..."
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#0070F3]"
                                    value={ratingFeedback}
                                    onChange={(e) => setRatingFeedback(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitRating()}
                                  />
                                  <button
                                    onClick={handleSubmitRating}
                                    className="w-full py-1.5 bg-[#0070F3] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                                  >
                                    Submit Rating
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* 4. Team Management & Exit Team (Side-by-Side Horizontal Layout) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Team Management */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Settings className="w-4 h-4 text-slate-600" />
                          <h5 className="text-sm font-bold text-slate-900">Team Management</h5>
                        </div>

                        {teamHosts[effectiveActiveTeam.id] === 'me' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">Recruitment Status:</span>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                                effectiveActiveTeam.status === 'Open'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${effectiveActiveTeam.status === 'Open' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {effectiveActiveTeam.status === 'Open' ? 'Open' : 'Closed'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {effectiveActiveTeam.status === 'Open' 
                                ? 'Accepting new member requests & invitations.' 
                                : 'Squad is finalized & closed to new applicants.'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            Only the squad host can manage recruitment status and permissions.
                          </p>
                        )}
                      </div>

                      {teamHosts[effectiveActiveTeam.id] === 'me' && (
                        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">Action:</span>
                          <button
                            onClick={() => {
                              const newStatus = effectiveActiveTeam.status === 'Open' ? 'Closed' : 'Open';
                              setTeams(prev => prev.map(t => t.id === effectiveActiveTeam.id ? { ...t, status: newStatus } : t));
                              setActiveTeam({ ...effectiveActiveTeam, status: newStatus });
                            }}
                            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border inline-flex items-center gap-2 cursor-pointer shadow-2xs select-none active:scale-[0.98] ${
                              effectiveActiveTeam.status === 'Open'
                                ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                                : 'bg-white border-blue-300 text-[#1D4ED8] hover:bg-blue-50'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${effectiveActiveTeam.status === 'Open' ? 'bg-amber-500' : 'bg-[#0070F3]'}`} />
                            <span>{effectiveActiveTeam.status === 'Open' ? 'Close Team' : 'Open Team'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Exit Team */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <LogOut className="w-4 h-4 text-red-500" />
                          <h5 className="text-sm font-bold text-slate-900">Exit Team</h5>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Leave this squad and give up your member seat. You will be removed from this squad and its chat history.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4">
                        {confirmExitTeam ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-red-600">Leave {effectiveActiveTeam.name}?</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setConfirmExitTeam(false)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleExitTeam}
                                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition-colors"
                              >
                                Yes, Leave
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => setConfirmExitTeam(true)}
                              className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-2xs select-none active:scale-[0.98]"
                              title="Exit Team"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Exit Team</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'Requests' ? (
              /* Requests View */
              <div 
                key={`page-requests-${effectiveActiveTeam.id}`}
                className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50/50"
              >
                <div className="px-6 py-3 bg-white border-b border-slate-200/90 flex items-center shrink-0">
                  <button
                    onClick={() => setActiveTab('Chat')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs select-none active:scale-[0.98]"
                    title="Return to Chat"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Return to Chat</span>
                  </button>
                </div>
                <TeamRequests
                  activeTeam={effectiveActiveTeam}
                  joinRequests={joinRequests}
                  handleAcceptRequest={handleAcceptRequest}
                  handleRejectRequest={handleRejectRequest}
                  setTeams={setTeams}
                />
              </div>
            ) : (
              /* Default Main Chat Stream */
              <div 
                key={`page-chat-${effectiveActiveTeam.id}`}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <TeamChat
                  activeTeam={effectiveActiveTeam}
                  teamMessages={teamMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  sendMessage={sendMessage}
                  chatEndRef={chatEndRef}
                  onDeleteMessage={(msgId, deleteType) => handleDeleteMessage?.(effectiveActiveTeam.id, msgId, deleteType, 'me')}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <p className="text-sm font-semibold">No team selected</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeamPortal;
