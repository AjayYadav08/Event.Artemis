import React from 'react';
import { Info, CreditCard, Users, GraduationCap, Cpu, ListCheck } from 'lucide-react';
import { CampusEvent } from '../types';
import { hasValue } from './eventDetailsUtils';

interface EventAllAboutSectionProps {
  event: CampusEvent;
}

const EventAllAboutSection: React.FC<EventAllAboutSectionProps> = ({ event }) => {
  const description = hasValue(event.description)
    ? event.description
    : hasValue(event.shortDescription)
    ? event.shortDescription
    : null;

  const snapshotItems: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    {
      label: 'Registration Fee',
      value: event.isPaid ? (event.registrationFee || 'Paid') : 'Free',
      icon: <CreditCard className="w-3.5 h-3.5" />,
    },
    ...(hasValue(event.teamSize)
      ? [{ label: 'Team Size', value: event.teamSize, icon: <Users className="w-3.5 h-3.5" /> }]
      : []),
    ...(hasValue(event.eligibility)
      ? [{ label: 'Eligibility', value: event.eligibility, icon: <GraduationCap className="w-3.5 h-3.5" /> }]
      : []),
  ];

  const tracks = (event.tracks || []).filter((t) => hasValue(t));
  const rounds = (event.format?.rounds || []).filter((r) => hasValue(r));

  if (!description && snapshotItems.length === 0 && tracks.length === 0 && rounds.length === 0) {
    return null;
  }

  const snapshotGridCols =
    snapshotItems.length === 1
      ? 'grid-cols-1'
      : snapshotItems.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-3';

  return (
    <section
      id="tour-event-essentials"
      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5"
    >
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.16em] border-b border-slate-100 pb-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-600" /> All About
      </h2>

      {description && (
        <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed whitespace-pre-line">
          {description}
        </p>
      )}

      {snapshotItems.length > 0 && (
        <div className={`grid ${snapshotGridCols} gap-3`}>
          {snapshotItems.map((item) => (
            <div key={item.label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                {item.icon} {item.label}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="pt-1 space-y-2.5">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" /> Focus Tracks
          </h3>
          <div className="flex flex-wrap gap-2">
            {tracks.map((track) => (
              <span
                key={track}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-bold"
              >
                {track}
              </span>
            ))}
          </div>
        </div>
      )}

      {rounds.length > 0 && (
        <div className="pt-1 space-y-2.5">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ListCheck className="w-3.5 h-3.5 text-emerald-600" /> Rounds & Stages
          </h3>
          <div className="space-y-2">
            {rounds.map((round, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-700 border border-emerald-200 shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-700">{round}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default EventAllAboutSection;

