import React, { useEffect, useState } from 'react';
import { citizenService, citizenAuth } from './citizenApi';
import CitizenDashboard from './CitizenDashboard';
import SubmitComplaint from './SubmitComplaint';
import MyComplaints from './MyComplaints';
import NotificationsPage from './NotificationsPage';
import ProfilePage from './ProfilePage';
import logoImg from '../assets/gaunpulse-logo.png';
import { translations } from './citizenI18n';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bell,
  User,
  LogOut,
  ArrowRight,
  Menu,
  X,
  ShieldAlert,
  Home,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import './CitizenPortal.css';

export default function CitizenPortal({ onSwitchToAdmin }) {
  const [user, setUser] = useState(citizenAuth.getUser());
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('gaunpulse_lang') || 'ne';
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    contact_number: '',
    ward_number: '1',
  });
  const [page, setPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const t = translations[lang] || translations.ne;

  const handleLangToggle = (selectedLang) => {
    setLang(selectedLang);
    localStorage.setItem('gaunpulse_lang', selectedLang);
  };

  useEffect(() => {
    citizenService
      .me()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAuth(event) {
    event.preventDefault();
    setError('');
    setAuthSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await citizenService.login({
          email: form.email,
          password: form.password,
        });
        setUser(res.user);
      } else {
        const res = await citizenService.register(form);
        setUser(res.user);
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat().join(' ')
          : err.response?.data?.message || t.errGeneral || 'Authentication failed. Please verify your details.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    await citizenService.logout();
    setUser(null);
  }

  // Pre-fill quick citizen demo login
  function quickDemoFill() {
    setMode('login');
    setForm({
      name: 'Bikram Thapa',
      email: 'citizen@gaunpulse.gov.np',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      contact_number: '+977-9841234567',
      ward_number: '1',
    });
  }

  if (loading) {
    return (
      <main className="citizen-loading-screen">
        <div className="citizen-spinner" />
        <p>{t.loading || 'Connecting to GaunPulse Citizen Network...'}</p>
      </main>
    );
  }

  // Auth Screen if not logged in
  if (!user) {
    return (
      <main className="citizen-auth-page">
        <section className="citizen-auth-brand">
          <div className="auth-logo-row">
            <img src={logoImg} alt="GaunPulse Official Logo" className="brand-logo" />
            <div>
              <p className="brand-title">GaunPulse</p>
              <span className="brand-tagline">The Village That Speaks</span>
            </div>
          </div>
          <h1>{t.signInTitle || 'The Village That Speaks'}</h1>
          <p className="brand-subtitle">
            {t.signInSubtitle ||
              'Report rural infrastructure hazards directly to ward engineers and track municipal repair action live.'}
          </p>

          <div className="admin-switch-banner">
            <span>{t.adminPrompt || 'Are you a municipal officer or system administrator?'}</span>
            <button
              type="button"
              className="citizen-text-button admin-link"
              onClick={() => {
                if (onSwitchToAdmin) onSwitchToAdmin();
                else window.location.hash = '#/dashboard';
              }}
            >
              {t.adminDashboard || 'Switch to Municipal Admin Dashboard'} <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section className="citizen-auth-card-wrap">
          <div className="citizen-auth-card">
            {/* Language Switcher Pill */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#f1f5f3',
                  borderRadius: '20px',
                  padding: '3px',
                  border: '1px solid #d4e0d9',
                  gap: '4px',
                }}
              >
                <Globe size={13} style={{ marginLeft: '6px', color: '#314e3f' }} />
                <button
                  type="button"
                  onClick={() => handleLangToggle('ne')}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: lang === 'ne' ? '#123D30' : 'transparent',
                    color: lang === 'ne' ? '#ffffff' : '#314e3f',
                    transition: 'all 0.15s ease',
                  }}
                >
                  नेपाली
                </button>
                <button
                  type="button"
                  onClick={() => handleLangToggle('en')}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: lang === 'en' ? '#123D30' : 'transparent',
                    color: lang === 'en' ? '#ffffff' : '#314e3f',
                    transition: 'all 0.15s ease',
                  }}
                >
                  English
                </button>
              </div>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                {t.signInTab || 'Sign In'}
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                {t.registerTab || 'Register Account'}
              </button>
            </div>

            <div className="auth-card-header">
              <h2>{mode === 'login' ? (lang === 'ne' ? 'नागरिक प्रवेश' : 'Citizen Sign In') : (lang === 'ne' ? 'नयाँ नागरिक खाता' : 'Register Citizen Account')}</h2>
              <p>
                {mode === 'login'
                  ? (lang === 'ne' ? 'आफ्ना उजुरीहरूको प्रगति हेर्न र नयाँ समस्या दर्ता गर्न प्रवेश गर्नुहोस्।' : 'Access your submitted reports and live status updates.')
                  : (lang === 'ne' ? 'आफ्नो नाम, इमेल र वडा नम्बर राखी आधिकारिक नागरिक खाता खोल्नुहोस्।' : 'Register with your verified email and ward information.')}
              </p>
            </div>

            <form onSubmit={handleAuth} className="citizen-auth-form">
              {mode === 'register' && (
                <>
                  <label>
                    {t.fullName || 'Full Name *'}
                    <input
                      required
                      placeholder="e.g. Maya Devi Shrestha"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>

                  <div className="form-row-2">
                    <label>
                      {t.phoneNumber || 'Contact Phone'}
                      <input
                        placeholder="+977-98..."
                        value={form.contact_number}
                        onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                      />
                    </label>
                    <label>
                      {t.wardNumber || 'Ward Number'}
                      <input
                        type="number"
                        min="1"
                        max="33"
                        value={form.ward_number}
                        onChange={(e) => setForm({ ...form, ward_number: e.target.value })}
                      />
                    </label>
                  </div>
                </>
              )}

              <label>
                {t.emailAddress || 'Email Address *'}
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>

              <label>
                {t.password || 'Password *'}
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder={lang === 'ne' ? 'कम्तीमा ८ अक्षरको पासवर्ड' : 'Minimum 8 characters'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>

              {mode === 'register' && (
                <label>
                  {t.confirmPassword || 'Confirm Password *'}
                  <input
                    required
                    type="password"
                    placeholder={lang === 'ne' ? 'पासवर्ड फेरि लेख्नुहोस्' : 'Repeat password'}
                    value={form.password_confirmation}
                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                  />
                </label>
              )}

              {error && <p className="citizen-message error">{error}</p>}

              <button type="submit" className="citizen-primary auth-submit-btn" disabled={authSubmitting}>
                {authSubmitting
                  ? (t.pleaseWait || 'Please wait...')
                  : mode === 'login'
                  ? (t.signInButton || 'Sign In to Citizen Portal')
                  : (t.registerButton || 'Create Verified Account')}
              </button>

              <button type="button" className="citizen-text-button demo-btn" onClick={quickDemoFill}>
                {t.demoAccount || 'Demo Account: citizen@gaunpulse.gov.np'}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: t.overview || 'Overview', icon: LayoutDashboard },
    { id: 'submit', label: t.reportIncident || 'Report Incident', icon: PlusCircle },
    { id: 'complaints', label: t.myReports || 'My Reports', icon: FileText },
    { id: 'notifications', label: t.officialNotices || 'Official Notices', icon: Bell },
    { id: 'profile', label: t.myProfile || 'My Profile', icon: User },
  ];

  return (
    <main className="citizen-shell">
      {/* Sidebar Navigation */}
      <aside className={`citizen-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="citizen-brand">
          <img src={logoImg} alt="GaunPulse Logo" className="brand-mini-logo" />
          <div className="brand-text">
            <strong>GaunPulse</strong>
            <small>{t.brandSubtitle || 'Citizen Service Portal'}</small>
          </div>
        </div>

        <nav className="citizen-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setPage(item.id);
                  setMenuOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Switch back to Admin Dashboard Pill */}
        <div className="sidebar-switch-box">
          <span>{t.adminPrompt || 'Municipal Administration:'}</span>
          <button
            type="button"
            className="switch-admin-btn"
            onClick={() => {
              if (onSwitchToAdmin) onSwitchToAdmin();
              else window.location.hash = '#/dashboard';
            }}
          >
            <Home size={15} /> {t.backToAdmin || 'Back to Admin Dashboard'}
          </button>
        </div>

        {/* User Card */}
        <div className="citizen-user-card">
          <div className="citizen-avatar">
            {user.name ? user.name.slice(0, 1).toUpperCase() : 'C'}
          </div>
          <div className="user-details">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <button type="button" className="citizen-logout-btn" onClick={handleLogout}>
          <LogOut size={15} /> {t.signOut || 'Sign Out'}
        </button>
      </aside>

      {/* Main Content Area */}
      <section className="citizen-content">
        <header className="citizen-topbar">
          <button
            type="button"
            className="menu-toggle-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="topbar-brand-mobile">
            <img src={logoImg} alt="GaunPulse" className="topbar-logo" />
            <strong>GaunPulse Citizen</strong>
          </div>

          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Topbar Language Toggle Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#ffffff',
                borderRadius: '20px',
                padding: '3px',
                border: '1px solid #d4e0d9',
                gap: '2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <button
                type="button"
                onClick={() => handleLangToggle('ne')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: lang === 'ne' ? '#123D30' : 'transparent',
                  color: lang === 'ne' ? '#ffffff' : '#314e3f',
                  transition: 'all 0.15s ease',
                }}
              >
                नेपाली
              </button>
              <button
                type="button"
                onClick={() => handleLangToggle('en')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: lang === 'en' ? '#123D30' : 'transparent',
                  color: lang === 'en' ? '#ffffff' : '#314e3f',
                  transition: 'all 0.15s ease',
                }}
              >
                English
              </button>
            </div>

            <button
              type="button"
              className="topbar-admin-switch"
              onClick={() => {
                if (onSwitchToAdmin) onSwitchToAdmin();
                else window.location.hash = '#/dashboard';
              }}
            >
              <Home size={14} /> {t.adminDashboard || 'Admin Dashboard'}
            </button>
          </div>
        </header>

        <div className="citizen-main-body">
          {page === 'dashboard' && (
            <CitizenDashboard
              lang={lang}
              onNavigate={setPage}
              onViewComplaint={(id) => {
                setSelectedComplaintId(id);
                setPage('complaints');
              }}
            />
          )}

          {page === 'submit' && (
            <SubmitComplaint
              lang={lang}
              onNavigate={setPage}
              onViewComplaint={(id) => {
                setSelectedComplaintId(id);
                setPage('complaints');
              }}
            />
          )}

          {page === 'complaints' && (
            <MyComplaints
              lang={lang}
              selectedComplaintId={selectedComplaintId}
              onSelectComplaint={setSelectedComplaintId}
            />
          )}

          {page === 'notifications' && (
            <NotificationsPage
              lang={lang}
              onNavigate={setPage}
              onViewComplaint={(id) => {
                setSelectedComplaintId(id);
                setPage('complaints');
              }}
            />
          )}

          {page === 'profile' && <ProfilePage lang={lang} user={user} onLogout={handleLogout} />}
        </div>
      </section>
    </main>
  );
}
