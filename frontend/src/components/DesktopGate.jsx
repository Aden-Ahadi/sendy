import { SignOut } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';

function MonitorIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
    </svg>
  );
}

function SendyMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="w-[18px] h-[18px]">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function DesktopGate({ children }) {
  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <>
      {/* ── Small / medium screen wall ─────────────────────────────────────── */}
      <div className="lg:hidden min-h-[100dvh] bg-[#f5f3ef] dark:bg-[#0f0e0c]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(32,32,32,0.07)] dark:border-[rgba(255,250,240,0.07)]">
          <div className="flex items-center gap-2.5 text-[#202020] dark:text-white">
            <SendyMark />
            <span className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Sendy
            </span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#8d8d8d] dark:text-[#625e59] hover:text-[#202020] dark:hover:text-[#edeae4] hover:bg-[rgba(32,32,32,0.07)] dark:hover:bg-[rgba(255,250,240,0.08)] transition-all duration-150"
          >
            <SignOut size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-full max-w-[320px]">

            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1c1b19] border border-[rgba(32,32,32,0.08)] dark:border-[rgba(255,250,240,0.08)] shadow-[0_2px_12px_rgba(32,32,32,0.06)] dark:shadow-none flex items-center justify-center mx-auto mb-7">
              <MonitorIcon className="w-8 h-8 text-[#202020] dark:text-[#edeae4]" />
            </div>

            <h1
              className="text-[24px] font-bold tracking-[-0.025em] text-[#202020] dark:text-[#edeae4] mb-3 leading-snug"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Open on a desktop
            </h1>

            <p className="text-[15px] text-[#646464] dark:text-[#8a8680] leading-relaxed mb-8">
              Sendy is designed for larger screens. For the full experience, open this on a laptop or desktop.
            </p>

            <div className="rounded-2xl bg-white dark:bg-[#1c1b19] border border-[rgba(32,32,32,0.08)] dark:border-[rgba(255,250,240,0.08)] px-5 py-4 text-left">
              <p className="text-[11px] font-semibold text-[#8d8d8d] dark:text-[#625e59] uppercase tracking-wider mb-2">
                Why desktop only?
              </p>
              <p className="text-[14px] text-[#646464] dark:text-[#8a8680] leading-relaxed">
                Sending bulk campaigns, reviewing delivery logs, and composing email content all need the space that only a full-size screen can give you.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ── Desktop / laptop app ───────────────────────────────────────────── */}
      <div className="hidden lg:block">
        {children}
      </div>
    </>
  );
}
