import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { AboutSection } from './components/AboutSection';
import { EventsSection } from './components/EventsSection';
import { MyPassesSection } from './components/MyPassesSection';
import { Navbar } from './components/Navbar';
import { OrganizationsSection } from './components/OrganizationsSection';
import { OrganizationSpotlight } from './components/OrganizationSpotlight';
import { RegistrationPanel } from './components/RegistrationPanel';
import {
  ActiveView,
  CampusEvent,
  EventFilterTab,
  EventRegistration,
  Organization,
} from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [eventTab, setEventTab] = useState<EventFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [sessionPasses, setSessionPasses] = useState<EventRegistration[]>([]);
  const [lookedUpPasses, setLookedUpPasses] = useState<EventRegistration[]>([]);
  const [loadingPasses, setLoadingPasses] = useState(false);

  const fetchCampusData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [eventsRes, orgsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/organizations'),
      ]);
      if (!eventsRes.ok || !orgsRes.ok) {
        throw new Error('Failed to load campus data.');
      }
      const eventsJson = await eventsRes.json();
      const orgsJson = await orgsRes.json();
      setEvents(eventsJson.events || []);
      setOrganizations(orgsJson.organizations || []);
    } catch {
      setDataError(
        'Could not load campus events and organizations right now. Please try again.'
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchCampusData();
  }, [fetchCampusData]);

  const handleLookupByStudentId = useCallback(async (studentId: string) => {
    setLoadingPasses(true);
    try {
      const res = await fetch(
        `/api/registrations/lookup?studentId=${encodeURIComponent(studentId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setLookedUpPasses(data.registrations || []);
      }
    } catch {
      // Keep current passes
    } finally {
      setLoadingPasses(false);
    }
  }, []);

  const combinedPasses = useMemo(() => {
    const byId = new Map<number, EventRegistration>();
    for (const p of lookedUpPasses) byId.set(p.id, p);
    for (const p of sessionPasses) byId.set(p.id, p);
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [lookedUpPasses, sessionPasses]);

  const homeSpotlightEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? events.filter((ev) =>
          `${ev.title} ${ev.description} ${ev.venue} ${ev.organizationName} ${ev.category}`
            .toLowerCase()
            .includes(q)
        )
      : events;
    return list.slice(0, 3);
  }, [events, searchQuery]);

  const handleRegistered = async (reg: EventRegistration) => {
    setSessionPasses((prev) => [reg, ...prev.filter((p) => p.id !== reg.id)]);
    await fetchCampusData();
  };

  const handleCancelPass = async (registrationId: number, studentId: string) => {
    const res = await fetch(
      `/api/registrations/${registrationId}?studentId=${encodeURIComponent(studentId)}`,
      {
        method: 'DELETE',
      }
    );
    if (res.ok) {
      setSessionPasses((prev) => prev.filter((p) => p.id !== registrationId));
      setLookedUpPasses((prev) => prev.filter((p) => p.id !== registrationId));
      await fetchCampusData();
    }
  };

  const handleQuickRegisterFromList = (eventId: number) => {
    setSelectedEventId(eventId);
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickRegisterNav = () => {
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('cc-student-name')?.focus();
    }, 60);
  };

  const upcomingCount = events.filter((ev) => ev.status === 'upcoming').length;
  const ongoingCount = events.filter((ev) => ev.status === 'ongoing').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF1E4] text-[#3B1813]">
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        onQuickRegisterAction={handleQuickRegisterNav}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {dataError && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#C84B31]/40 bg-[#FDECE8] px-4 py-3 text-sm text-[#7A1F14]"
          >
            <span>{dataError}</span>
            <button
              type="button"
              onClick={fetchCampusData}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#6E241C] px-4 py-1.5 text-xs font-semibold text-[#FFFBF4]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {activeView === 'home' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
              <RegistrationPanel
                events={events}
                selectedEventId={selectedEventId}
                onSelectEventId={setSelectedEventId}
                onRegistered={handleRegistered}
                onOpenPasses={() => setActiveView('passes')}
              />

              <OrganizationSpotlight
                events={events}
                organizationCount={organizations.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenEventsTab={(tab) => {
                  setEventTab(tab);
                  setSelectedOrgId(null);
                  setActiveView('events');
                }}
                onOpenOrganizations={() => setActiveView('organizations')}
              />
            </div>

            <section aria-labelledby="featured-schedule-heading" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DFC7AD] pb-3">
                <div>
                  <h2
                    id="featured-schedule-heading"
                    className="font-serif text-2xl font-bold text-[#5D1F18]"
                  >
                    {searchQuery.trim()
                      ? `Matching Events (${homeSpotlightEvents.length})`
                      : 'On-going & Upcoming Highlights'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEventTab('all');
                    setSelectedOrgId(null);
                    setActiveView('events');
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6E241C] hover:underline whitespace-nowrap shrink-0"
                >
                  <span>Explore Full Calendar</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {loadingData ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-36 rounded-2xl border border-[#E5CEB4] bg-[#FFFBF4]/60 p-5"
                    />
                  ))}
                </div>
              ) : homeSpotlightEvents.length === 0 ? (
                <div className="rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-8 text-center text-sm text-[#6E4A3E]">
                  No campus events match "{searchQuery}". Try another keyword or browse all organizations.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {homeSpotlightEvents.map((ev) => {
                    const seatsLeft = Math.max(0, ev.capacity - ev.registeredCount);
                    return (
                      <article
                        key={ev.id}
                        className="flex flex-col justify-between rounded-2xl border border-[#DFC7AD] bg-[#FFFBF4] p-5"
                      >
                        <div>
                          <div className="text-xs font-medium text-[#7D4B3B]">
                            <span className="font-semibold text-[#C8521E]">
                              {ev.status === 'ongoing' ? 'On-going' : 'Upcoming'}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>{ev.organizationName}</span>
                          </div>
                          <h3 className="mt-1.5 font-serif text-lg font-bold text-[#3B1813]">
                            {ev.title}
                          </h3>
                          <p className="mt-1 text-xs text-[#6E4A3E] tabular-nums">
                            {ev.venue} · {seatsLeft} seats left
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#EFE0CC] flex justify-end">
                          <button
                            type="button"
                            disabled={seatsLeft === 0}
                            onClick={() => handleQuickRegisterFromList(ev.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6E241C] hover:underline disabled:opacity-50"
                          >
                            <span>{seatsLeft === 0 ? 'Full' : 'Select to Register'}</span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {activeView === 'events' && (
          <EventsSection
            events={events}
            organizations={organizations}
            loading={loadingData}
            activeTab={eventTab}
            onTabChange={setEventTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedOrgId={selectedOrgId}
            onClearOrgFilter={() => setSelectedOrgId(null)}
            onQuickRegister={handleQuickRegisterFromList}
            onRefresh={fetchCampusData}
          />
        )}

        {activeView === 'organizations' && (
          <OrganizationsSection
            organizations={organizations}
            loading={loadingData}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectOrgEvents={(orgId) => {
              setSelectedOrgId(orgId);
              setEventTab('all');
              setActiveView('events');
            }}
            onRefresh={fetchCampusData}
          />
        )}

        {activeView === 'passes' && (
          <MyPassesSection
            passes={combinedPasses}
            loading={loadingPasses}
            onLookupByStudentId={handleLookupByStudentId}
            onCancelPass={handleCancelPass}
            onBrowseEvents={() => {
              setEventTab('all');
              setActiveView('events');
            }}
          />
        )}

        {activeView === 'about' && (
          <AboutSection
            organizationCount={organizations.length}
            upcomingCount={upcomingCount}
            ongoingCount={ongoingCount}
            onRegisterClick={() => setActiveView('home')}
          />
        )}
      </main>

      <footer className="border-t border-[#DFC7AD] bg-[#F5E8D6]/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-[#6E4A3E] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="font-serif text-sm font-semibold text-[#4F2D23]">
            Campus Connect
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="hover:text-[#3B1813]"
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setActiveView('events')}
              className="hover:text-[#3B1813]"
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => setActiveView('organizations')}
              className="hover:text-[#3B1813]"
            >
              Organizations
            </button>
            <button
              type="button"
              onClick={() => setActiveView('about')}
              className="hover:text-[#3B1813]"
            >
              About
            </button>
          </div>
          <div>© {new Date().getFullYear()} Campus Connect</div>
        </div>
      </footer>
    </div>
  );
}
