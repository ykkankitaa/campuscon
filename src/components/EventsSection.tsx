import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarPlus,
  Check,
  ClipboardList,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  AttendeeRecord,
  CampusEvent,
  EventFilterTab,
  Organization,
} from '../types';

interface EventsSectionProps {
  events: CampusEvent[];
  organizations: Organization[];
  loading: boolean;
  activeTab: EventFilterTab;
  onTabChange: (tab: EventFilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedOrgId: number | null;
  onClearOrgFilter: () => void;
  onQuickRegister: (eventId: number) => void;
  onRefresh: () => Promise<void>;
}

const CATEGORIES = ['All', 'Academic', 'Arts & Culture', 'Community', 'Technology'];

function formatEventWindow(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const datePart = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} · ${startTime} – ${endTime}`;
}

export function EventsSection({
  events,
  organizations,
  loading,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedOrgId,
  onClearOrgFilter,
  onQuickRegister,
  onRefresh,
}: EventsSectionProps) {
  const [category, setCategory] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [eventCategory, setEventCategory] = useState('Academic');
  const [status, setStatus] = useState<'upcoming' | 'ongoing'>('upcoming');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [description, setDescription] = useState('');

  const [rosterEvent, setRosterEvent] = useState<CampusEvent | null>(null);
  const [rosterRows, setRosterRows] = useState<AttendeeRecord[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const selectedOrg = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) || null,
    [organizations, selectedOrgId]
  );

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (activeTab !== 'all' && ev.status !== activeTab) return false;
      if (category !== 'All' && ev.category !== category) return false;
      if (selectedOrgId && ev.organizationId !== selectedOrgId) return false;
      if (q) {
        const hay = `${ev.title} ${ev.description} ${ev.venue} ${ev.organizationName} ${ev.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, activeTab, category, selectedOrgId, searchQuery]);

  const handleOpenCreate = () => {
    setCreateError(null);
    if (!organizationId && organizations.length > 0) {
      setOrganizationId(String(organizations[0].id));
    }
    setShowCreateForm((prev) => !prev);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: Number(organizationId),
          title,
          description,
          status,
          category: eventCategory,
          venue,
          startsAt,
          endsAt,
          capacity: Number(capacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data?.error || 'Unable to publish event.');
        return;
      }
      setTitle('');
      setVenue('');
      setStartsAt('');
      setEndsAt('');
      setDescription('');
      setShowCreateForm(false);
      await onRefresh();
    } catch {
      setCreateError('Network error while publishing event.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDeleteId(null);
        if (rosterEvent?.id === eventId) setRosterEvent(null);
        await onRefresh();
      }
    } catch {
      // ignore
    }
  };

  const handleOpenRoster = async (ev: CampusEvent) => {
    setRosterEvent(ev);
    setRosterLoading(true);
    setRosterError(null);
    try {
      const res = await fetch(`/api/events/${ev.id}/registrations`);
      const data = await res.json();
      if (!res.ok) {
        setRosterError(data?.error || 'Could not load roster.');
        setRosterRows([]);
      } else {
        setRosterRows(data.registrations || []);
      }
    } catch {
      setRosterError('Network error while loading attendee roster.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleToggleCheckin = async (regId: number) => {
    try {
      const res = await fetch(`/api/registrations/${regId}/checkin`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const data = await res.json();
        setRosterRows((prev) =>
          prev.map((row) =>
            row.id === regId ? { ...row, checkedIn: data.registration.checkedIn } : row
          )
        );
      }
    } catch {
      // ignore
    }
  };

  return (
    <section aria-labelledby="events-directory-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#DFC7AD] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            id="events-directory-heading"
            className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#5D1F18]"
          >
            Campus Events
          </h1>
          <p className="mt-1.5 text-sm text-[#6E4A3E]">
            Browse ongoing quad gatherings and upcoming club schedules across the semester.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#6E241C] px-5 py-2 text-sm font-semibold text-[#FFFBF4] transition-colors hover:bg-[#561B15] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C]"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            <span>{showCreateForm ? 'Close Event Form' : 'Host an Event'}</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateEvent}
          className="rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#5D1F18]">
              Publish a Campus Event
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              aria-label="Close form"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6E4A3E] hover:bg-[#F3E2CE]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="ev-title" className="block text-xs font-semibold text-[#4F2D23]">
                Event Title
              </label>
              <input
                id="ev-title"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autumn Sketchbook Walk"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ev-org" className="block text-xs font-semibold text-[#4F2D23]">
                Host Organization
              </label>
              <select
                id="ev-org"
                required
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ev-venue" className="block text-xs font-semibold text-[#4F2D23]">
                Venue
              </label>
              <input
                id="ev-venue"
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. North Quad Conservatory"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ev-status" className="block text-xs font-semibold text-[#4F2D23]">
                  Schedule State
                </label>
                <select
                  id="ev-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'upcoming' | 'ongoing')}
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-2.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">On-going</option>
                </select>
              </div>
              <div>
                <label htmlFor="ev-cat" className="block text-xs font-semibold text-[#4F2D23]">
                  Category
                </label>
                <select
                  id="ev-cat"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-2.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ev-cap" className="block text-xs font-semibold text-[#4F2D23]">
                  Capacity
                </label>
                <input
                  id="ev-cap"
                  type="number"
                  min={1}
                  max={5000}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3 py-2 text-sm text-[#3B1813] tabular-nums focus:border-[#6E241C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ev-start" className="block text-xs font-semibold text-[#4F2D23]">
                Starts At
              </label>
              <input
                id="ev-start"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ev-end" className="block text-xs font-semibold text-[#4F2D23]">
                Ends At
              </label>
              <input
                id="ev-end"
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ev-desc" className="block text-xs font-semibold text-[#4F2D23]">
              Description
            </label>
            <textarea
              id="ev-desc"
              rows={3}
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share agenda details, guest speakers, and what students should bring."
              className="mt-1 w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2.5 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
            />
          </div>

          {createError && (
            <div role="alert" className="text-xs font-medium text-[#7A1F14]">
              {createError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="min-h-[40px] rounded-full border border-[#CFAF8E] px-5 py-2 text-sm font-medium text-[#4F2D23] hover:bg-[#F3E2CE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="min-h-[40px] rounded-full bg-[#6E241C] px-6 py-2 text-sm font-semibold text-[#FFFBF4] hover:bg-[#561B15] disabled:opacity-60"
            >
              {creating ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      )}

      {/* Toolbar: Tabs + Category + Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Event status filter"
            className="inline-flex items-center gap-1 rounded-xl border border-[#DFC7AD] bg-[#F5E6D3] p-1"
          >
            {(
              [
                { id: 'all', label: 'All Events' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'ongoing', label: 'On-going' },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onTabChange(tab.id)}
                  className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#6E241C] text-[#FFFBF4]'
                      : 'text-[#5D372B] hover:text-[#3B1813]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-[40px] rounded-xl border border-[#D4B494] bg-[#FFFBF4] px-3.5 py-1.5 text-xs font-medium text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {selectedOrg && (
            <button
              type="button"
              onClick={onClearOrgFilter}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#D4B494] bg-[#FFFBF4] px-3 text-xs font-medium text-[#6E241C] hover:bg-[#F3E2CE]"
            >
              <span>Club: {selectedOrg.name}</span>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="relative w-full lg:w-72">
          <label htmlFor="events-search-input" className="sr-only">
            Search campus events
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D4B3B]"
            aria-hidden="true"
          />
          <input
            id="events-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, venues, clubs..."
            className="min-h-[40px] w-full rounded-full border border-[#D4B494] bg-[#FFFBF4] py-2 pl-10 pr-4 text-sm text-[#3B1813] placeholder:text-[#8E695B] focus:border-[#6E241C] focus:outline-none"
          />
        </div>
      </div>

      {/* Organizer Roster Drawer */}
      {rosterEvent && (
        <div className="rounded-2xl border border-[#CFAF8E] bg-[#FFFBF4] p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[#E8D4BE] pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#5D1F18]">
                Attendee Roster: {rosterEvent.title}
              </h2>
              <p className="mt-0.5 text-xs text-[#6E4A3E] tabular-nums">
                {rosterRows.length} registered attendees · Click check-in upon arrival
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRosterEvent(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6E4A3E] hover:bg-[#F3E2CE]"
              aria-label="Close attendee roster"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {rosterLoading ? (
            <p className="py-6 text-sm text-[#6E4A3E]">Loading attendee roster...</p>
          ) : rosterError ? (
            <p className="py-4 text-sm text-[#7A1F14]">{rosterError}</p>
          ) : rosterRows.length === 0 ? (
            <p className="py-6 text-sm text-[#6E4A3E]">
              No students have registered for this event yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8D4BE] text-xs font-semibold text-[#6E4A3E]">
                    <th className="py-2 pr-4">Student Name</th>
                    <th className="py-2 pr-4">Student ID</th>
                    <th className="py-2 pr-4">Pass Code</th>
                    <th className="py-2 text-right">Check-In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE0CC]">
                  {rosterRows.map((row) => (
                    <tr key={row.id} className="h-11">
                      <td className="py-2 pr-4 font-medium text-[#3B1813]">
                        {row.studentName}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-[#5D372B] tabular-nums">
                        {row.studentId}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-[#6E241C] tabular-nums">
                        {row.passCode}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckin(row.id)}
                          className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${
                            row.checkedIn
                              ? 'bg-[#E5F2E8] text-[#225730]'
                              : 'border border-[#D4B494] bg-[#FDF8F0] text-[#4F2D23] hover:bg-[#F3E2CE]'
                          }`}
                        >
                          {row.checkedIn && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                          <span>{row.checkedIn ? 'Checked In' : 'Mark Arrived'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-44 rounded-2xl border border-[#E5CEB4] bg-[#FFFBF4]/60 p-6"
            />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-10 text-center">
          <p className="font-serif text-xl font-semibold text-[#5D1F18]">
            No matching campus events
          </p>
          <p className="mt-1.5 text-sm text-[#6E4A3E]">
            Try clearing your search or switching between Upcoming and On-going events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredEvents.map((ev) => {
            const seatsLeft = Math.max(0, ev.capacity - ev.registeredCount);

            return (
              <article
                key={ev.id}
                className="flex flex-col justify-between rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-6 transition-colors hover:border-[#C9A481]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#7D4B3B]">
                    <span className="font-semibold text-[#C8521E]">
                      {ev.status === 'ongoing' ? 'On-going Now' : 'Upcoming'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{ev.organizationName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ev.category}</span>
                  </div>

                  <h2 className="mt-2 font-serif text-xl font-bold text-[#3B1813]">
                    {ev.title}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-[#5D372B]">
                    {ev.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-[#EFE0CC] pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-[#6E4A3E] tabular-nums space-y-0.5">
                    <div>{formatEventWindow(ev.startsAt, ev.endsAt)}</div>
                    <div>
                      {ev.venue} · {seatsLeft} of {ev.capacity} seats available
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenRoster(ev)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#CFAF8E] bg-[#FDF8F0] px-3.5 text-xs font-semibold text-[#4F2D23] hover:bg-[#F3E2CE] whitespace-nowrap shrink-0"
                    >
                      <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Roster</span>
                    </button>

                    {confirmDeleteId === ev.id ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-[#9E2A1F] px-3.5 text-xs font-semibold text-[#FFFBF4] whitespace-nowrap shrink-0"
                      >
                        Confirm Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(ev.id)}
                        aria-label={`Remove ${ev.title}`}
                        className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full border border-[#E5CEB4] text-[#7A1F14] hover:bg-[#FDECE8]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={seatsLeft === 0}
                      onClick={() => onQuickRegister(ev.id)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#6E241C] px-4 py-1.5 text-xs font-semibold text-[#FFFBF4] transition-colors hover:bg-[#561B15] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <span>{seatsLeft === 0 ? 'Full' : 'Register'}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
