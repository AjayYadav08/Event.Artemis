import React from 'react';
import { Timer } from 'lucide-react';
import { TimelineItem } from '../types';
import { hasValue } from './eventDetailsUtils';

interface EventTimelineSectionProps {
  timeline: TimelineItem[];
}

const EventTimelineSection: React.FC<EventTimelineSectionProps> = ({ timeline }) => {
  const validItems = timeline.filter((t) => hasValue(t.title) || hasValue(t.time));
  if (validItems.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.16em] border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
        <Timer className="w-4 h-4 text-blue-600" /> Timeline
      </h2>

      <div className="space-y-0 relative pl-2">
        <div className="absolute left-[13px] top-2 bottom-3 w-0.5 bg-slate-200" />
        {validItems.map((t, i) => (
          <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 shrink-0 ring-4 ring-blue-50 relative z-10" />
            <div>
              {hasValue(t.time) && (
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                  {t.time}
                </span>
              )}
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{t.title}</h4>
              {hasValue(t.desc) && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EventTimelineSection;

