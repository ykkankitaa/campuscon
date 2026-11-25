import React, { useMemo, useState } from 'react';
import { ArrowRight, Plus, Search, X } from 'lucide-react';
import { Organization } from '../types';

interface OrganizationsSectionProps {
  organizations: Organization[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectOrgEvents: (orgId: number) => void;
  onRefresh: () => Promise<void>;
}

const ORG_CATEGORIES = ['All', 'Academic', 'Arts & Culture', 'Community', 'Technology'];

export function OrganizationsSection({
  organizations,
  loading,
  searchQuery,
  onSearchChange,
  onSelectOrgEvents,
  onRefresh,
}: OrganizationsSectionProps) {
  const [category, setCategory] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [orgCategory, setOrgCategory] = useState('Academic');
  const [location, setLocation] = useState('');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');

  const filteredOrgs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return organizations.filter((org) => {
      if (category !== 'All' && org.category !== category) return false;
      if (q) {
        const hay = `${org.name} ${org.description} ${org.location} ${org.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [organizations, category, searchQuery]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setSubmitting(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category: orgCategory,
          location,
          meetingSchedule,
          contactEmail,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not register organization.');
        return;
      }
      setName('');
      setLocation('');
      setMeetingSchedule('');
      setContactEmail('');
      setDescription('');
      setShowCreateForm(false);
      await onRefresh();
    } catch {
      setError('Network error while creating organization.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="orgs-directory-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#DFC7AD] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            id="orgs-directory-heading"
            className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#5D1F18]"
          >
            Student Organizations
          </h1>
          <p className="mt-1.5 text-sm text-[#6E4A3E]">
            Discover collegiate clubs, academic unions, and creative societies across campus.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowCreateForm((prev) => !prev);
            }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#6E241C] px-5 py-2 text-sm font-semibold text-[#FFFBF4] transition-colors hover:bg-[#561B15] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{showCreateForm ? 'Close Form' : 'Register Organization'}</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateOrg}
          className="rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#5D1F18]">
              Register a Campus Organization
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
              <label htmlFor="org-name" className="block text-xs font-semibold text-[#4F2D23]">
                Organization Name
              </label>
              <input
                id="org-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Campus Film Archive"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="org-cat" className="block text-xs font-semibold text-[#4F2D23]">
                Category
              </label>
              <select
                id="org-cat"
                value={orgCategory}
                onChange={(e) => setOrgCategory(e.target.value)}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              >
                {ORG_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="org-loc" className="block text-xs font-semibold text-[#4F2D23]">
                Campus Location
              </label>
              <input
                id="org-loc"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Student Union Room 302"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="org-sched" className="block text-xs font-semibold text-[#4F2D23]">
                Meeting Schedule
              </label>
              <input
                id="org-sched"
                type="text"
                required
                value={meetingSchedule}
                onChange={(e) => setMeetingSchedule(e.target.value)}
                placeholder="e.g. Fridays · 4:00 PM"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="org-email" className="block text-xs font-semibold text-[#4F2D23]">
                Contact Email
              </label>
              <input
                id="org-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="club@campusconnect.edu"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="org-desc" className="block text-xs font-semibold text-[#4F2D23]">
              Mission & Activities
            </label>
            <textarea
              id="org-desc"
              rows={3}
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your club's weekly gatherings, open membership, and semester projects."
              className="mt-1 w-full rounded-xl border border-[#D4B494] bg-[#FDF8F0] px-3.5 py-2.5 text-sm text-[#3B1813] focus:border-[#6E241C] focus:outline-none"
            />
          </div>

          {error && (
            <div role="alert" className="text-xs font-medium text-[#7A1F14]">
              {error}
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
              disabled={submitting}
              className="min-h-[40px] rounded-full bg-[#6E241C] px-6 py-2 text-sm font-semibold text-[#FFFBF4] hover:bg-[#561B15] disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Organization'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#DFC7AD] bg-[#F5E6D3] p-1">
          {ORG_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#6E241C] text-[#FFFBF4]'
                    : 'text-[#5D372B] hover:text-[#3B1813]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <label htmlFor="orgs-search-input" className="sr-only">
            Search organizations
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D4B3B]"
            aria-hidden="true"
          />
          <input
            id="orgs-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clubs or locations..."
            className="min-h-[40px] w-full rounded-full border border-[#D4B494] bg-[#FFFBF4] py-2 pl-10 pr-4 text-sm text-[#3B1813] placeholder:text-[#8E695B] focus:border-[#6E241C] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-48 rounded-2xl border border-[#E5CEB4] bg-[#FFFBF4]/60 p-6"
            />
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-10 text-center">
          <p className="font-serif text-xl font-semibold text-[#5D1F18]">
            No matching campus organizations
          </p>
          <p className="mt-1.5 text-sm text-[#6E4A3E]">
            Try selecting All categories or adjusting your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrgs.map((org) => (
            <article
              key={org.id}
              className="flex flex-col justify-between rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-6"
            >
              <div>
                <div className="text-xs font-medium text-[#7D4B3B] tabular-nums">
                  <span>{org.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{org.memberCount} members</span>
                </div>

                <h2 className="mt-2 font-serif text-xl font-bold text-[#3B1813]">
                  {org.name}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#5D372B]">
                  {org.description}
                </p>
              </div>

              <div className="mt-5 border-t border-[#EFE0CC] pt-4 space-y-3">
                <div className="text-xs text-[#6E4A3E] space-y-0.5">
                  <div>{org.location}</div>
                  <div>{org.meetingSchedule}</div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#7D4B3B] tabular-nums">
                    {org.eventCount} {org.eventCount === 1 ? 'event' : 'events'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectOrgEvents(org.id)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-[#6E241C] hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>View Events</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
