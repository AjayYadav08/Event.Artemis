import React from 'react';
import { Gift, Trophy, BadgeCheck } from 'lucide-react';
import { Prize } from '../types';
import { hasValue } from './eventDetailsUtils';

interface EventRewardsSectionProps {
  prizePool: string | null;
  prizesList: Prize[];
  otherRewards: string[];
  certification: boolean;
}

const EventRewardsSection: React.FC<EventRewardsSectionProps> = ({
  prizePool,
  prizesList,
  otherRewards,
  certification,
}) => {
  const validOtherRewards = otherRewards.filter((r) => hasValue(r));

  if (prizesList.length === 0 && !prizePool && validOtherRewards.length === 0 && !certification) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.16em] flex items-center gap-2">
          <Gift className="w-4 h-4 text-rose-500" /> Reward and Prizes
        </h2>
        {prizePool && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Total Pool: {prizePool}
          </span>
        )}
      </div>

      {prizesList.length > 0 && (
        <div className={`grid grid-cols-1 ${prizesList.length > 1 ? 'sm:grid-cols-2' : ''} gap-3.5`}>
          {prizesList.map((prize, index) => (
            <div key={index} className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${prize.color || 'from-amber-400 to-yellow-500'} opacity-15 rounded-bl-3xl`} />
              <div className="relative z-10">
                <h4 className="text-xl font-black text-slate-900">{prize.amount}</h4>
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide mt-0.5">{prize.title}</h5>
                {hasValue(prize.desc) && (
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{prize.desc}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(prizesList.length === 0 && prizePool) || certification || validOtherRewards.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {prizesList.length === 0 && prizePool && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Prize Pool</span>
                <span className="text-sm font-black text-slate-900">{prizePool}</span>
              </div>
            </div>
          )}

          {certification && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Certification</span>
                <span className="text-sm font-black text-slate-900">Official Certificate</span>
              </div>
            </div>
          )}

          {validOtherRewards.map((reward, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
              <Gift className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-slate-800">{reward}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default EventRewardsSection;

