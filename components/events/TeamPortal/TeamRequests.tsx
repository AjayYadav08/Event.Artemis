import React, { useState, useMemo } from 'react';
import { UserPlus, X, Check, Search, Send, CheckCircle2, Clock, Users } from 'lucide-react';
import { Team, JoinRequest } from '../types';

export interface CandidateUser {
  id: string;
  name: string;
  role: string;
  skills: string[];
  avatar: string;
}

export const CANDIDATE_POOL: CandidateUser[] = [
  { id: 'p1', name: 'Zoe Kravitz', role: 'Full-Stack Developer', skills: ['FastAPI', 'React', 'TypeScript'], avatar: 'https://i.pravatar.cc/150?img=32' },
  { id: 'p2', name: 'Robert Pattinson', role: 'DevOps & Cloud Engineer', skills: ['Docker', 'AWS', 'Kubernetes'], avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 'p3', name: 'Lily Rose', role: 'UI/UX Designer', skills: ['Figma', 'Design Systems', 'Tailwind'], avatar: 'https://i.pravatar.cc/150?img=25' },
  { id: 'p4', name: 'Timothee Chalamet', role: 'AI / ML Engineer', skills: ['PyTorch', 'Transformers', 'Python'], avatar: 'https://i.pravatar.cc/150?img=18' },
  { id: 'm2', name: 'Sarah Chen', role: 'SecDev & Systems Lead', skills: ['Go', 'PostgreSQL', 'Cryptography'], avatar: 'https://i.pravatar.cc/150?img=45' },
  { id: 'u1', name: 'Mike Ross', role: 'High-Perf Systems Dev', skills: ['Rust', 'C++', 'gRPC'], avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: 'u2', name: 'Elena Gilbert', role: 'Product Strategist', skills: ['Analytics', 'Growth', 'User Research'], avatar: 'https://i.pravatar.cc/150?img=22' },
  { id: 'm4', name: 'Alice Smith', role: 'Security Analyst', skills: ['Pen-testing', 'Auth', 'Wireshark'], avatar: 'https://i.pravatar.cc/150?img=23' },
];

export interface SentInvitation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: string;
  message: string;
  sentAt: string;
  status: 'Pending' | 'Accepted' | 'Declined';
}

interface TeamRequestsProps {
  activeTeam: Team;
  joinRequests: Record<string, JoinRequest[]>;
  handleAcceptRequest: (request: JoinRequest) => void;
  handleRejectRequest: (request: JoinRequest) => void;
}

