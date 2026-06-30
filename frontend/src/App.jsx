import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { DesktopGate } from './components/DesktopGate';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewCampaign from './pages/NewCampaign';
import CampaignDetail from './pages/CampaignDetail';

function Splash() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#18181B]">
      <div className="flex items-center gap-2.5 opacity-80">
        <PaperPlaneTilt size={22} weight="fill" color="#ffffff" />
        <span className="text-white text-[17px] font-semibold tracking-tight">Sendy</span>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return <Splash />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          element={
            <ProtectedRoute session={session}>
              <DesktopGate>
                <Layout session={session} />
              </DesktopGate>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns/new" element={<NewCampaign />} />
          <Route path="/campaigns/:campaignId" element={<CampaignDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
