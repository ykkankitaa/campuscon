import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Copy, IdCard, User } from 'lucide-react';
import { CampusEvent, EventRegistration } from '../types';
import { MapleDivider } from './AutumnBotanicals';

interface RegistrationPanelProps {
  events: CampusEvent[];
  selectedEventId: number | null;
  onSelectEventId: (eventId: number | null) => void;
  onRegistered: (registration: EventRegistration) => void;
  onOpenPasses: () => void;
}

export function RegistrationPanel({
  events,
  selectedEventId,
  onSelectEventId,
  onRegistered,
  onOpenPasses,
}: RegistrationPanelProps) {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedPass, setConfirmedPass] = useState<EventRegistration | null>(null);
  const [copied, setCopied] = useState(false);

  const openEvents = events.filter((ev) => ev.status !== 'completed');

  useEffect(() => {
    if (selectedEventId === null && openEvents.length > 0) {
      onSelectEventId(openEvents[0].id);
    }
  }, [openEvents, selectedEventId, onSelectEventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmedPass(null);

    if (!selectedEventId) {
      setError('Please select a campus event.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: studentName.trim(),
          studentId: studentId.trim(),
          eventId: selectedEventId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Could not complete registration.');
        return;
      }

      setConfirmedPass(data.registration);
      onRegistered(data.registration);
      setStudentId('');
    } catch {
      setError('Network error while submitting registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access unavailable
    }
  };

  return (
    <section
      aria-labelledby="register-heading"
      className="relative overflow-hidden rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-6 sm:p-10 shadow-sm"
    >
      <div className="relative z-10 mx-auto max-w-md text-center">
        <h1
          id="register-heading"
          className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#5D1F18] [text-wrap:balance]"
        >
          Welcome!
        </h1>

        <MapleDivider />

        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5D1F18]">
          Register
        </h2>
        <p className="mt-1.5 text-sm text-[#6E4A3E]">
          Reserve your seat and receive an instant Campus Connect pass.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5 text-left">
          <div>
            <label htmlFor="cc-student-name" className="sr-only">
              Name
            </label>
            <div className="relative flex items-center">
              <User
                className="pointer-events-none absolute left-4 h-4 w-4 text-[#7D4B3B]"
                aria-hidden="true"
              />
              <input
                id="cc-student-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Name"
                className="min-h-[44px] w-full rounded-full border border-[#D4B494] bg-[#FDF8F0] py-2.5 pl-11 pr-4 text-sm text-[#3B1813] placeholder:text-[#8E695B] transition-colors focus:border-[#6E241C] focus:bg-[#FFFBF4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E241C]/25"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cc-student-id" className="sr-only">
              Student Id
            </label>
            <div className="relative flex items-center">
              <IdCard
                className="pointer-events-none absolute left-4 h-4 w-4 text-[#7D4B3B]"
                aria-hidden="true"
              />
              <input
                id="cc-student-id"
                type="text"
                required
                minLength={3}
                maxLength={24}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Id (e.g. CC-2026-0412)"
                className="min-h-[44px] w-full rounded-full border border-[#D4B494] bg-[#FDF8F0] py-2.5 pl-11 pr-4 text-sm text-[#3B1813] placeholder:text-[#8E695B] transition-colors focus:border-[#6E241C] focus:bg-[#FFFBF4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E241C]/25"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cc-event-select" className="sr-only">
              Event
            </label>
            <div className="relative flex items-center">
              <Calendar
                className="pointer-events-none absolute left-4 h-4 w-4 text-[#7D4B3B]"
                aria-hidden="true"
              />
              <select
                id="cc-event-select"
                required
                value={selectedEventId ?? ''}
                onChange={(e) =>
                  onSelectEventId(e.target.value ? Number(e.target.value) : null)
                }
                className="min-h-[44px] w-full appearance-none rounded-full border border-[#D4B494] bg-[#FDF8F0] py-2.5 pl-11 pr-8 text-sm text-[#3B1813] transition-colors focus:border-[#6E241C] focus:bg-[#FFFBF4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E241C]/25"
              >
                {openEvents.length === 0 ? (
                  <option value="">No open events available</option>
                ) : (
                  openEvents.map((ev) => {
                    const remaining = Math.max(0, ev.capacity - ev.registeredCount);
                    return (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({remaining} seats left)
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-[#C84B31]/40 bg-[#FDECE8] px-4 py-2.5 text-xs font-medium text-[#7A1F14]"
            >
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={submitting || openEvents.length === 0}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#6E241C] px-8 py-2.5 text-sm font-semibold text-[#FFFBF4] transition-colors duration-150 hover:bg-[#561B15] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C]"
            >
              <span>{submitting ? 'Registering...' : 'Register'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>

        {confirmedPass && (
          <div className="mt-6 rounded-xl border border-[#CFAF8E] bg-[#F7EBDC] p-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#4B1A13]">
                <CheckCircle2 className="h-4 w-4 text-[#2E6B3E] shrink-0" aria-hidden="true" />
                <span>Registration Confirmed</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(confirmedPass.passCode)}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-[#6E241C] hover:underline whitespace-nowrap shrink-0"
              >
                <span className="tabular-nums">{confirmedPass.passCode}</span>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="mt-1.5 text-sm font-medium text-[#3B1813]">
              {confirmedPass.eventTitle}
            </p>
            <p className="mt-0.5 text-xs text-[#6E4A3E] tabular-nums">
              {confirmedPass.studentName} · {confirmedPass.studentId} · {confirmedPass.eventVenue}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={onOpenPasses}
                className="text-xs font-semibold text-[#6E241C] underline-offset-2 hover:underline"
              >
                View in My Passes →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