const TeamRequests: React.FC<TeamRequestsProps> = ({
  activeTeam,
  joinRequests,
  handleAcceptRequest,
  handleRejectRequest
}) => {
  const currentRequests = joinRequests[activeTeam.id] || [];
  const pendingRequests = currentRequests.filter(r => r.status === 'Pending');
  const historyRequests = currentRequests.filter(r => r.status !== 'Pending');

  // Invitation flow state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [inviteSearch, setInviteSearch] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sentInvitesByTeam, setSentInvitesByTeam] = useState<Record<string, SentInvitation[]>>({});
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Eligible users: filter out anyone already in the team or 'me'
  const existingMemberIds = useMemo(() => {
    return new Set((activeTeam.members || []).map(m => m.id));
  }, [activeTeam.members]);

  const teamSentInvites = sentInvitesByTeam[activeTeam.id] || [];
  const sentUserIds = useMemo(() => {
    return new Set(teamSentInvites.map(inv => inv.userId));
  }, [teamSentInvites]);

  const eligibleUsers = useMemo(() => {
    return CANDIDATE_POOL.filter(user => {
      if (user.id === 'me' || existingMemberIds.has(user.id) || sentUserIds.has(user.id)) {
        return false;
      }
      if (!inviteSearch.trim()) return true;
      const q = inviteSearch.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        user.skills.some(s => s.toLowerCase().includes(q))
      );
    });
  }, [existingMemberIds, sentUserIds, inviteSearch]);

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSendInvitations = () => {
    if (selectedUserIds.size === 0) return;

    const selectedUsers = CANDIDATE_POOL.filter(u => selectedUserIds.has(u.id));
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newInvites: SentInvitation[] = selectedUsers.map(user => ({
      id: `inv-${Date.now()}-${user.id}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userRole: user.role,
      message: customMessage.trim() || `Hey ${user.name}! We'd love to have you on board with ${activeTeam.name} for our project.`,
      sentAt: `Today, ${timeStr}`,
      status: 'Pending'
    }));

    setSentInvitesByTeam(prev => ({
      ...prev,
      [activeTeam.id]: [...(prev[activeTeam.id] || []), ...newInvites]
    }));

    const count = selectedUsers.length;
    const names = selectedUsers.map(u => u.name).join(', ');
    setSuccessBanner(`Successfully sent ${count} invitation${count > 1 ? 's' : ''} to ${names}`);
    setSelectedUserIds(new Set());
    setCustomMessage('');
    setIsAddingMember(false);
    setInviteSearch('');

    // Clear feedback banner after 5 seconds
    setTimeout(() => {
      setSuccessBanner(null);
    }, 5000);
  };

  const selectedUsersList = useMemo(() => {
    return CANDIDATE_POOL.filter(u => selectedUserIds.has(u.id));
  }, [selectedUserIds]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 max-w-4xl mx-auto w-full no-scrollbar">
      
      {/* Visual Feedback Confirmation Banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-semibold">{successBanner}</p>
          </div>
          <button 
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: PENDING REQUESTS (Preserved existing functionality)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Pending Requests</h4>
            <p className="text-[11px] text-slate-500 font-medium">Users requesting to join {activeTeam.name}</p>
          </div>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              {pendingRequests.length} Pending
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2.5 text-slate-400">
                <Users className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-slate-800 mb-0.5">No pending requests</h5>
              <p className="text-[11px] text-slate-400 max-w-xs">When candidates submit requests to join this squad, they will appear here for review.</p>
            </div>
          ) : (
            pendingRequests.map(request => (
              <div key={request.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img src={request.userAvatar} alt={request.userName} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{request.userName}</h5>
                        {request.id.startsWith('req-sample') && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            Demo Sample
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">{request.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleRejectRequest(request)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Decline request"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button 
                      onClick={() => handleAcceptRequest(request)}
                      className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                      title="Accept into squad"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{request.message}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: INVITE OTHERS (New Section)
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Invite Others</h4>
            <p className="text-[11px] text-slate-500 font-medium">Recruit available developers to join your squad</p>
          </div>

          {!isAddingMember && (
            <button
              onClick={() => setIsAddingMember(true)}
              className="h-9 px-4 rounded-xl bg-[#0070F3] hover:bg-blue-600 text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-2xs select-none active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>

        {/* Member Selection Interface */}
        {isAddingMember ? (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
            
            {/* Search Input for candidates */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates by name, role, or tech stack..."
                value={inviteSearch}
                onChange={e => setInviteSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0070F3] transition-all"
              />
              {inviteSearch && (
                <button
                  onClick={() => setInviteSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List / Grid of Eligible Users */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Available Candidates ({eligibleUsers.length})
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedUserIds.size} selected
                </span>
              </div>

              {eligibleUsers.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">No available developers match your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {eligibleUsers.map(user => {
                    const isSelected = selectedUserIds.has(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleSelectUser(user.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                          isSelected
                            ? 'bg-[#EBF3FF] border-[#0070F3] shadow-2xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 truncate">{user.role}</p>
                            <div className="flex items-center gap-1 mt-1 overflow-hidden">
                              {user.skills.slice(0, 2).map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[9px] font-semibold px-1.5 py-0.2 bg-white/80 border border-slate-200 rounded text-slate-600 truncate"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Checkbox Selection Indicator */}
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#0070F3] border-[#0070F3] text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Recipient Chips */}
            {selectedUsersList.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Selected Recipients ({selectedUsersList.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUsersList.map(user => (
                    <div
                      key={user.id}
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-blue-50 border border-blue-200 text-[#1D4ED8] rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{user.name}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleSelectUser(user.id);
                        }}
                        className="text-blue-400 hover:text-blue-700 ml-0.5 p-0.5 rounded-full hover:bg-blue-100"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Invitation Message Box */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Invitation Message
              </label>
              <textarea
                rows={2}
                placeholder={`Hey! We'd love for you to join ${activeTeam.name} to collaborate on our hackathon project together.`}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0070F3] transition-all resize-none"
              />
            </div>

            {/* Action Buttons: Cancel & Send Invitations */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setIsAddingMember(false);
                  setSelectedUserIds(new Set());
                  setCustomMessage('');
                  setInviteSearch('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={selectedUserIds.size === 0}
                onClick={handleSendInvitations}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-2xs select-none active:scale-[0.98] ${
                  selectedUserIds.size > 0
                    ? 'bg-[#0070F3] hover:bg-blue-600 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {selectedUserIds.size > 0
                    ? `Send Invitations (${selectedUserIds.size})`
                    : 'Send Invitations'}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Sent Invitations List (if any invitations have been sent for this team) */}
        {teamSentInvites.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Outgoing Invitations ({teamSentInvites.length})
            </h5>
            <div className="space-y-2">
              {teamSentInvites.map(inv => (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={inv.userAvatar} alt={inv.userName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{inv.userName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{inv.userRole}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{inv.sentAt}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Sent</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: REQUEST HISTORY (Preserved existing functionality)
          ========================================================================= */}
      {historyRequests.length > 0 && (
        <div className="pt-2 border-t border-slate-200/80">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Request History</h4>
          <div className="space-y-2">
            {historyRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <img src={request.userAvatar} alt={request.userName} className="w-7 h-7 rounded-lg object-cover grayscale opacity-80" />
                  <span className="text-xs font-bold text-slate-700">{request.userName}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  request.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamRequests;