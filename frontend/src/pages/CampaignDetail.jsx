import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import { DeliveryBars, DeliveryLegend } from '../components/DeliveryBars';
import { api } from '../lib/api';

function SubjectDisplay({ subject }) {
  const parts = subject.split(/(\{\{\w+\}\})/);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{(\w+)\}\}$/);
        if (match) {
          return (
            <span
              key={i}
              className="inline-block align-middle bg-[#f3f0e8] text-[#8d8d8d] text-[10px] px-1.5 py-0.5 rounded-[4px] font-mono leading-none mx-0.5"
            >
              {match[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function StatusBadge({ status }) {
  if (status === 'sending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Sending
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-600 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f0faf5] text-[#2b9a66] border border-[#c3e9d7]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#2b9a66]" />
      Completed
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const pollRef = useRef(null);

  async function load() {
    try {
      const data = await api.getCampaignLogs(campaignId);
      setCampaign(data.campaign);
      setLogs(data.logs);
      setError('');
    } catch {
      setError('Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [campaignId]);

  useEffect(() => {
    if (campaign?.status === 'sending') {
      pollRef.current = setInterval(load, 3000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [campaign?.status]);

  const filteredLogs = logs.filter(l => filter === 'all' || l.status === filter);
  const total   = campaign?.total_recipients || 0;
  const sent    = campaign?.successful || 0;
  const failed  = campaign?.failed || 0;
  const rate    = total ? Math.round((sent / total) * 100) : 0;
  const isSending = campaign?.status === 'sending';

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-4 w-16 bg-[#f3f0e8] rounded" />
        <div className="h-7 w-80 bg-[#f3f0e8] rounded" />
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-[#f3f0e8] rounded-[10px] px-5 py-4">
              <div className="h-3 w-16 bg-[#ede9df] rounded mb-3" />
              <div className="h-8 w-10 bg-[#ede9df] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-[#8d8d8d] hover:text-[#202020] text-[13px] font-medium mb-6 transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-red-600 text-[13px]">{error}</div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[#8d8d8d] hover:text-[#202020] text-[13px] font-medium mb-6 transition-colors duration-150"
      >
        <ArrowLeft size={14} />
        All campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start gap-3 mb-1">
        <h1
          className="text-[22px] font-bold tracking-[-0.025em] text-[#202020] leading-snug"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <SubjectDisplay subject={campaign.subject} />
        </h1>
        <div className="mt-1 flex-shrink-0">
          <StatusBadge status={campaign.status} />
        </div>
      </div>
      <p className="text-[12.5px] text-[#8d8d8d] mb-8">
        {formatDate(campaign.created_at)}
        {campaign.reply_to && (
          <span className="ml-3 pl-3 border-l border-[rgba(32,32,32,0.12)]">Reply-to: {campaign.reply_to}</span>
        )}
      </p>

      {/* Delivery bars — chronological mode using per-recipient logs */}
      <div className="bg-white border border-[rgba(32,32,32,0.08)] rounded-[10px] px-5 py-4 mb-6 shadow-[0_2px_8px_rgba(32,32,32,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isSending && <Clock size={13} className="text-[#8d8d8d]" />}
            <span className="text-[12px] font-medium text-[#8d8d8d] uppercase tracking-wider">
              Delivery timeline
            </span>
          </div>
          <span className="text-[13px] font-semibold tabular-nums text-[#202020]">
            {sent.toLocaleString()} / {total.toLocaleString()}
          </span>
        </div>

        <DeliveryBars
          total={total}
          sent={sent}
          failed={failed}
          logs={logs}
          status={campaign.status}
        />
        <DeliveryLegend total={total} sent={sent} failed={failed} />
      </div>

      {/* Stats — bone tiles */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total',        value: total.toLocaleString() },
          { label: 'Sent',         value: sent.toLocaleString() },
          { label: 'Failed',       value: failed.toLocaleString() },
          { label: 'Success rate', value: `${rate}%` },
        ].map(stat => (
          <div key={stat.label} className="bg-[#f3f0e8] rounded-[10px] px-5 py-4">
            <div className="text-[11px] text-[#8d8d8d] font-medium uppercase tracking-wider mb-1.5">
              {stat.label}
            </div>
            <div
              className="text-[26px] font-bold tracking-[-0.03em] tabular-nums text-[#202020] leading-none"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-white border border-[rgba(32,32,32,0.08)] rounded-[10px] overflow-hidden shadow-[0_2px_8px_rgba(32,32,32,0.04)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(32,32,32,0.07)]">
          <h2 className="text-[14px] font-semibold text-[#202020]">
            Recipient log
            <span className="ml-2 text-[#8d8d8d] font-normal text-[13px]">{logs.length}</span>
          </h2>
          <div className="flex items-center gap-1 bg-[#f3f0e8] rounded-full p-0.5">
            {[
              { key: 'all',     label: 'All' },
              { key: 'success', label: 'Sent' },
              { key: 'failed',  label: 'Failed' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-all duration-100 ${
                  filter === f.key
                    ? 'bg-white text-[#202020] shadow-sm'
                    : 'text-[#8d8d8d] hover:text-[#202020]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f9f7f3] border-b border-[rgba(32,32,32,0.07)]">
              {['Name', 'Email', 'Status', 'Sent at', 'Error'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-medium text-[#8d8d8d] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[#8d8d8d] text-[13px]">
                  {logs.length === 0
                    ? isSending ? 'Sending in progress...' : 'No logs yet.'
                    : `No ${filter} emails.`}
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr
                  key={log.id}
                  className="border-b border-[rgba(32,32,32,0.06)] last:border-0 hover:bg-[#f9f7f3] transition-colors duration-100"
                >
                  <td className="px-5 py-3 text-[13px] font-medium text-[#202020]">
                    {log.recipient_name || '-'}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#646464]">{log.recipient_email}</td>
                  <td className="px-5 py-3">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#202020]">
                        <CheckCircle size={14} weight="fill" className="text-[#2b9a66]" />
                        Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#646464]">
                        <XCircle size={14} weight="fill" className="text-red-500" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-[#8d8d8d]">{formatDate(log.created_at)}</td>
                  <td className="px-5 py-3 text-[12px] text-red-500 max-w-[200px] truncate" title={log.error || ''}>
                    {log.error || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
