import React from 'react';
import { Link2, ExternalLink, Mail, Phone } from 'lucide-react';
import { ImportantLink } from '../types';

interface EventImportantLinksCardProps {
  eventTitle: string;
  links: ImportantLink[];
  contactEmail: string | null;
  contactPhone: string | null;
}

const EventImportantLinksCard: React.FC<EventImportantLinksCardProps> = ({
  eventTitle,
  links,
  contactEmail,
  contactPhone,
}) => {
  if (links.length === 0 && !contactEmail && !contactPhone) {
    return null;
  }

  return (
    <section className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-3">
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.16em] border-b border-slate-100 pb-3 flex items-center gap-2">
        <Link2 className="w-4 h-4 text-blue-600" /> Important Links
      </h2>

      {links.map((link, idx) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border text-xs font-bold transition-colors ${
            idx === 0
              ? 'bg-blue-50/80 border-blue-200/70 hover:bg-blue-100/80 text-blue-700'
              : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <span className="truncate">{link.label}</span>
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>
      ))}

      {contactEmail && (
        <a
          href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Query: ${eventTitle}`)}`}
          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
        >
          <span className="truncate">Official Inquiry Mail</span>
          <Mail className="w-4 h-4 text-slate-500 shrink-0" />
        </a>
      )}

      {contactPhone && (
        <a
          href={`tel:${contactPhone}`}
          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
        >
          <span className="truncate">Event Desk Helpline</span>
          <Phone className="w-4 h-4 text-slate-500 shrink-0" />
        </a>
      )}
    </section>
  );
};

export default EventImportantLinksCard;

