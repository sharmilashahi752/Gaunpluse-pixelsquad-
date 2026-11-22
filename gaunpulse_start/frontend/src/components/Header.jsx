import { useEffect, useState } from 'react';
import { Bell, Check, ChevronDown, Menu, Search, ShieldCheck, User, Users, X } from 'lucide-react';

export default function Header({ title, onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [issues, setIssues] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/issues')
      .then((res) => res.json())
      .then((data) => {
        const list = data.data || data || [];
        setIssues(list);
        setUnreadCount(list.filter((i) => i.status === 'submitted').length);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div className="topbar__title">
        <button className="icon-button menu-button" type="button" onClick={onMenuClick} aria-label="Open navigation menu">
          <Menu size={21} />
        </button>
        <div>
          <span>Helambu Rural Municipality · Nepal</span>
          <strong>{title}</strong>
        </div>
      </div>

      <div className="topbar__actions">
        <button
          type="button"
          className="citizen-portal-pill-btn"
          onClick={() => {
            window.location.hash = '#/citizen';
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#123D30',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1e5a44';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#123D30';
          }}
          title="Switch to Citizen Public Complaint & Tracking Portal"
        >
          <Users size={14} />
          <span>Citizen Portal</span>
        </button>

        <label className="header-search">
          <span className="sr-only">Search workspace</span>
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search village lifelines..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.location.hash = '#/issues-alerts';
              }
            }}
          />
        </label>

        {/* Notifications Button */}
        <button
          className="icon-button notification-button"
          type="button"
          aria-label={`Notifications, ${unreadCount} unread`}
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowProfile(false);
          }}
        >
          <Bell size={19} />
          {unreadCount > 0 && <span aria-hidden="true">{unreadCount}</span>}
        </button>

        {/* Profile Button */}
        <button
          className="profile-button"
          type="button"
          aria-label="Open profile menu"
          onClick={() => {
            setShowProfile(!showProfile);
            setShowNotifications(false);
          }}
        >
          <span className="profile-button__avatar" aria-hidden="true">AS</span>
          <span className="profile-button__copy">
            <strong>Asha Shrestha</strong>
            <small>Municipal Planner</small>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>

      {/* Notifications Popover */}
      {showNotifications && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            right: '180px',
            width: '320px',
            background: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(18, 61, 48, 0.12)',
            border: '1px solid #d9e3db',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e6ece6', paddingBottom: '8px' }}>
            <strong style={{ fontSize: '13px', color: '#172e25', fontWeight: 600 }}>Municipal Alerts ({unreadCount})</strong>
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#66786d' }}
              aria-label="Close alerts"
            >
              <X size={15} />
            </button>
          </div>
          <div style={{ display: 'grid', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {issues.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: '#66786d', padding: '12px 0', textAlign: 'center' }}>No active alerts in queue.</p>
            ) : (
              issues.slice(0, 4).map((iss) => (
                <div
                  key={iss.id}
                  style={{
                    padding: '9px 12px',
                    background: '#f7f7f3',
                    borderRadius: '6px',
                    fontSize: '12px',
                    borderLeft: `3px solid ${iss.severity === 'critical' ? '#c64f45' : '#267153'}`,
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#172e25' }}>{iss.title}</div>
                  <small style={{ color: '#66786d', fontSize: '11px' }}>
                    {iss.village?.name || 'Village'} · {iss.status}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Profile Popover */}
      {showProfile && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            right: '24px',
            width: '280px',
            background: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(18, 61, 48, 0.12)',
            border: '1px solid #d9e3db',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#267153', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '12px' }}>
              AS
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#172e25', fontSize: '13.5px' }}>Asha Shrestha</div>
              <small style={{ color: '#66786d', fontSize: '11px' }}>Municipal Technical Officer</small>
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: '#172e25', borderTop: '1px solid #e6ece6', paddingTop: '10px', display: 'grid', gap: '5px' }}>
            <div><strong style={{ color: '#66786d', fontWeight: 500 }}>Municipality:</strong> Helambu Gaunpalika</div>
            <div><strong style={{ color: '#66786d', fontWeight: 500 }}>Role:</strong> Administrator / Planner</div>
            <div><strong style={{ color: '#66786d', fontWeight: 500 }}>Database:</strong> MySQL 8.4 (Connected)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1b7340', marginTop: '6px', fontWeight: 600, fontSize: '11px' }}>
              <ShieldCheck size={14} /> Authorized Municipal Session
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
