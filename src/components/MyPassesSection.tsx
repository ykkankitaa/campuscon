import React, { useState } from 'react';
import { Copy, Search, Ticket, Trash2 } from 'lucide-react';
import { EventRegistration } from '../types';

interface MyPassesSectionProps {
  passes: EventRegistration[];
  loading: boolean;
  onLookupByStudentId: (studentId: string) => Promise<void>;
  onCancelPass: (registrationId: number, studentId: string) => Promise<void>;
  onBrowseEvents: () => void;
}

export function MyPassesSection({
  passes,
  loading,
  onLookupByStudentId,
  onCancelPass,
  onBrowseEvents,
}: MyPassesSectionProps) {
  const [lookupId, setLookupId] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const cleaned = lookupId.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,24}$/.test(cleaned)) {
      setLookupError('Enter a valid Student ID (3 to 24 letters, numbers, or hyphens).');
      return;
    }
    await onLookupByStudentId(cleaned);
  };

  const handleCopy = async (id: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleConfirmCancel = async (pass: EventRegistration) => {
    setCancellingId(pass.id);
    try {
      await onCancelPass(pass.id, pass.studentId);
      setConfirmCancelId(null);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section aria-labelledby="passes-heading" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#DFC7AD] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            id="passes-heading"
            className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#5D1F18]"
          >
            My Campus Passes
          </h1>
          <p className="mt-1.5 text-sm text-[#6E4A3E]">
            Look up your passes by Student ID or view registrations issued during this visit.
          </p>
        </div>

        <form onSubmit={handleLookupSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <label htmlFor="pass-lookup-id" className="sr-only">
              Student ID
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D4B3B]"
              aria-hidden="true"
            />
            <input
              id="pass-lookup-id"
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Student ID (e.g. CC-2026-0412)"
              className="min-h-[40px] w-60 rounded-full border border-[#D4B494] bg-[#FFFBF4] py-2 pl-10 pr-4 text-sm text-[#3B1813] placeholder:text-[#8E695B] focus:border-[#6E241C] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#6E241C] px-5 py-2 text-sm font-semibold text-[#FFFBF4] transition-colors hover:bg-[#561B15] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? 'Searching...' : 'Find Passes'}
          </button>
        </form>
      </div>

      {lookupError && (
        <div
          role="alert"
          className="rounded-xl border border-[#C84B31]/40 bg-[#FDECE8] px-4 py-2.5 text-xs font-medium text-[#7A1F14]"
        >
          {lookupError}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-40 rounded-2xl border border-[#E5CEB4] bg-[#FFFBF4]/60 p-6"
            />
          ))}
        </div>
      ) : passes.length === 0 ? (
        <div className="rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-10 text-center">
          <Ticket className="mx-auto h-8 w-8 text-[#C8521E]" aria-hidden="true" />
          <h2 className="mt-3 font-serif text-xl font-semibold text-[#5D1F18]">
            No event passes yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[#6E4A3E]">
            Register for an upcoming or ongoing campus gathering or enter your Student ID above to retrieve existing passes.
          </p>
          <button
            type="button"
            onClick={onBrowseEvents}
            className="mt-5 inline-flex min-h-[40px] items-center rounded-full bg-[#6E241C] px-6 py-2 text-sm font-semibold text-[#FFFBF4] hover:bg-[#561B15]"
          >
            Browse Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {passes.map((pass) => {
            const eventDate = new Date(pass.eventStartsAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <article
                key={pass.id}
                className="flex flex-col justify-between rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#7D4B3B]">
                      {pass.organizationName} ·{' '}
                      {pass.checkedIn ? 'Checked In' : 'Confirmed Pass'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pass.id, pass.passCode)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#6E241C] hover:underline tabular-nums whitespace-nowrap shrink-0"
                    >
                      <span>{pass.passCode}</span>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{copiedId === pass.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <h2 className="mt-2 font-serif text-xl font-bold text-[#3B1813]">
                    {pass.eventTitle}
                  </h2>

                  <div className="mt-3 text-sm text-[#5D372B] space-y-1 tabular-nums">
                    <div>
                      Attendee: <span className="font-medium">{pass.studentName}</span> ({pass.studentId})
                    </div>
                    <div className="text-xs text-[#6E4A3E]">
                      {eventDate} · {pass.eventVenue}
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#EFE0CC] pt-3.5 flex justify-end">
                  {confirmCancelId === pass.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(null)}
                        className="min-h-[36px] rounded-full border border-[#CFAF8E] px-3.5 text-xs font-medium text-[#4F2D23]"
                      >
                        Keep Pass
                      </button>
                      <button
                        type="button"
                        disabled={cancellingId === pass.id}
                        onClick={() => handleConfirmCancel(pass)}
                        className="min-h-[36px] rounded-full bg-[#9E2A1F] px-3.5 text-xs font-semibold text-[#FFFBF4] disabled:opacity-60"
                      >
                        {cancellingId === pass.id ? 'Cancelling...' : 'Confirm Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelId(pass.id)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-medium text-[#7A1F14] hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Cancel Registration</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
