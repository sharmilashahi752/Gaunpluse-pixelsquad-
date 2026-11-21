import { ArrowRight, FlaskConical } from 'lucide-react';

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
      <FlaskConical size={13} aria-hidden="true" />
      Fictional demo data
    </span>
  );
}

export function LiveLabel({ text = 'Live Data', compact = false }) {
  return (
    <span
      className={`demo-label ${compact ? 'demo-label--compact' : ''}`.trim()}
      style={{
        background: '#eaf5ee',
        color: '#176342',
        borderColor: '#b8dfc2',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#16a34a',
          boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.25)',
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
      <ArrowRight size={15} aria-hidden="true" />
    </button>
  );
}

export function FeatureNotice({ title, children, icon: Icon }) {
  return (
    <div className="feature-notice" role="note">
      {Icon && (
        <span className="feature-notice__icon">
          <Icon size={19} aria-hidden="true" />
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
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-intro__actions">{actions}</div>}
    </div>
  );
}
