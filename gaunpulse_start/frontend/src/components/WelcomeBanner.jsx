import { ArrowRight, MapPin, Plus } from 'lucide-react';

export default function WelcomeBanner({ userName = 'Asha', onExplore, onReportIssue }) {
  return (
    <section className="welcome-banner" aria-labelledby="welcome-title">
      <div className="welcome-banner__copy">
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
