import { useEffect, useState } from 'react';
import { Bell, Check, ChevronDown, Menu, Search, ShieldCheck, User, X } from 'lucide-react';

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
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #dfe6df',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '13px', color: '#092d22' }}>Municipal Alerts ({unreadCount})</strong>
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>
          <div style={{ display: 'grid', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {issues.slice(0, 4).map((iss) => (
              <div
                key={iss.id}
                style={{ padding: '8px 10px', background: '#faf9f5', borderRadius: '6px', fontSize: '12px', borderLeft: `3px solid ${iss.severity === 'critical' ? '#c94b46' : '#248157'}` }}
              >
                <div style={{ fontWeight: 'bold', color: '#092d22' }}>{iss.title}</div>
                <small style={{ color: '#687c73' }}>{iss.village?.name || 'Village'} · {iss.status}</small>
              </div>
            ))}
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
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #dfe6df',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#176342', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>
              AS
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#092d22', fontSize: '14px' }}>Asha Shrestha</div>
              <small style={{ color: '#687c73' }}>Municipal Technical Officer</small>
            </div>
          </div>
          <div style={{ fontSize: '11.5px', color: '#19392f', borderTop: '1px solid #dfe6df', paddingTop: '10px', display: 'grid', gap: '4px' }}>
            <div><strong>Municipality:</strong> Helambu Gaunpalika</div>
            <div><strong>Role:</strong> Administrator / Planner</div>
            <div><strong>Database:</strong> ServBay MySQL 8.4 (Active)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#176342', marginTop: '4px', fontWeight: 'bold' }}>
              <ShieldCheck size={14} /> Authorized Municipal Session
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
