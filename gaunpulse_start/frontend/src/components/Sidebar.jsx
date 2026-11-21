import { ChevronLeft, Leaf, LogOut, X } from 'lucide-react';
import { navigationItems } from '../data/demoData';

export default function Sidebar({ activePage, isOpen, onNavigate, onClose }) {
  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Close navigation"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar__brand">
          <span className="brand-mark" aria-hidden="true">
            <Leaf size={22} strokeWidth={2.4} />
          </span>
          <div>
            <strong>GaunPulse</strong>
            <span>The Village That Speaks</span>
          </div>
          <button className="icon-button sidebar__close" type="button" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar__context">
          <span>Municipality workspace</span>
          <strong>Helambu Rural Municipality</strong>
        </div>

        <nav className="sidebar__nav" aria-label="Main menu">
          <span className="sidebar__label">Workspace Navigation</span>
          {navigationItems.map(({ id, label, icon: Icon, badge }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                className={`nav-item ${isActive ? 'is-active' : ''}`}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(id)}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span>{label}</span>
                {badge && (
                  <span className="nav-item__badge" aria-label={`${badge} active items`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__pulse" aria-hidden="true">
            <span />
          </div>
          <div>
            <strong>System Operational</strong>
            <span>MySQL & NetworkX Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
