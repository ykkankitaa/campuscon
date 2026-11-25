import { ArrowRight, Calendar, Megaphone, Search, Users } from 'lucide-react';
import { CampusEvent, EventFilterTab } from '../types';
import { CampusTowerBackdrop, MapleDivider } from './AutumnBotanicals';

interface OrganizationSpotlightProps {
  events: CampusEvent[];
  organizationCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenEventsTab: (tab: EventFilterTab) => void;
  onOpenOrganizations: () => void;
}

export function OrganizationSpotlight({
  events,
  organizationCount,
  searchQuery,
  onSearchChange,
  onOpenEventsTab,
  onOpenOrganizations,
}: OrganizationSpotlightProps) {
  const upcomingCount = events.filter((ev) => ev.status === 'upcoming').length;
  const ongoingCount = events.filter((ev) => ev.status === 'ongoing').length;

  return (
    <section
      aria-labelledby="organization-heading"
      className="relative overflow-hidden rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-6 sm:p-10 shadow-sm flex flex-col justify-between"
    >
      <div className="pointer-events-none absolute -bottom-2 -right-4 h-56 w-64">
        <CampusTowerBackdrop />
      </div>

      <div className="relative z-10">
        <div className="flex justify-end">
          <div className="relative w-full sm:w-72">
            <label htmlFor="home-campus-search" className="sr-only">
              Search events and organizations
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D4B3B]"
              aria-hidden="true"
            />
            <input
              id="home-campus-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search events or clubs..."
              className="min-h-[40px] w-full rounded-full border border-[#D4B494] bg-[#FDF8F0] py-2 pl-10 pr-4 text-sm text-[#3B1813] placeholder:text-[#8E695B] transition-colors focus:border-[#6E241C] focus:bg-[#FFFBF4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E241C]/25"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <h2
            id="organization-heading"
            className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#5D1F18] [text-wrap:balance]"
          >
            Organization
          </h2>

          <MapleDivider />

          <p className="mx-auto max-w-md text-sm text-[#6E4A3E]">
            Explore student-led societies, live quad gatherings, and upcoming semester gatherings.
          </p>
        </div>

        <div className="mx-auto mt-7 max-w-md space-y-3.5">
          <button
            type="button"
            onClick={() => onOpenEventsTab('upcoming')}
            className="group flex min-h-[64px] w-full items-center justify-between rounded-2xl border border-[#D4B494] bg-[#FDF8F0] px-5 py-3.5 text-left transition-colors duration-150 hover:border-[#6E241C] hover:bg-[#F7EBDC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2DEC6] text-[#6E241C]">
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-[#3B1813]">
                  Upcoming Event
                </div>
                <div className="text-xs text-[#6E4A3E] tabular-nums">
                  {upcomingCount} scheduled {upcomingCount === 1 ? 'event' : 'events'}
                </div>
              </div>
            </div>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-[#6E241C] transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => onOpenEventsTab('ongoing')}
            className="group flex min-h-[64px] w-full items-center justify-between rounded-2xl border border-[#D4B494] bg-[#FDF8F0] px-5 py-3.5 text-left transition-colors duration-150 hover:border-[#6E241C] hover:bg-[#F7EBDC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2DEC6] text-[#6E241C]">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-[#3B1813]">
                  On-going Events
                </div>
                <div className="text-xs text-[#6E4A3E] tabular-nums">
                  {ongoingCount} happening now across campus
                </div>
              </div>
            </div>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-[#6E241C] transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={onOpenOrganizations}
            className="group flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-[#E5CEB4] bg-transparent px-5 py-3 text-left transition-colors duration-150 hover:border-[#6E241C] hover:bg-[#FDF8F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7EBDC] text-[#6E241C]">
                <Users className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#3B1813]">
                  Campus Directory
                </div>
                <div className="text-xs text-[#6E4A3E] tabular-nums">
                  {organizationCount} active student organizations
                </div>
              </div>
            </div>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-[#6E241C] transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
