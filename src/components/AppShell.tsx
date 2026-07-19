"use client";

import { useEffect, useRef, useState } from "react";
import type { CurrentUser } from "@/lib/session";
import Sidebar, { type SidebarBranding } from "@/components/Sidebar";

export default function AppShell({
  user,
  branding,
  children,
}: {
  user: CurrentUser;
  branding: SidebarBranding;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape, trap focus within the drawer, and restore focus on close.
  useEffect(() => {
    if (!mobileOpen) return;

    const drawer = drawerRef.current;
    const openButton = openButtonRef.current;
    // Move focus into the drawer.
    const focusables = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      // Return focus to the button that opened the drawer.
      openButton?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-1">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen lg:block">
        <Sidebar user={user} branding={branding} />
      </div>

      {/* Mobile drawer + backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="เมนูนำทาง"
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          user={user}
          branding={branding}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            ref={openButtonRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 active:scale-95"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from site settings
              <img
                src={branding.logo}
                alt={`โลโก้${branding.schoolName}`}
                className="h-8 w-8 rounded-lg border border-slate-100 object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-800 to-indigo-900 text-sm font-bold text-white">
                สภ
              </div>
            )}
            <span className="text-sm font-bold text-slate-800">
              {branding.siteTitle}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5 lg:px-8 lg:py-8">
            <div className="animate-fade-in-up">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
