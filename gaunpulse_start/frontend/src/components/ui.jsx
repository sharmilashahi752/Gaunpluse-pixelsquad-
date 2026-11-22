import { ArrowRight, FlaskConical, AlertCircle, Inbox } from 'lucide-react';

export function Card({ children, className = '', as: Element = 'section', style, ...props }) {
  return <Element className={`card ${className}`.trim()} style={style} {...props}>{children}</Element>;
}

export function CardHeader({ eyebrow, title, description, action }) {
  return (
    <div className="card-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="card-header__action">{action}</div>}
    </div>
  );
}

export function DemoLabel({ compact = false }) {
  return (
    <span className={`demo-label ${compact ? 'demo-label--compact' : ''}`.trim()}>
      <FlaskConical size={12} aria-hidden="true" />
      Fictional demo data
    </span>
  );
}

export function LiveLabel({ text = 'Live System Active', compact = false }) {
  return (
    <span
      className={`demo-label ${compact ? 'demo-label--compact' : ''}`.trim()}
      style={{
        background: '#edf7f1',
        color: '#1b7340',
        borderColor: '#bce3cb',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#1b7340',
          display: 'inline-block',
        }}
      />
      {text}
    </span>
  );
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export function TextButton({ children, onClick, ariaLabel }) {
  return (
    <button className="text-button" type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
      <ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

export function FeatureNotice({ title, children, icon: Icon = AlertCircle }) {
  return (
    <div className="feature-notice" role="note">
      {Icon && (
        <span className="feature-notice__icon">
          <Icon size={18} aria-hidden="true" />
        </span>
      )}
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, actions }) {
  return (
    <div className="page-intro">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-intro__actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title = 'No records found', description, action, icon: Icon = Inbox }) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={22} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3, height = '48px' }) {
  return (
    <div style={{ display: 'grid', gap: '8px', width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            background: '#f1f4ef',
            borderRadius: '6px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

export { default as GaunPulseLogo } from './GaunPulseLogo';
