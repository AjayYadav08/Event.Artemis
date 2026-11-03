import React, { useState } from 'react';
import { Rocket, ChevronDown, Tag, Users, Calendar, Search, X } from 'lucide-react';

interface CreateTeamFormProps {
  availableEvents?: any[];
  setShowCreateTeamForm: (val: boolean) => void;
  newTeamData: { hackathon?: string; name: string; description: string; maxMembers: number };
  setNewTeamData: (data: any) => void;
  handleCreateTeam: () => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({
  availableEvents = [],
  newTeamData,
  setNewTeamData,
  handleCreateTeam
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = availableEvents.filter((e: any) => 
    e?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Integrated Header (Cancel button removed) */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-200/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center shadow-2xs">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create New Team</h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">Form your squad and launch your project.</p>
          </div>
        </div>
      </div>

      {/* Form Fields: Restored Target Event + Team Name + Capacity + Description */}
      <div className="space-y-5">
        {/* 1. Target Event (Restored Field) */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Target Event
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0070F3] focus:bg-white rounded-xl pl-3.5 pr-4 py-2.5 text-xs font-semibold text-left transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${newTeamData.hackathon ? 'bg-[#EBF3FF] text-[#1D4ED8]' : 'bg-slate-200/70 text-slate-400'}`}>
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className={`truncate ${newTeamData.hackathon ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}`}>
                  {newTeamData.hackathon || 'Select a Hackathon or Event'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {newTeamData.hackathon && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewTeamData({ ...newTeamData, hackathon: '' });
                    }}
                    className="p-1 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Clear selected event"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* 2. Team Name & 3. Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Team Name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="e.g. Neural Knights"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0070F3] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})}
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Capacity
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <select 
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0070F3] focus:bg-white rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-900 appearance-none outline-none transition-all shadow-2xs cursor-pointer"
                value={newTeamData.maxMembers}
                onChange={(e) => setNewTeamData({...newTeamData, maxMembers: parseInt(e.target.value)})}
              >
                {[2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} Members Max</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 4. Project Description */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Project Description
          </label>
          <textarea 
            rows={4}
            placeholder="What is your team building? (goals, tech stack, member expectations)"
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0070F3] focus:bg-white rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all resize-none shadow-2xs leading-relaxed"
            value={newTeamData.description}
            onChange={(e) => setNewTeamData({...newTeamData, description: e.target.value})}
          />
        </div>

        {/* Action Button (Cancel button removed, preserving recent design) */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button 
            type="button"
            onClick={handleCreateTeam}
            disabled={!newTeamData.name.trim()}
            className={`h-9 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs select-none active:scale-[0.98] ${
              newTeamData.name.trim()
                ? 'bg-[#0070F3] hover:bg-blue-600 text-white cursor-pointer shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch Team</span>
          </button>
        </div>
      </div>

      {/* Hackathon Selection Popup */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" 
            onClick={() => setIsPickerOpen(false)}
          />
          <div className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col">
            <div className="p-5 pb-3 bg-white border-b border-slate-100 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Event</h3>
                  <p className="text-[11px] text-slate-500">Choose a hackathon or campus event for your squad</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Search events by title or category..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0070F3] outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event: any) => (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => {
                      setNewTeamData({ ...newTeamData, hackathon: event.title });
                      setIsPickerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer border ${
                      newTeamData.hackathon === event.title
                        ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-100">
                      {event.posterUrl ? (
                        <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                          {event.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{event.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1D4ED8] border border-blue-100 uppercase tracking-wider shrink-0">
                          {event.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {event.date}
                        </span>
                        <span>•</span>
                        <span className={event.type === 'Live' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {event.type}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <p className="text-xs font-semibold">No events found matching "{searchQuery}"</p>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewTeamData({ ...newTeamData, hackathon: searchQuery.trim() });
                        setIsPickerOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0070F3] border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Use "{searchQuery.trim()}" as event
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTeamForm;
