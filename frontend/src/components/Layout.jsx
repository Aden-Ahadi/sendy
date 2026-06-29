import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ChartBar, PaperPlaneTilt, SignOut, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';

function NavItem({ to, end, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative group flex items-center py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          collapsed ? 'justify-center px-0 w-10 mx-auto' : 'gap-2.5 px-3'
        } ${
          isActive
            ? 'bg-[#ea2804]/[0.14] text-white'
            : 'text-[rgba(252,252,252,0.45)] hover:bg-white/[0.07] hover:text-white'
        }`
      }
    >
      <Icon size={15} weight="fill" className="flex-shrink-0" />

      {/* Label — visible when expanded */}
      {!collapsed && <span>{label}</span>}

      {/* Tooltip — visible on hover when collapsed */}
      {collapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-[#202020] border border-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {label}
        </span>
      )}
    </NavLink>
  );
}

export default function Layout({ session }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const email = session?.user?.email || '';
  const initial = email.charAt(0).toUpperCase();

  return (
    /* Outer div: no overflow-hidden so sidebar tooltips can bleed right */
    <div className="flex h-screen bg-[#f9f7f3]">

      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col bg-[#202020] select-none transition-[width] duration-200 ease-in-out overflow-visible"
        style={{ width: collapsed ? 56 : 220 }}
      >
        {/* Brand */}
        <div className={`flex items-center h-[60px] border-b border-white/[0.07] ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-5'}`}>
          <PaperPlaneTilt size={16} weight="fill" className="text-[#ea2804] flex-shrink-0" />
          {!collapsed && (
            <span className="text-white text-[15px] font-semibold tracking-tight truncate">Sendy</span>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-3 ${collapsed ? 'px-0 flex flex-col items-center gap-0.5' : 'px-3 space-y-0.5'}`}>
          <NavItem to="/" end icon={ChartBar} label="Campaigns" collapsed={collapsed} />
          <NavItem to="/campaigns/new" icon={PaperPlaneTilt} label="New campaign" collapsed={collapsed} />
        </nav>

        {/* Collapse toggle */}
        <div className={`py-2 border-t border-white/[0.07] flex ${collapsed ? 'justify-center' : 'px-4 justify-end'}`}>
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-[rgba(252,252,252,0.3)] hover:text-white hover:bg-white/[0.07] transition-all duration-150"
          >
            {collapsed
              ? <CaretDoubleRight size={13} />
              : <CaretDoubleLeft size={13} />}
          </button>
        </div>

        {/* User footer */}
        <div className={`py-3 border-t border-white/[0.07] ${collapsed ? 'px-0 flex flex-col items-center gap-2' : 'px-3'}`}>
          {collapsed ? (
            <div className="relative group">
              <div className="w-7 h-7 rounded-full bg-[#ea2804] flex items-center justify-center text-[11px] font-bold text-white cursor-default">
                {initial}
              </div>
              {/* Tooltip for avatar when collapsed */}
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-[#202020] border border-white/10 px-2.5 py-1.5 text-[12px] text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-[#ea2804] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                {initial}
              </div>
              <span className="text-[rgba(252,252,252,0.4)] text-[11.5px] truncate flex-1">{email}</span>
              <button
                onClick={handleSignOut}
                className="text-[rgba(252,252,252,0.3)] hover:text-white transition-colors duration-150 p-1 rounded"
                title="Sign out"
              >
                <SignOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[860px] mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
