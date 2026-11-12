import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CampusEvent } from '../types';
import { useTutorial } from '../../tutorial/TutorialContext';
import EventHeroSection from '../Details/EventHeroSection';
import EventImportantDatesCard from '../Details/EventImportantDatesCard';
import EventImportantLinksCard from '../Details/EventImportantLinksCard';
import EventContactOrganiserCard from '../Details/EventContactOrganiserCard';
import EventAllAboutSection from '../Details/EventAllAboutSection';
import EventTimelineSection from '../Details/EventTimelineSection';
import EventRewardsSection from '../Details/EventRewardsSection';
import { buildImportantLinks, getOfficialUrl, hasValue } from '../Details/eventDetailsUtils';

interface EventDetailsModalProps {
  exploringEvent: CampusEvent;
  closeExplorer: () => void;
  isExploringEventPast: boolean;
  isRegistered: boolean;
  setShowPeersModal: (val: boolean) => void;
  onRegisterClick: () => void;
  isInterested: boolean;
  toggleInterested: (id: string) => void;
  isNotInterested: boolean;
  markNotInterested: (id: string) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  exploringEvent,
  closeExplorer,
  isExploringEventPast,
  isRegistered,
  setShowPeersModal,
  onRegisterClick,
  isInterested,
  toggleInterested,
  isNotInterested,
  markNotInterested
}) => {
  const { startFlow } = useTutorial();

  React.useEffect(() => {
    startFlow('event_details');
  }, [startFlow]);

  const officialUrl = getOfficialUrl(exploringEvent);
  const importantLinks = buildImportantLinks(exploringEvent);

  const contactPhone = hasValue(exploringEvent.organizerContact?.phone)
    ? exploringEvent.organizerContact!.phone
    : null;
  const contactEmail = hasValue(exploringEvent.organizerContact?.email)
    ? exploringEvent.organizerContact!.email
    : null;
  const conductingAgency = hasValue(exploringEvent.conductingAgency)
    ? exploringEvent.conductingAgency
    : null;
  const venueDetails =
    hasValue(exploringEvent.venueDetails) &&
    exploringEvent.venueDetails.trim() !== (exploringEvent.location || '').trim()
      ? exploringEvent.venueDetails
      : null;

  const handleRegisterAction = () => {
    if (isExploringEventPast) return;
    if (isRegistered) {
      setShowPeersModal(true);
      return;
    }
    if (officialUrl) {
      window.open(officialUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onRegisterClick();
  };

  const hasAllAbout = Boolean(
    hasValue(exploringEvent.description) ||
      hasValue(exploringEvent.shortDescription) ||
      hasValue(exploringEvent.teamSize) ||
      hasValue(exploringEvent.eligibility) ||
      exploringEvent.tracks?.some((t) => hasValue(t)) ||
      exploringEvent.format?.rounds?.some((r) => hasValue(r)) ||
      exploringEvent.isPaid !== undefined
  );
  const hasTimeline = Boolean(
    exploringEvent.timeline?.some((t) => hasValue(t.title) || hasValue(t.time))
  );
  const prizePool = hasValue(exploringEvent.prizePool) ? exploringEvent.prizePool : null;
  const hasRewards = Boolean(
    (exploringEvent.prizesList?.length ?? 0) > 0 ||
      prizePool ||
      exploringEvent.otherRewards?.some((r) => hasValue(r)) ||
      exploringEvent.certification
  );
  const hasRightColumn = hasAllAbout || hasTimeline || hasRewards;

  return (
    <div
      id="tour-event-overview"
      className="absolute inset-0 z-40 bg-slate-50 overflow-y-auto font-sans animate-details-in"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes detailsIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-details-in {
          animation: detailsIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}} />

      {/* Top Sticky Bar with Back option on Top-Left */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-10 lg:px-12 py-3.5 flex items-center gap-3">
        <button
          id="modal-close-button"
          onClick={(e) => { e.stopPropagation(); closeExplorer(); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shrink-0"
          title="Back to Events (Esc)"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-bold text-slate-500 truncate">
          {exploringEvent.title}
        </span>
      </div>

      {/* Main Scrollable Content */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-7 pb-20 space-y-6">

        {/* 1. First Section: Outside Event Card Summary + Cover Image + Primary Actions */}
        <EventHeroSection
          event={exploringEvent}
          isPast={isExploringEventPast}
          isRegistered={isRegistered}
          isInterested={isInterested}
          isNotInterested={isNotInterested}
          officialUrl={officialUrl}
          conductingAgency={conductingAgency}
          onRegisterAction={handleRegisterAction}
          toggleInterested={toggleInterested}
          markNotInterested={markNotInterested}
        />

        {/* 2. Flexible 2-Column Layout */}
        <div className={`grid grid-cols-1 ${hasRightColumn ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
          {/* Leftmost Column: Important Dates -> Important Links -> Contact Organiser */}
          <aside className={`${hasRightColumn ? 'lg:col-span-4 lg:sticky lg:top-20' : ''} space-y-5`}>
            <EventImportantDatesCard event={exploringEvent} isPast={isExploringEventPast} />

            <EventImportantLinksCard
              eventTitle={exploringEvent.title}
              links={importantLinks}
              contactEmail={contactEmail}
              contactPhone={contactPhone}
            />

            <EventContactOrganiserCard
              conductingAgency={conductingAgency}
              contactPhone={contactPhone}
              contactEmail={contactEmail}
              venueDetails={venueDetails}
            />
          </aside>

          {/* Right Main Column: All About -> Timeline -> Reward and Prizes */}
          {hasRightColumn && (
            <div className="lg:col-span-8 space-y-6">
              <EventAllAboutSection event={exploringEvent} />
              <EventTimelineSection timeline={exploringEvent.timeline || []} />
              <EventRewardsSection
                prizePool={prizePool}
                prizesList={exploringEvent.prizesList || []}
                otherRewards={exploringEvent.otherRewards || []}
                certification={exploringEvent.certification}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EventDetailsModal);
