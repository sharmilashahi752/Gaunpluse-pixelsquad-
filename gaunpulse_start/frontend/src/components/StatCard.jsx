import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { DemoLabel } from './ui';

export default function StatCard({ label, value, change, tone, icon: Icon }) {
  const isAlert = tone === 'red';
  const TrendIcon = isAlert ? ArrowDownRight : ArrowUpRight;

  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__topline">
        <span className="stat-card__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
        <DemoLabel compact />
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
