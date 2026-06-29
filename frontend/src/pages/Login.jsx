import { useState } from 'react';
import { PaperPlaneTilt, Warning } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { supabase } from '../lib/supabase';

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
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#202020] px-4">
      <div className="w-full max-w-[340px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-full bg-[#ea2804] flex items-center justify-center mb-4">
            <PaperPlaneTilt size={20} weight="fill" className="text-white" />
          </div>
          <h1 className="text-white text-[21px] font-bold tracking-[-0.025em]" style={{ fontFamily: 'var(--font-display)' }}>Sendy</h1>
          <p className="text-[rgba(252,252,252,0.45)] text-[13px] mt-1">Sign in to continue</p>
        </div>

        {/* Form */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-2.5 text-red-400 text-[12.5px]">
              <Warning size={13} weight="fill" className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-[rgba(252,252,252,0.45)] uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="team@company.com"
                autoComplete="email"
                required
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-[rgba(252,252,252,0.25)] focus-visible:border-[#ea2804] focus-visible:ring-[#ea2804]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-[rgba(252,252,252,0.45)] uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-[rgba(252,252,252,0.25)] focus-visible:border-[#ea2804] focus-visible:ring-[#ea2804]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ea2804] text-white font-semibold text-[13.5px] h-10 rounded-full hover:bg-[#ea2804]/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
