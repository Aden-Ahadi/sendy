import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, EyeSlash, DotsThreeVertical, CircleNotch, X } from '@phosphor-icons/react';
import { DeliveryBars, DeliveryLegend } from '../components/DeliveryBars';
import { api } from '../lib/api';
import { buildPreviewHtml } from '../lib/emailPreview';

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
      <span className="inline-flex items-center gap-[5px] px-2.5 py-[5px] rounded-full text-[10px] font-semibold tracking-[0.07em] uppercase bg-[#FBF3DB] text-[#956400]">
        <CircleNotch size={10} weight="bold" className="animate-spin" />
        Sending
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-[5px] px-2.5 py-[5px] rounded-full text-[10px] font-semibold tracking-[0.07em] uppercase bg-[#FDEBEC] text-[#9F2F2D]">
        <X size={10} weight="bold" />
        Failed
      </span>
    );
  }
  return (
    <span className="px-2.5 py-[5px] rounded-full text-[10px] font-semibold tracking-[0.07em] uppercase bg-[#EDF3EC] text-[#346538]">
      Sent
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
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef(null);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteCampaign(campaignId);
      navigate('/');
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

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
  const previewHtml = campaign?.email_content
    ? buildPreviewHtml(campaign.template_shell, campaign.email_content)
    : '';

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
          className="text-[22px] font-bold tracking-[-0.025em] text-[#202020] leading-snug flex-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <SubjectDisplay subject={campaign.subject} />
        </h1>
        <div className="mt-1 flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={campaign.status} />
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            title="More options"
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#8d8d8d] hover:text-[#202020] hover:bg-[rgba(32,32,32,0.06)] transition-all duration-150"
          >
            <DotsThreeVertical size={16} weight="bold" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-8">
        <p className="text-[12.5px] text-[#8d8d8d]">
          {formatDate(campaign.created_at)}
          {campaign.reply_to && (
            <span className="ml-3 pl-3 border-l border-[rgba(32,32,32,0.12)]">Reply-to: {campaign.reply_to}</span>
          )}
        </p>
        {previewHtml && (
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#646464] hover:text-[#202020] transition-colors duration-150"
          >
            {showPreview ? <EyeSlash size={14} /> : <Eye size={14} />}
            {showPreview ? 'Hide email' : 'Preview email'}
          </button>
        )}
      </div>

      {showPreview && previewHtml && (
        <div className="bg-white border border-[rgba(32,32,32,0.08)] rounded-[10px] overflow-hidden mb-6 shadow-[0_2px_8px_rgba(32,32,32,0.04)]">
          <div className="px-5 py-3 border-b border-[rgba(32,32,32,0.07)] flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#8d8d8d] uppercase tracking-wider">
              Email preview
            </span>
            <span className="text-[11px] text-[#8d8d8d] capitalize">{campaign.template_shell || 'minimal'} template</span>
          </div>
          <iframe
            title="Sent email preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            className="w-full h-[520px] border-none"
          />
        </div>
      )}

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

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(32,32,32,0.35)' }}
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2
              className="text-[17px] font-bold text-[#202020] mb-1 tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Delete this campaign?
            </h2>
            <p className="text-[13px] text-[#646464] leading-relaxed mb-6">
              This will permanently remove the campaign and all its delivery logs. There's no way to undo this.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 text-[13px] font-medium text-[#646464] hover:text-[#202020] rounded-full transition-colors duration-150 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.98] rounded-full transition-all duration-150 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
