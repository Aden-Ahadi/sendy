import { cn } from '@/lib/utils';

// 90 bars → each is ~6px wide on a typical card, matching the uptime-chart aesthetic
const NUM_BARS = 90;

// `background` values, not `backgroundColor`, so gradients work inline
const STYLES = {
  sent:    { background: 'linear-gradient(to top, #6ee7b7, #d1fae5)' },
  failed:  { background: '#fca5a5' },
  mixed:   { background: '#fde68a' },
  pending: { background: 'rgba(32, 32, 32, 0.07)' },
};

function buildBars({ total, sent, failed, logs, status }) {
  if (logs && logs.length > 0) {
    const sorted = [...logs].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    return Array.from({ length: NUM_BARS }).map((_, i) => {
      const start = Math.floor((i / NUM_BARS) * total);
      const end   = Math.floor(((i + 1) / NUM_BARS) * total);
      const chunk = sorted.slice(start, end);
      if (chunk.length === 0) {
        return { style: STYLES.pending, label: status === 'sending' ? 'Pending' : 'Not reached' };
      }
      const ok   = chunk.filter(l => l.status === 'success').length;
      const bad  = chunk.length - ok;
      const rate = ok / chunk.length;
      if (rate >= 0.9) return { style: STYLES.sent,    label: `${ok} delivered` };
      if (rate <= 0.1) return { style: STYLES.failed,  label: `${bad} failed` };
      return { style: STYLES.mixed, label: `${ok} sent, ${bad} failed` };
    });
  }

  // Aggregate: green → red → pending, left to right
  const sentBars   = Math.round((sent   / total) * NUM_BARS);
  const failedBars = Math.round((failed / total) * NUM_BARS);
  return Array.from({ length: NUM_BARS }).map((_, i) => {
    if (i < sentBars)              return { style: STYLES.sent,    label: 'Delivered' };
    if (i < sentBars + failedBars) return { style: STYLES.failed,  label: 'Failed' };
    return { style: STYLES.pending, label: status === 'sending' ? 'Pending' : 'Not sent' };
  });
}

export function DeliveryBars({ total, sent, failed, logs, status, className }) {
  if (!total) return null;
  const bars = buildBars({ total, sent, failed, logs, status });

  return (
    <div className={cn('flex items-end gap-[2px]', className)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          title={bar.label}
          className="flex-1 h-[32px] rounded-[2px] hover:opacity-75 transition-opacity duration-100 cursor-default"
          style={bar.style}
        />
      ))}
    </div>
  );
}

export function DeliveryLegend({ sent, failed, total }) {
  const pending = total - sent - failed;
  const items = [
    { bg: 'linear-gradient(to top, #6ee7b7, #d1fae5)', label: `${sent.toLocaleString()} delivered` },
    ...(failed  > 0 ? [{ bg: '#fca5a5',                label: `${failed.toLocaleString()} failed` }]   : []),
    ...(pending > 0 ? [{ bg: 'rgba(32,32,32,0.18)',    label: `${pending.toLocaleString()} pending` }] : []),
  ];
  return (
    <div className="flex items-center gap-4 mt-2">
      {items.map(item => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-[#8d8d8d]">
          <span
            className="w-[6px] h-[6px] rounded-[1px] inline-block flex-shrink-0"
            style={{ background: item.bg }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
