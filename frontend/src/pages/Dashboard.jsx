import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

function successRate(c) {
  if (!c.total_recipients) return 0;
  return Math.round((c.successful / c.total_recipients) * 100);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Refresh every 5s if any campaign is still sending
    const interval = setInterval(() => {
      setCampaigns(prev => {
        if (prev.some(c => c.status === 'sending')) {
          load();
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSent = campaigns.reduce((s, c) => s + (c.successful || 0), 0);
  const totalFailed = campaigns.reduce((s, c) => s + (c.failed || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Campaigns</h1>
          <div className="page-title-sub">{campaigns.length} total</div>
        </div>
        <Link to="/campaigns/new" className="btn btn-primary">
          + New Campaign
        </Link>
      </div>

      {campaigns.length > 0 && (
        <div className="stats-row" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-label">Campaigns</div>
            <div className="stat-card-value primary">{campaigns.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Emails Sent</div>
            <div className="stat-card-value success">{totalSent.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Failed</div>
            <div className="stat-card-value error">{totalFailed.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Success Rate</div>
            <div className="stat-card-value">
              {totalSent + totalFailed
                ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
                : 0}%
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          Loading campaigns…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✉</div>
          <h3>No campaigns yet</h3>
          <p>Create your first campaign to start sending personalized emails.</p>
          <Link to="/campaigns/new" className="btn btn-primary">
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.map(c => {
            const rate = successRate(c);
            return (
              <Link to={`/campaigns/${c.campaign_id}`} key={c.campaign_id} className="campaign-card">
                <div className="campaign-card-top">
                  <StatusBadge status={c.status} />
                  <span className="campaign-date">{formatDate(c.created_at)}</span>
                </div>
                <div className="campaign-subject">{c.subject}</div>
                <div className="campaign-mini-stats">
                  <div className="mini-stat">
                    <span className="mini-stat-value">{c.total_recipients}</span>
                    <span className="mini-stat-label">Total</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value success">{c.successful}</span>
                    <span className="mini-stat-label">Sent</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value error">{c.failed}</span>
                    <span className="mini-stat-label">Failed</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">{rate}%</span>
                    <span className="mini-stat-label">Success</span>
                  </div>
                </div>
                <div className="campaign-progress">
                  <div
                    className="campaign-progress-bar"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
