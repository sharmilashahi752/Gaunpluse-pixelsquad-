import { Building2, ChevronRight, MapPin, X } from 'lucide-react';
import { navigationItems } from '../data/demoData';
import { useVillageSelection } from '../context/VillageSelectionContext';
import { useAuth } from '../context/AuthContext';
import gaunpulseLogo from '../assets/gaunpulse-logo.png';

export default function Sidebar({ activePage, isOpen, onNavigate, onClose }) {
  const { selectedVillage } = useVillageSelection();
  const { activeMunicipality, isAdmin, user } = useAuth();

  const municipalityName =
    activeMunicipality?.name ||
    selectedVillage?.municipality ||
    (selectedVillage ? `${selectedVillage.name} (${selectedVillage.district || ''})`.trim() : null) ||
    'Select a municipality';

  const locationDetail = user?.ward_number
    ? `Ward ${user.ward_number} Officer Scope`
    : selectedVillage
    ? `Ward ${selectedVillage.ward_no || '1'} · ${selectedVillage.name}`
    : 'Click to select active village';

  const visibleNavItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

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
        {/* Brand Area with Official Logo */}
        <div className="sidebar__brand">
          <div className="sidebar__brand-identity">
            <div className="sidebar__logo-wrapper" aria-hidden="true">
              <img
                src={gaunpulseLogo}
                alt="GaunPulse official emblem"
                className="sidebar__logo-img"
                loading="eager"
              />
            </div>
            <div className="sidebar__brand-copy">
              <strong className="sidebar__brand-title">GaunPulse</strong>
              <span className="sidebar__brand-tagline">The Village That Speaks</span>
            </div>
          </div>
          <button
            className="icon-button sidebar__close"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Municipality Workspace Card */}
        <div
          className="sidebar__context"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('village-data')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('village-data');
            }
          }}
          aria-label={`Current Municipality Workspace: ${municipalityName}. Click to open Village Data Manager.`}
          title="Click to view or switch village workspace in Village Data Manager"
        >
          <div className="sidebar__context-header">
            <span className="sidebar__context-eyebrow">
              <Building2 size={11} strokeWidth={2.4} aria-hidden="true" />
              Municipality Workspace
            </span>
            <ChevronRight size={13} className="sidebar__context-arrow" aria-hidden="true" />
          </div>
          <strong className="sidebar__context-title">{municipalityName}</strong>
          <span className="sidebar__context-subtext">
            <MapPin size={10} strokeWidth={2.2} aria-hidden="true" />
            {locationDetail}
          </span>
        </div>

        {/* Main Workspace Navigation */}
        <nav className="sidebar__nav" aria-label="Main menu">
          <span className="sidebar__label">Workspace Navigation</span>
          {visibleNavItems.map(({ id, label, icon: Icon, badge }) => {
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

        {/* System Operational Footer */}
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
