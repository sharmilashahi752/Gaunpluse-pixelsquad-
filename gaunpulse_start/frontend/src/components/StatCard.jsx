import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, change, tone, icon: Icon, isLive = true }) {
  const isAlert = tone === 'red';
  const TrendIcon = isAlert ? ArrowDownRight : ArrowUpRight;

  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__topline">
        <span className="stat-card__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className="demo-label demo-label--compact" style={{ background: '#eaf5ee', color: '#176342', borderColor: '#b8dfc2', fontWeight: 600 }}>
          📡 Live Data
        </span>
      </div>
      <span className="stat-card__label">{label}</span>
      <strong>{value}</strong>
      <span className="stat-card__change">
        <TrendIcon size={14} aria-hidden="true" />
        {change}
      </span>
    </article>
  );
}

