import { ArrowRight } from 'lucide-react';
import { MapleDivider } from './AutumnBotanicals';

interface AboutSectionProps {
  organizationCount: number;
  upcomingCount: number;
  ongoingCount: number;
  onRegisterClick: () => void;
}

export function AboutSection({
  organizationCount,
  upcomingCount,
  ongoingCount,
  onRegisterClick,
}: AboutSectionProps) {
  return (
    <section aria-labelledby="about-heading" className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-8 sm:p-12 text-center">
        <h1
          id="about-heading"
          className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#5D1F18] [text-wrap:balance]"
        >
          About Campus Connect
        </h1>
        <MapleDivider />
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#5D372B]">
          Campus Connect brings together student societies, courtyard gatherings, and academic symposiums in one shared autumn-to-spring calendar. Students register with their campus ID in seconds, while student organizers manage live rosters and venue check-ins.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-b border-[#E8D4BE] py-6 sm:grid-cols-3">
          <div>
            <div className="font-serif text-3xl font-bold text-[#6E241C] tabular-nums">
              {organizationCount}
            </div>
            <div className="mt-1 text-xs font-medium text-[#6E4A3E]">
              Active Campus Organizations
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-[#6E241C] tabular-nums">
              {ongoingCount}
            </div>
            <div className="mt-1 text-xs font-medium text-[#6E4A3E]">
              Live On-going Gatherings
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-[#6E241C] tabular-nums">
              {upcomingCount}
            </div>
            <div className="mt-1 text-xs font-medium text-[#6E4A3E]">
              Upcoming Semester Events
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
          <div className="space-y-1.5">
            <h2 className="font-serif text-lg font-bold text-[#3B1813]">
              01. Instant Student Registration
            </h2>
            <p className="text-sm leading-relaxed text-[#5D372B]">
              Enter your name, student ID, and event selection to receive a verified pass code without waiting in courtyard lines.
            </p>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-lg font-bold text-[#3B1813]">
              02. Organizer Roster & Check-In
            </h2>
            <p className="text-sm leading-relaxed text-[#5D372B]">
              Club organizers can publish new events, track capacity in real time, and check in arriving attendees directly from the Events roster.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={onRegisterClick}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#6E241C] px-7 py-2.5 text-sm font-semibold text-[#FFFBF4] transition-colors hover:bg-[#561B15]"
          >
            <span>Register for an Event</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
