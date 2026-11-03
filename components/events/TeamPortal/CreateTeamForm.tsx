import React from 'react';
import { Rocket, ChevronDown, Tag, Users } from 'lucide-react';

interface CreateTeamFormProps {
  setShowCreateTeamForm: (val: boolean) => void;
  newTeamData: { hackathon?: string; name: string; description: string; maxMembers: number };
  setNewTeamData: (data: any) => void;
  handleCreateTeam: () => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({
  newTeamData,
  setNewTeamData,
  handleCreateTeam
}) => {
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

      {/* Form Fields (Target Event section removed) */}
      <div className="space-y-5">
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

        {/* Project Description */}
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

        {/* Action Button (Cancel button removed) */}
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
    </div>
  );
};

export default CreateTeamForm;
