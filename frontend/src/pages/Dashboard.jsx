import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PaperPlaneTilt, EnvelopeSimple, ArrowRight, CircleNotch, X } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DeliveryBars } from '../components/DeliveryBars';
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

function SkeletonCard() {
  return (
    <div className="bg-white border border-[rgba(32,32,32,0.08)] rounded-[10px] p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-20 bg-[#f3f0e8] rounded-full" />
        <div className="h-4 w-24 bg-[#f3f0e8] rounded" />
      </div>
      <div className="h-5 w-2/3 bg-[#f3f0e8] rounded mb-5" />
      <div className="flex gap-6 mb-4">
        {[0,1,2].map(i => <div key={i} className="h-5 w-16 bg-[#f3f0e8] rounded" />)}
      </div>
      <div className="flex gap-[2px]">
        {Array.from({ length: 40 }).map(i => <div key={i} className="flex-1 h-[22px] rounded-[2px] bg-[#f3f0e8]" />)}
      </div>
    </div>
  );
}

function CampaignCard({ campaign, index }) {
  const reduce = useReducedMotion();
  const total  = campaign.total_recipients || 0;
  const sent   = campaign.successful || 0;
  const failed = campaign.failed || 0;
  const rate   = total ? Math.round((sent / total) * 100) : 0;

  const date = new Date(campaign.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/campaigns/${campaign.campaign_id}`}
        className="block bg-white border border-[rgba(32,32,32,0.08)] rounded-[10px] p-5 shadow-[0_2px_8px_rgba(32,32,32,0.04)] hover:shadow-[0_8px_24px_rgba(32,32,32,0.09)] hover:border-[rgba(32,32,32,0.14)] transition-all duration-200 group"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={campaign.status} />
          <span className="text-[12px] text-[#8d8d8d] flex-shrink-0 mt-0.5">{date}</span>
        </div>

        <div className="text-[15px] font-semibold text-[#202020] tracking-tight mb-4 leading-snug">
          <SubjectDisplay subject={campaign.subject} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 mb-3">
          {[
            { label: 'Total',  value: total.toLocaleString() },
            { label: 'Sent',   value: sent.toLocaleString() },
            { label: 'Failed', value: failed.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-bold text-[#202020] tabular-nums tracking-tight">{s.value}</span>
              <span className="text-[12px] text-[#8d8d8d]">{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[13px] font-semibold text-[#202020] tabular-nums">
            {rate}%
            <ArrowRight size={12} className="text-[#8d8d8d] group-hover:translate-x-0.5 transition-transform duration-150" />
          </div>
        </div>

        {/* Delivery bars — aggregate mode, no per-log data on cards */}
        <DeliveryBars
          total={total}
          sent={sent}
          failed={failed}
          status={campaign.status}
        />
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      setCampaigns(prev => {
        if (prev.some(c => c.status === 'sending')) load();
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSent   = campaigns.reduce((s, c) => s + (c.successful || 0), 0);
  const totalFailed = campaigns.reduce((s, c) => s + (c.failed || 0), 0);
  const successRate = totalSent + totalFailed
    ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-baseline gap-2">
          <h1
            className="text-[26px] font-bold tracking-[-0.03em] text-[#202020] leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Campaigns
          </h1>
          {!loading && campaigns.length > 0 && (
            <span className="text-[13px] text-[#8d8d8d] tabular-nums">{campaigns.length}</span>
          )}
        </div>
        <Link to="/campaigns/new" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <PaperPlaneTilt size={13} weight="fill" />
          New campaign
        </Link>
      </div>

      {/* Stats — bone tiles */}
      {campaigns.length > 0 && !loading && (
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Campaigns',   value: campaigns.length },
            { label: 'Emails sent', value: totalSent.toLocaleString() },
            { label: 'Failed',      value: totalFailed.toLocaleString() },
            { label: 'Success rate', value: `${successRate}%` },
          ].map(stat => (
            <div key={stat.label} className="bg-[#f3f0e8] rounded-[10px] px-5 py-4">
              <div className="text-[11px] text-[#8d8d8d] font-medium uppercase tracking-wider mb-1.5">
                {stat.label}
              </div>
              <div
                className="text-[24px] font-bold tracking-[-0.03em] tabular-nums text-[#202020] leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-red-600 text-[13px] mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f3f0e8] flex items-center justify-center mb-4">
            <EnvelopeSimple size={22} className="text-[#8d8d8d]" />
          </div>
          <h3
            className="text-[17px] font-bold tracking-[-0.02em] text-[#202020] mb-1.5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No campaigns yet
          </h3>
          <p className="text-[13px] text-[#646464] mb-5 max-w-[240px] leading-relaxed">
            Create your first campaign to start sending personalized emails.
          </p>
          <Link to="/campaigns/new" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
            <PaperPlaneTilt size={13} weight="fill" />
            Create a campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <CampaignCard key={c.campaign_id} campaign={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
