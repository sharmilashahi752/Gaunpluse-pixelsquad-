import { ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomeBanner({ onExplore }) {
  return (
    <section className="welcome-banner" aria-labelledby="welcome-title">
      <div className="welcome-banner__copy">
        <span className="welcome-banner__eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          Good morning, Asha
        </span>
        <h1 id="welcome-title">Listen to the village.<br />Act with confidence.</h1>
        <p>See what communities are reporting, understand infrastructure impacts, and focus today’s response.</p>
        <button className="button button--primary" type="button" onClick={onExplore}>
          Explore village map
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="welcome-scene" aria-hidden="true">
        <span className="welcome-scene__sun" />
        <span className="welcome-scene__mountain welcome-scene__mountain--back" />
        <span className="welcome-scene__mountain welcome-scene__mountain--front" />
        <span className="welcome-scene__terrace welcome-scene__terrace--one" />
        <span className="welcome-scene__terrace welcome-scene__terrace--two" />
        <span className="welcome-scene__house welcome-scene__house--one" />
        <span className="welcome-scene__house welcome-scene__house--two" />
        <span className="welcome-scene__tree welcome-scene__tree--one" />
        <span className="welcome-scene__tree welcome-scene__tree--two" />
      </div>
    </section>
  );
}
