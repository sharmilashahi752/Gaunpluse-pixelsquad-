import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { demoDisclaimer, pageMeta } from '../data/demoData';

export default function AppLayout({ activePage, onNavigate, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavOpen]);

  const navigate = (page) => {
    onNavigate(page);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar
        activePage={activePage}
        isOpen={mobileNavOpen}
        onNavigate={navigate}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="app-shell__body">
        <Header title={pageMeta[activePage]?.title || 'Dashboard'} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="main-content" id="main-content" tabIndex="-1">
          {children}
          <footer className="app-footer">
            <span>GaunPulse · The Village That Speaks</span>
            <span>{demoDisclaimer}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
