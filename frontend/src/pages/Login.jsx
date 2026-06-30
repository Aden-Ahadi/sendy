import { useState } from 'react';
import { Warning } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { supabase } from '../lib/supabase';
import { ThemeToggle } from '../components/ThemeToggle';

function SendyIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      className={className}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f5f3ef] dark:bg-[#0f0e0c] px-4 transition-colors duration-200">
      <ThemeToggle />

      <div className="w-full max-w-[340px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <SendyIcon className="w-10 h-10 text-[#202020] dark:text-white mb-4" />
          <h1
            className="text-[21px] font-bold tracking-[-0.025em] text-[#202020] dark:text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sendy
          </h1>
          <p className="text-[#8d8d8d] dark:text-[rgba(252,252,252,0.4)] text-[13px] mt-1">
            Sign in to continue
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-white/[0.04] border border-[rgba(32,32,32,0.09)] dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[0_2px_16px_rgba(32,32,32,0.06)] dark:shadow-none">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-full px-3 py-2.5 text-red-600 dark:text-red-400 text-[12.5px]">
              <Warning size={13} weight="fill" className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-semibold text-[#8d8d8d] dark:text-[rgba(252,252,252,0.4)] uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="team@company.com"
                autoComplete="email"
                required
                className="dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white dark:placeholder:text-[rgba(252,252,252,0.22)] focus-visible:border-[#ea2804] focus-visible:ring-[#ea2804]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-semibold text-[#8d8d8d] dark:text-[rgba(252,252,252,0.4)] uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white dark:placeholder:text-[rgba(252,252,252,0.22)] focus-visible:border-[#ea2804] focus-visible:ring-[#ea2804]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ea2804] text-white font-semibold text-[13.5px] h-10 rounded-full hover:bg-[#ea2804]/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
