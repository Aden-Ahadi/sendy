import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Layout({ session }) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const email = session?.user?.email || '';
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">✉</span>
          <div>
            <div className="sidebar-brand-name">Sendy</div>
            <div className="sidebar-brand-tag">Send smarter, not harder</div>
          </div>
        </div>

        <ul className="sidebar-nav">
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">📊</span>
              Campaigns
            </NavLink>
          </li>
          <li>
            <NavLink to="/campaigns/new" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">✉</span>
              New Campaign
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initial}</div>
            <div className="sidebar-user-email">{email}</div>
          </div>
          <button className="sidebar-signout" onClick={handleSignOut}>
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
