import React from 'react';
import { Phone, Mail, Building2, MapPin } from 'lucide-react';

interface EventContactOrganiserCardProps {
  conductingAgency: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  venueDetails: string | null;
}

const EventContactOrganiserCard: React.FC<EventContactOrganiserCardProps> = ({
  conductingAgency,
  contactPhone,
  contactEmail,
  venueDetails,
}) => {
  if (!conductingAgency && !contactPhone && !contactEmail && !venueDetails) {
    return null;
  }

  return (
    <section className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-3">
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.16em] border-b border-slate-100 pb-3 flex items-center gap-2">
        <Phone className="w-4 h-4 text-blue-600" /> Contact Organiser
      </h2>

      {conductingAgency && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Organised By</span>
            <span className="text-xs font-bold text-slate-800 block">{conductingAgency}</span>
          </div>
        </div>
      )}

      {contactPhone && (
        <a
          href={`tel:${contactPhone}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 transition-colors"
        >
          <Phone className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
            <span className="text-xs font-bold text-slate-800 truncate block">{contactPhone}</span>
          </div>
        </a>
      )}

      {contactEmail && (
        <a
          href={`mailto:${contactEmail}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 transition-colors"
        >
          <Mail className="w-4 h-4 text-rose-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
            <span className="text-xs font-bold text-slate-800 truncate block">{contactEmail}</span>
          </div>
        </a>
      )}

      {venueDetails && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Venue</span>
            <span className="text-xs font-semibold text-slate-700 leading-relaxed block">
              {venueDetails}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default EventContactOrganiserCard;

