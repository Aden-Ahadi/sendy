import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function successRate(campaign) {
  if (!campaign?.total_recipients) return 0;
  return Math.round((campaign.successful / campaign.total_recipients) * 100);
}

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | success | failed
  const pollRef = useRef(null);

  async function load() {
    try {
      const data = await api.getCampaignLogs(campaignId);
      setCampaign(data.campaign);
      setLogs(data.logs);
      setError('');
    } catch (err) {
      setError('Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [campaignId]);

  // Poll every 3s while campaign is sending
  useEffect(() => {
    if (campaign?.status === 'sending') {
      pollRef.current = setInterval(load, 3000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [campaign?.status]);

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const rate = campaign ? successRate(campaign) : 0;
  const sent = campaign?.successful || 0;
  const total = campaign?.total_recipients || 0;
  const isSending = campaign?.status === 'sending';

  return (
    <div>
      <Link to="/" className="back-link">← All Campaigns</Link>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /> Loading…</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : campaign ? (
        <>
          {/* Header */}
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ maxWidth: 500 }}>{campaign.subject}</h1>
                <StatusBadge status={campaign.status} />
              </div>
              <div className="page-title-sub">
                {formatDate(campaign.created_at)}
                {campaign.reply_to && ` · Reply-to: ${campaign.reply_to}`}
              </div>
            </div>
          </div>

          {/* Live progress bar (while sending) */}
          {isSending && (
            <div className="send-progress">
              <div className="send-progress-bar-wrap">
                <div
                  className="send-progress-bar"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="send-progress-label">
                {sent} / {total} sent
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-label">Total</div>
              <div className="stat-card-value">{total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Sent</div>
              <div className="stat-card-value success">{sent}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Failed</div>
              <div className="stat-card-value error">{campaign.failed || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Success Rate</div>
              <div className="stat-card-value primary">{rate}%</div>
            </div>
            {campaign.completed_at && (
              <div className="stat-card">
                <div className="stat-card-label">Completed</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                  {formatDate(campaign.completed_at)}
                </div>
              </div>
            )}
          </div>

          {/* Logs table */}
          <div className="table-wrap">
            <div className="table-header">
              <h3>Recipient Log ({logs.length})</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', 'success', 'failed'].map(f => (
                  <button
                    key={f}
                    className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Attempt</th>
                  <th>Sent At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      {logs.length === 0
                        ? isSending
                          ? 'Sending in progress…'
                          : 'No logs yet.'
                        : `No ${filter} emails.`}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.recipient_name || '—'}</td>
                      <td className="td-muted">{log.recipient_email}</td>
                      <td>
                        <span className={log.status === 'success' ? 'td-success' : 'td-error'}>
                          {log.status === 'success' ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                      <td className="td-muted">{log.attempt}</td>
                      <td className="td-muted">{formatDate(log.created_at)}</td>
                      <td style={{ color: 'var(--error)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.error || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
