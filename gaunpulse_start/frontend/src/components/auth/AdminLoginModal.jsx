import { useState } from 'react';
import { KeyRound, Lock, LogIn, Mail, ShieldAlert, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import gaunpulseLogo from '../../assets/gaunpulse-logo.png';

export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      if (result.success) {
        onSuccess?.(result.user);
        onClose?.();
      } else {
        setError(result.message || 'Authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 61, 48, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 12px 36px rgba(18, 61, 48, 0.2)',
          border: '1px solid #d9e3db',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#123D30',
            color: '#ffffff',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={gaunpulseLogo}
              alt="GaunPulse"
              style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain' }}
            />
            <div>
              <strong style={{ fontSize: '15px', display: 'block', fontWeight: 700 }}>
                Municipal Staff Sign In
              </strong>
              <span style={{ fontSize: '11px', color: '#a3c2b4' }}>
                Secure workspace access for authorized officers
              </span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          {(error || authError) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: '#fdf3f2',
                border: '1px solid #f2c7c4',
                borderRadius: '8px',
                color: '#a83228',
                fontSize: '12.5px',
                marginBottom: '16px',
              }}
            >
              <ShieldAlert size={16} />
              <span>{error || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#172e25',
                  marginBottom: '6px',
                }}
              >
                Official Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#66786d',
                  }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@municipality.gov.np"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    border: '1px solid #d9e3db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#172e25',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#172e25',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#66786d',
                  }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    border: '1px solid #d9e3db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#172e25',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '11px',
                background: '#123D30',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s ease',
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Sign In to Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #e6ece6',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#66786d',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
              }}
            >
              Quick Test Credentials
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('system_admin@gaunpulse.gov.np', 'Admin@123')}
                style={{
                  textAlign: 'left',
                  padding: '7px 10px',
                  background: '#f7f7f3',
                  border: '1px solid #e4e8e4',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span><strong>System Admin</strong> (All Municipalities)</span>
                <span style={{ color: '#267153', fontWeight: 600 }}>Fill</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.dailekh@gaunpulse.gov.np', 'Admin@123')}
                style={{
                  textAlign: 'left',
                  padding: '7px 10px',
                  background: '#f7f7f3',
                  border: '1px solid #e4e8e4',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span><strong>Municipality Admin</strong> (Dailekh)</span>
                <span style={{ color: '#267153', fontWeight: 600 }}>Fill</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ward1.dailekh@gaunpulse.gov.np', 'Admin@123')}
                style={{
                  textAlign: 'left',
                  padding: '7px 10px',
                  background: '#f7f7f3',
                  border: '1px solid #e4e8e4',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span><strong>Ward 1 Officer</strong> (Mahabu Ward 1)</span>
                <span style={{ color: '#267153', fontWeight: 600 }}>Fill</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
