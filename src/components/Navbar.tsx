import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ActiveView } from '../types';
import { MapleLeafIcon } from './AutumnBotanicals';

interface NavbarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onQuickRegisterAction: () => void;
}

const NAV_ITEMS: { id: ActiveView; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'events', label: 'Events' },
  { id: 'organizations', label: 'Organization' },
  { id: 'passes', label: 'My Passes' },
];

export function Navbar({
  activeView,
  onNavigate,
  onQuickRegisterAction,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (view: ActiveView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#DFC7AD] bg-[#FAF1E4]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C] rounded-md"
        >
          <MapleLeafIcon className="h-6 w-6 shrink-0" color="#C8521E" />
          <span className="font-serif text-xl font-bold tracking-tight text-[#3B1813]">
            Campus Connect
          </span>
        </button>

        {/* Zone 2: Single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5D372B]"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C] rounded-sm ${
                  active
                    ? 'font-semibold text-[#6E241C]'
                    : 'text-[#5D372B] hover:text-[#3B1813]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#6E241C]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onQuickRegisterAction();
              setMobileOpen(false);
            }}
            className="hidden md:inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#6E241C] px-5 py-2 text-sm font-semibold text-[#FFFBF4] transition-colors duration-150 hover:bg-[#561B15] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C]"
          >
            Register Now
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#CFAF8E] bg-[#FFFBF4] text-[#3B1813] hover:bg-[#F3E2CE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E241C]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#DFC7AD] bg-[#FDF8F0] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#F3E2CE] font-semibold text-[#6E241C]'
                      : 'text-[#4F2D23] hover:bg-[#F6E8D7]'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="mt-2 pt-2 border-t border-[#DFC7AD]">
              <button
                type="button"
                onClick={() => {
                  onQuickRegisterAction();
                  setMobileOpen(false);
                }}
                className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#6E241C] px-4 text-sm font-semibold text-[#FFFBF4]"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
