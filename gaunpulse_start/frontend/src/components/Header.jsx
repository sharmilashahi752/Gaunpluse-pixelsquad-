import { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  Globe,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, onMenuClick, onNavigate }) {
  const {
    user,
    role,
    activeMunicipality,
    municipalities,
    isSystemAdmin,
    isAdmin,
    switchMunicipality,
    logout,
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [issues, setIssues] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSignIn = () => {
    const publicBase = import.meta.env.VITE_PUBLIC_URL || 'http://localhost:5173';
    window.location.href = `${publicBase}/login`;
  };

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

  const municipalityDisplay = activeMunicipality?.name
    ? `${activeMunicipality.name} · ${activeMunicipality.district || 'Nepal'}`
    : 'No municipality assigned · Nepal';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'GP';

  const roleLabel =
    role === 'system_admin'
      ? 'System Administrator'
      : role === 'municipality_admin'
      ? 'Municipality Admin'
      : role === 'ward_officer'
      ? `Ward ${user?.ward_number || 1} Officer`
      : 'Guest User';

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div className="topbar__title">
        <button
          className="icon-button menu-button"
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={21} />
        </button>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={13} style={{ color: '#267153' }} />
            {municipalityDisplay}
          </span>
          <strong>{title}</strong>
        </div>
      </div>

      <div className="topbar__actions">
        {/* System Admin Workspace Switcher */}
        {isSystemAdmin && municipalities.length > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#eef5f1',
              border: '1px solid #cce2d6',
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '12px',
            }}
          >
            <Globe size={13} color="#123D30" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#123D30' }}>Workspace:</span>
            <select
              value={activeMunicipality?.id || 'all'}
              onChange={(e) => switchMunicipality(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#123D30',
                fontSize: '11.5px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
              aria-label="Switch active municipality workspace"
            >
              <option value="all">All Municipalities (Nationwide)</option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.district})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Citizen Portal Switcher */}
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

        {/* Profile / Auth Button */}
        {user ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="profile-button"
              type="button"
              aria-label="Open profile menu"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
            >
              <span className="profile-button__avatar" aria-hidden="true">
                {userInitials}
              </span>
              <span className="profile-button__copy">
                <strong>{user.name}</strong>
                <small>{roleLabel}</small>
              </span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => logout()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1a5443')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#123D30')}
              title={`Sign out (${user.name})`}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#123D30',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a5443')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#123D30')}
            title="Sign In to GaunPulse"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid #e6ece6',
              paddingBottom: '8px',
            }}
          >
            <strong style={{ fontSize: '13px', color: '#172e25', fontWeight: 600 }}>
              Municipal Alerts ({unreadCount})
            </strong>
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
              <p style={{ margin: 0, fontSize: '12px', color: '#66786d', padding: '12px 0', textAlign: 'center' }}>
                No active alerts in queue.
              </p>
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
      {showProfile && user && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            right: '24px',
            width: '300px',
            background: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(18, 61, 48, 0.15)',
            border: '1px solid #d9e3db',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#123D30',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {userInitials}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#172e25', fontSize: '14px' }}>{user.name}</div>
              <small style={{ color: '#66786d', fontSize: '11.5px' }}>{user.email}</small>
            </div>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              color: '#172e25',
              borderTop: '1px solid #e6ece6',
              paddingTop: '10px',
              display: 'grid',
              gap: '6px',
            }}
          >
            <div>
              <strong style={{ color: '#66786d', fontWeight: 500 }}>Municipality:</strong>{' '}
              {activeMunicipality?.name || 'Unassigned'}
            </div>
            <div>
              <strong style={{ color: '#66786d', fontWeight: 500 }}>Role:</strong> {roleLabel}
            </div>
            {user.ward_number && (
              <div>
                <strong style={{ color: '#66786d', fontWeight: 500 }}>Assigned Ward:</strong> Ward {user.ward_number}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#1b7340',
                marginTop: '4px',
                fontWeight: 600,
                fontSize: '11px',
              }}
            >
              <ShieldCheck size={14} /> Authorized Municipal Workspace
            </div>
          </div>

          {/* Action Links */}
          <div
            style={{
              borderTop: '1px solid #e6ece6',
              marginTop: '12px',
              paddingTop: '8px',
              display: 'grid',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowProfile(false);
                onNavigate?.('profile-settings');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#172e25',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f7f3')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Settings size={14} color="#66786d" />
              <span>Profile & Password Settings</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  onNavigate?.('user-management');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#172e25',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f7f3')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Users size={14} color="#66786d" />
                <span>User & Ward Management</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  onNavigate?.('audit-logs');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#172e25',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f7f3')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Shield size={14} color="#66786d" />
                <span>Audit Logs & Security Trail</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowProfile(false);
                handleSignIn();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#267153',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f7f3')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <KeyRound size={14} color="#267153" />
              <span>Switch Account / Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowProfile(false);
                logout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#a83228',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fdf3f2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} color="#a83228" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
