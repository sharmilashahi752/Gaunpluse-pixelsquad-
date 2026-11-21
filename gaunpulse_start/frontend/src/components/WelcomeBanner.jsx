import { ArrowRight, Database, MapPin, Plus } from 'lucide-react';

export default function WelcomeBanner({ userName = 'Asha', onExplore, onReportIssue }) {
  return (
    <section className="welcome-banner" aria-labelledby="welcome-title">
      <div className="welcome-banner__copy">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="welcome-banner__eyebrow" style={{ margin: 0 }}>
            Good morning, {userName}
          </span>
          <span style={{ fontSize: '12px', color: '#cad7cf' }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#66786d', background: '#f1f4ef', padding: '2px 8px', borderRadius: '4px', border: '1px solid #d9e3db' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1b7340' }} />
            MySQL 8.4 Connected
          </span>
        </div>
        <h1 id="welcome-title">Here's what needs attention across your municipality.</h1>
        <p>Active monitoring of rural lifelines, bridge health, and community disruption reports across municipal wards.</p>
        <div className="welcome-banner__action">
          <button className="button button--primary" type="button" onClick={onExplore}>
            <MapPin size={15} aria-hidden="true" />
            Explore Village Map
          </button>
          {onReportIssue && (
            <button className="button button--secondary" type="button" onClick={onReportIssue}>
              <Plus size={15} aria-hidden="true" />
              Report Issue
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
