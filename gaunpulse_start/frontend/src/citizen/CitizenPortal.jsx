import React, { useEffect, useState } from 'react';
import { citizenService, citizenAuth } from './citizenApi';
import CitizenDashboard from './CitizenDashboard';
import SubmitComplaint from './SubmitComplaint';
import MyComplaints from './MyComplaints';
import NotificationsPage from './NotificationsPage';
import ProfilePage from './ProfilePage';
import logoImg from '../assets/gaunpulse-logo.png';
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
} from 'lucide-react';
import './CitizenPortal.css';

export default function CitizenPortal({ onSwitchToAdmin }) {
  const [user, setUser] = useState(citizenAuth.getUser());
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
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

  useEffect(() => {
    citizenService
      .me()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        // Unauthenticated or invalid token
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
          : err.response?.data?.message || 'Authentication failed. Please verify your details.'
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
        <p>Connecting to GaunPulse Citizen Network...</p>
      </main>
    );
  }

  // Auth Screen if not logged in
  if (!user) {
    return (
      <main className="citizen-auth-page">
        <section className="citizen-auth-brand">
          <div className="auth-logo-row">
            <img src={logoImg} alt="GaunPulse Logo" className="brand-logo" />
            <div>
              <p className="brand-title">GaunPulse</p>
              <span className="brand-tagline">The Village That Speaks</span>
            </div>
          </div>
          <h1>Empowering citizens to report hazards, track repairs, and strengthen rural lifelines.</h1>
          <p className="brand-subtitle">
            Directly connected to municipal decision engines, GIS infrastructure mapping, and emergency response teams across Nepal.
          </p>

          <div className="admin-switch-banner">
            <span>Are you a municipal officer or system administrator?</span>
            <button
              type="button"
              className="citizen-text-button admin-link"
              onClick={() => {
                if (onSwitchToAdmin) onSwitchToAdmin();
                else window.location.hash = '#/dashboard';
              }}
            >
              Switch to Municipal Admin Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section className="citizen-auth-card-wrap">
          <div className="citizen-auth-card">
            <div className="auth-tabs">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Create Account
              </button>
            </div>

            <div className="auth-card-header">
              <h2>{mode === 'login' ? 'Citizen Sign In' : 'Register Citizen Account'}</h2>
              <p>
                {mode === 'login'
                  ? 'Access your submitted reports and live status updates.'
                  : 'Register with your verified email and ward information.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="citizen-auth-form">
              {mode === 'register' && (
                <>
                  <label>
                    Full Name *
                    <input
                      required
                      placeholder="e.g. Maya Devi Shrestha"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>

                  <div className="form-row-2">
                    <label>
                      Contact Phone
                      <input
                        placeholder="+977-98..."
                        value={form.contact_number}
                        onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                      />
                    </label>
                    <label>
                      Ward Number
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
                Email Address *
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>

              <label>
                Password *
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>

              {mode === 'register' && (
                <label>
                  Confirm Password *
                  <input
                    required
                    type="password"
                    placeholder="Repeat password"
                    value={form.password_confirmation}
                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                  />
                </label>
              )}

              {error && <p className="citizen-message error">{error}</p>}

              <button type="submit" className="citizen-primary auth-submit-btn" disabled={authSubmitting}>
                {authSubmitting
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In to Citizen Portal'
                  : 'Create Verified Account'}
              </button>

              <button type="button" className="citizen-text-button demo-btn" onClick={quickDemoFill}>
                Demo Account: citizen@gaunpulse.gov.np
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'submit', label: 'Report Incident', icon: PlusCircle },
    { id: 'complaints', label: 'My Reports', icon: FileText },
    { id: 'notifications', label: 'Official Notices', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <main className="citizen-shell">
      {/* Sidebar Navigation */}
      <aside className={`citizen-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="citizen-brand">
          <img src={logoImg} alt="GaunPulse Logo" className="brand-mini-logo" />
          <div className="brand-text">
            <strong>GaunPulse</strong>
            <small>Citizen Service Portal</small>
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
          <span>Municipal Administration:</span>
          <button
            type="button"
            className="switch-admin-btn"
            onClick={() => {
              if (onSwitchToAdmin) onSwitchToAdmin();
              else window.location.hash = '#/dashboard';
            }}
          >
            <Home size={15} /> Back to Admin Dashboard
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
          <LogOut size={15} /> Sign Out
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

          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-admin-switch"
              onClick={() => {
                if (onSwitchToAdmin) onSwitchToAdmin();
                else window.location.hash = '#/dashboard';
              }}
            >
              <Home size={14} /> Admin Dashboard
            </button>
          </div>
        </header>

        <div className="citizen-main-body">
          {page === 'dashboard' && (
            <CitizenDashboard
              onNavigate={setPage}
              onViewComplaint={(id) => {
                setSelectedComplaintId(id);
                setPage('complaints');
              }}
            />
          )}

          {page === 'submit' && (
            <SubmitComplaint
              onNavigate={setPage}
              onViewComplaint={(id) => {
                setSelectedComplaintId(id);
                setPage('complaints');
              }}
            />
          )}

          {page === 'complaints' && (
            <MyComplaints
              selectedComplaintId={selectedComplaintId}
              onSelectComplaint={setSelectedComplaintId}
            />
          )}

          {page === 'notifications' && (
            <NotificationsPage
              onNavigate={setPage}
              onViewComplaint={(id) => {
                setSelectedComplaintId(id);
                setPage('complaints');
              }}
            />
          )}

          {page === 'profile' && <ProfilePage user={user} onLogout={handleLogout} />}
        </div>
      </section>
    </main>
  );
}
