import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, change, tone = 'green', icon: Icon, onClick, loading = false }) {
  const isAlert = tone === 'red';
  const TrendIcon = isAlert ? ArrowDownRight : ArrowUpRight;

  return (
    <article
      className={`stat-card stat-card--${tone}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ' ? onClick() : null) : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="stat-card__topline">
        <span className="stat-card__icon">
          <Icon size={18} aria-hidden="true" />
        </span>
        {onClick && (
          <span style={{ fontSize: '11px', color: '#66786d', fontWeight: 500 }}>
            View details →
          </span>
        )}
      </div>
      <span className="stat-card__label">{label}</span>
      {loading ? (
        <div style={{ height: '32px', width: '60px', background: '#f1f4ef', borderRadius: '4px', margin: '4px 0 6px', animation: 'pulse 1.5s infinite' }} />
      ) : (
        <strong>{value}</strong>
      )}
      <span className="stat-card__change">
        <TrendIcon size={13} aria-hidden="true" />
        {change}
      </span>
    </article>
  );
}
